from fastapi import APIRouter, Request, HTTPException
from firebase_admin import firestore
from firebase_config import verify_firebase_token
from datetime import datetime
import google.generativeai as genai
import json
import re
import os
from dateutil.relativedelta import relativedelta
import calendar
from collections import defaultdict

router = APIRouter(prefix="/ai", tags=["Financial Advice"])
db = firestore.client()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")
def parse_date_safe(date_str):
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d")
    except Exception as e:

        return None

@router.post("/financial-advice/generate")
def generate_financial_advice(request: Request):
    user_id = verify_firebase_token(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch transactions
    txns_ref = db.collection("users").document(user_id).collection("transactions")
    txns = [doc.to_dict() for doc in txns_ref.stream()]

    # Filter from Jan 1 to today
    jan1 = datetime(datetime.today().year, 1, 1)
    today = datetime.today()
    txns = [t for t in txns if "date" in t and datetime.strptime(t["date"], "%Y-%m-%d") >= jan1]

    # Filter and calculate totals
    income = sum(t["amount"] for t in txns if t["category"] == "Salary")
    expenses = sum(t["amount"] for t in txns if t["type"] == "debit")
    savings = income - expenses
    savings_rate = round((savings / income) * 100, 2) if income else 0

    # Estimate months since Jan 1
    num_months = max((today - jan1).days // 30, 1)

    # Use last full month for budgeting
    today = datetime.today()
    last_month = today.replace(day=1) - relativedelta(months=1)
    last_month_year = last_month.year
    last_month_month = last_month.month

    last_day = calendar.monthrange(last_month_year, last_month_month)[1]

    last_month_start = datetime(last_month_year, last_month_month, 1)
    last_month_end = datetime(last_month_year, last_month_month, last_day)

   
    month_txns = []
    for t in txns:
        dt = parse_date_safe(t.get("date", ""))
        if not dt:
            continue
        if last_month_start <= dt <= last_month_end:
            month_txns.append(t)
      
        



    month_income = sum(
    t["amount"] for t in month_txns
    if t.get("type", "").strip().lower() == "credit"
    )
    month_expenses = sum(
        t["amount"] for t in month_txns
        if t.get("type", "").strip().lower() == "debit"
    )
    month_savings = month_income - month_expenses
    month_savings_rate = round((month_savings / month_income) * 100, 2) if month_income else 0


    # Fetch goals
    goals_ref = db.collection("users").document(user_id).collection("goals")
    goals_docs = goals_ref.stream()
    goals_raw = [doc.to_dict() | {"id": doc.id} for doc in goals_docs]
    # Fetch goal contributions (auto allocated)
    contrib_ref = db.collection("users").document(user_id).collection("goal_contributions")
    contrib_docs = contrib_ref.stream()

    auto_allocated_map = defaultdict(float)
    for doc in contrib_docs:
        data = doc.to_dict()
        auto_allocated_map[data["goal_id"]] += data.get("allocated", 0)
    # Now enhance goal data with total allocation
    today = datetime.today()
    goals = []
    total_goal_required = 0

    for g in goals_raw:
        manual_alloc = g.get("manual_allocated", 0)
        auto_alloc = auto_allocated_map.get(g["id"], 0)
        total_alloc = manual_alloc + auto_alloc

        deadline = datetime.strptime(g["deadline"], "%Y-%m-%d")
        months_left = max((deadline - today).days // 30, 1)
        remaining = g["target_amount"] - total_alloc
        monthly_required = round(remaining / months_left, 2)
        total_goal_required += monthly_required

        g.update({
            "allocated": total_alloc,
            "progress_percent": round((total_alloc / g["target_amount"]) * 100, 2) if g["target_amount"] > 0 else 0,
            "months_left": months_left,
            "required_monthly_saving": monthly_required
        })

        goals.append(g)
        
    # ✅ Ensure required savings per month doesn’t exceed income
    total_goal_required = min(total_goal_required, month_income)

    # Category-wise spending (Jan 1 to today)
    category_map = {}
    for t in txns:
        if t["type"] == "debit":
            cat = t["category"]
            category_map[cat] = category_map.get(cat, 0) + t["amount"]
    category_spending = [{"name": k, "amount": v} for k, v in category_map.items()]

    # Notable transactions (top 3)
    large_txns = sorted(
        [t for t in txns if t["type"] == "debit"],
        key=lambda x: x["amount"],
        reverse=True
    )[:3]

    # Construct prompt inline
    goals_text = "\n".join([
        f"- {g['name']}\n  - Target: ₹{g['target_amount']}, Saved: ₹{g['allocated']},\n  - Deadline: {g['deadline']}, Progress: {g['progress_percent']}%,\n  - Months Left: {g['months_left']}"
        for g in goals
    ])
    category_text = "\n".join([f"- {c['name']}: ₹{c['amount']} spent" for c in category_spending])
    transactions_text = "\n".join([f"- ₹{t['amount']} on {t['category']} — \"{t['title']}\"" for t in large_txns])

    instructions_block ="""
Instructions:

Give a personalized breakdown in **4 sections**:

----

1. `"goal_advice"`  
Use the user’s progress, deadlines, and goal savings to recommend how much they should save **per month** from now onward to reach their goals on time.  
Mention if they are behind, on track, or ahead.

> Example: "You're behind on your Emergency Fund. Save ₹5,000/month to catch up in 6 months."

2. `"recommended_budget"`  
Recommend an ideal **budget per category**, based on:
- Total income and required savings
- Current category spending
- Goal progress and deadlines

Use this smart logic:

1. Calculate `required_savings_per_month` = total goal savings / months left.

2. Calculate `available_to_spend_per_month` = Monthly income - required_savings_per_month.
   - If this is less than ₹0, assume ₹0 available to spend.

 Also compute:  
- `total_available_spending` = available_to_spend_per_month × number of months since Jan 1

3. Dynamically allocate `available_to_spend_per_month` across spending categories:
   - Keep essential categories (Groceries, Utilities, Healthcare) reasonably funded.
   - Reduce allocation to non-essentials (Shopping, Entertainment) if user is behind on goals or has overspent.
   - If the user is ahead on goals, allow flexible allocation.
   - Penalize categories where the user has already overspent.
   - Avoid setting any essential category to ₹0.

4. Multiply each category’s monthly allocation by the number of months since Jan 1 to get the `recommended_budget`.

5. Compare:
   - Actual category spending (from Jan 1 to Today)
   - Versus `recommended_budget` (monthly × months)

For each category:
- If they **spent more than ideal (pro-rated)**, give a short warning/advice:
  > "You spent ₹46,000 on Groceries so far this year. Based on your savings goals, the recommended is ₹35,000. Try to reduce going forward."

- If they **spent within or under the ideal**, give positive encouragement:
  > "You're on track with Transport spending. Great job keeping it at ₹10,500 so far."

Return this as a list of short advice lines. Mix warnings and praise based on user behavior.
---

3. `"positive_messages"`  
Give general motivation or praise beyond category-specific advice.  
> Example: "You're saving 22% of your income — that's excellent progress!"

---

4. `"tips"`  
Offer timeless financial advice for long-term improvement.  
> Example: "Automate your monthly savings to stay consistent."
---

5. Budget Status Tagging  
For any budget-related insight in the `insights` list:
- Include a `"status"` field.
- Set `"status": "OverBudget"` if the user spent more than the recommended amount.
- Set `"status": "UnderBudget"` if the user spent within or below the recommended amount.
- Do not include `"status"` for tips, general praise, or goal advice.

---
6 . Estimate "potential_savings" by:
- Comparing this month's actual category spending vs recommended(based on goal and this month savings )
- Sum up how much the user overspent in categories like Dining, Shopping, etc.
- Do not include categories that were within budget


Also evaluate and return a summary under a section called "monthly_health" that includes:
Use this scale to assign the financial_grade:
- A+ : savings rate > 25%
- A  : 20–25%
- B  : 15–20%
- C  : 10–15%
- D  : 5–10%
- F  : < 5%

- "financial_grade": a letter grade (A+, A, B, C, etc.) based on current month savings rate
- "savings_rate": actual percentage saved last month
- "potential_savings": possible additional savings amount user could make with better spending habits
- "areas_to_improve": 3 categories or habits the user could improve
Instead of returning separate goal_advice, recommended_budget, positive_messages, and tips — 
return all insights in a unified format like this:

"insights": [
  {
    "title": "Emergency Fund Behind Schedule",
    "description": "You're behind on your Emergency Fund. Save ₹5,000 to catch up in 6 months."
  },
  {
    "title": "Dining Over Budget",
    "description": "You spent ₹46,000 on Groceries so far this year. Based on your savings goals, the Recommended is ₹35,000. Try to reduce going forward.",
    "status": "OverBudget"
  },
  {
    "title": "Amazing Savings Rate",
    "description": "You're saving 73.74% of your income — that's fantastic!"
  },
  {
    "title": "Tip: Automate Your Savings",
    "description": "Set up auto-debit to consistently contribute to your goals."
  }
]
 Return valid JSON. Do not include explanations or commentary or markdown . in this format:

```json
{{
  "insights": [
    {{
      "title": "Emergency Fund Behind Schedule",
      "description": "You're behind on your Emergency Fund. Save ₹5,000/month to catch up in 6 months."
    }}
  ],
  "monthly_health": {{
    "financial_grade": "A-",
    "savings_rate": 18,
    "potential_savings": 260,
    "areas_to_improve": ["Dining", "Shopping", "Transportation"]
  }}
}}

"""

    prompt = f"""
You are a smart and supportive AI financial advisor.

A user has shared their income, expenses, savings goals, and category-wise spending from January 1st to today.
Your job is to:
- Help them reach their financial goals by managing spending and saving
- Recommend how much to spend per category based on savings requirements
- Warn them when they overspend, and encourage them when they stay on track
- Give advice that is clear, friendly, and based on real numbers

 Time Range: January 1 to last month end date
 Summary:
- Total Income: ₹{income}
- Total Expenses: ₹{expenses}
- Total Savings: ₹{savings} ({savings_rate}%)
- Required Savings for Goals: ₹{round(total_goal_required, 2)}/month × {num_months} months = ₹{round(total_goal_required * num_months, 2)}
- Emergency Fund Coverage: {round(savings / (expenses / num_months), 2) if expenses else 0} months

 Goals:
{goals_text}

 Category Spending:
{category_text}

 Notable Transactions:
{transactions_text}

This Month's Performance:
- Monthly Income: ₹{month_income}
- Monthly Expenses: ₹{month_expenses}
- Monthly Savings: ₹{month_savings} ({month_savings_rate}%)
- Monthly Required Goal Savings: ₹{round(total_goal_required, 2)}
- Monthly Available to Spend (after savings): ₹{round(month_income - total_goal_required, 2)}

---
{instructions_block}
"""
   

    try:
        res = model.generate_content(prompt)
        advice_text = res.text.strip()
        advice_text = re.sub(r"^```json|```$", "", advice_text).strip()
        advice = json.loads(advice_text)

        db.collection("users").document(user_id).collection("advice").document("latest").set({
            "insights": advice.get("insights", []),
            "monthly_health": advice.get("monthly_health", {}),
            "updated_at": datetime.utcnow().isoformat()
        })

        return {"success": True, "advice_json": advice}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Gemini response was not valid JSON: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    

@router.get("/financial-advice")
def get_financial_advice(request: Request):
    user_id = verify_firebase_token(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    doc = db.collection("users").document(user_id).collection("advice").document("latest").get()
    if doc.exists:
        return doc.to_dict()
    else:
        return {
            "insights": [],
            "monthly_health": {},
            "updated_at": None
        }
