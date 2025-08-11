from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from firebase_admin import firestore
from datetime import datetime
from firebase_config import verify_firebase_token
from collections import defaultdict

router = APIRouter()
db = firestore.client()

class GoalInput(BaseModel):
    name: str
    target_amount: float
    deadline: str  # "YYYY-MM-DD"
    manual_allocated: float | None = None

@router.post("/goals")
def add_goal(request: Request, goal: GoalInput):
    uid = verify_firebase_token(request)

    if not uid:
        raise HTTPException(status_code=401, detail="Missing user ID")

    goal_id = str(uuid4())
    goal_data = {
        **goal.dict(),
        "created_at": datetime.utcnow().isoformat()
    }

    db.collection("users").document(uid).collection("goals").document(goal_id).set(goal_data)
    return {"message": "Goal added", "goal_id": goal_id}


@router.put("/goals/{goal_id}")
def edit_goal(goal_id: str, request: Request, goal: GoalInput):
    uid = verify_firebase_token(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Missing user ID")

    goal_ref = db.collection("users").document(uid).collection("goals").document(goal_id)
    if not goal_ref.get().exists:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal_ref.update(goal.dict())
    return {"message": "Goal updated"}


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, request: Request):
    uid = verify_firebase_token(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Missing user ID")

    goal_ref = db.collection("users").document(uid).collection("goals").document(goal_id)
    if not goal_ref.get().exists:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal_ref.delete()
    return {"message": "Goal deleted"}



def calculate_months_left(deadline_str):
    today = datetime.today()
    deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
    months = max((deadline - today).days // 30, 1)
    return months

@router.get("/goals")
def get_goals_with_progress(request: Request):
    uid = verify_firebase_token(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Missing user ID")

    # Fetch goals
    goals_ref = db.collection("users").document(uid).collection("goals")
    goals_docs = goals_ref.stream()
    goals = [doc.to_dict() | {"id": doc.id} for doc in goals_docs]

    if not goals:
        return {"goals": []}

    # Fetch all goal contributions
    contrib_ref = db.collection("users").document(uid).collection("goal_contributions")
    contrib_docs = contrib_ref.stream()

    goal_contrib_totals = defaultdict(float)
    for doc in contrib_docs:
        data = doc.to_dict()
        goal_id = data.get("goal_id")
        amount = data.get("allocated", 0)
        if goal_id:
            goal_contrib_totals[goal_id] += amount

    # Enhance goals with progress data
    enhanced_goals = []
    for goal in goals:
        # Fetch monthly auto allocations for this goal
        contrib_ref = db.collection("users").document(uid).collection("goal_contributions")
        contribs = contrib_ref.where("goal_id", "==", goal["id"]).stream()
        auto_alloc_total = sum(doc.to_dict().get("allocated", 0) for doc in contribs)

        manual_alloc = goal.get("manual_allocated") or 0
        allocated = manual_alloc + auto_alloc_total
        remaining = goal["target_amount"] - allocated
        progress_percent = round((allocated / goal["target_amount"]) * 100, 2) if goal["target_amount"] > 0 else 0
        months_left = calculate_months_left(goal["deadline"])
        required_monthly = round(remaining / months_left, 2) if months_left > 0 else remaining

        enhanced_goals.append({
            **goal,
            "allocated": allocated,
            "remaining": remaining,
            "progress_percent": progress_percent,
            "months_left": months_left,
            "required_monthly_saving": required_monthly
        })


    return {"goals": enhanced_goals}


def calculate_monthly_savings(transactions):
    monthly = defaultdict(lambda: {"credit": 0, "debit": 0})
    for txn in transactions:
        try:
            month = txn["date"][:7]  # e.g. "2024-06"
            if txn["category"] == "Salary":
                monthly[month]["credit"] += txn["amount"]
            elif txn["type"] == "debit":
                monthly[month]["debit"] += txn["amount"]
        except:
            continue

    return {
        month: credit_debit["credit"] - credit_debit["debit"]
        for month, credit_debit in monthly.items()
    }




def auto_allocate_to_goals(user_id: str, savings_by_month: dict):
    db = firestore.client()

    # Fetch active goals
    goals_ref = db.collection("users").document(user_id).collection("goals")
    goals_docs = goals_ref.stream()
    goals = []
    for doc in goals_docs:
        data = doc.to_dict()
        try:
            created_at = datetime.fromisoformat(data.get("created_at", "1970-01-01T00:00:00"))
        except ValueError:
            created_at = datetime.min  # fallback just in case
       
        data["id"] = doc.id
        data["created_at"] = created_at
        goals.append(data)

    if not goals:

        return

    all_allocations = []

    for month, savings in savings_by_month.items():
        if savings <= 0:

            continue

        month_date = datetime.strptime(month + "-01", "%Y-%m-%d")

        eligible_goals = [g for g in goals if g["created_at"] <= month_date]
        if not eligible_goals:

            continue

        manual_alloc_total = sum(g.get("manual_allocated", 0) or 0 for g in eligible_goals)
        capped_manual_alloc = min(manual_alloc_total, savings)
        leftover_savings = savings - capped_manual_alloc

        auto_goals = [g for g in eligible_goals if not g.get("manual_allocated")]
        total_auto_target = sum(g["target_amount"] for g in auto_goals)

        allocations = []
        for goal in eligible_goals:
            alloc = 0
            if goal.get("manual_allocated"):
                alloc = min(goal["manual_allocated"], savings)
            else:
                share = goal["target_amount"] / total_auto_target if total_auto_target else 0
                alloc = round(leftover_savings * share)

            record = {
                "goal_id": goal["id"],
                "allocated": alloc,
                "month": month,
                "source": "auto",
                "timestamp": datetime.utcnow().isoformat(),
            }
            allocations.append(record)

        # Save to goal_contributions collection
        for record in allocations:
            contrib_id = f"{record['goal_id']}_{month}"
            db.collection("users") \
            .document(user_id) \
            .collection("goal_contributions") \
            .document(contrib_id).set(record)

        all_allocations.extend(allocations)


