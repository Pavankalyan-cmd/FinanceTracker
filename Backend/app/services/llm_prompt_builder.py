import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")


def build_prompt_with_rules(transaction_blocks: list[str]) -> str:
    base_prompt = """
You are a personal finance assistant. Extract structured JSON transactions from bank statement lines.

Each transaction must contain:
- date (YYYY-MM-DD)
- title (merchant/source name)
- amount (float)
- type ("credit" or "debit")
- category: one of [Dining, Groceries, Utilities, Transportation, Shopping, Entertainment, Healthcare, Salary, Others]
- payment_method: one of [UPI, NEFT, ACH, CASH, CHEQUE, IMPS, Not specified]
- description: 3–5 word summary
- confidence: integer from 0 to 100 (how confident you are in the category)

Confidence Rules (0–100):
- 95–100 → strong category match from both title and amount clues
- 85–94 → title clearly maps to a category, even if amount doesn’t align
- 70–84 → partial match (title or amount gives some clue, but not both)
- 50–69 → vague pattern or keyword, limited confidence
- Below 50 → highly uncertain, consider using category "Others"

Classification Rules:
- ₹25,000–₹180,000 credit in first 7 days of month → category: Salary
- ₹500–₹1500 debit → category: Transportation
- ₹1000–₹2000 debit → category: Utilities
- amount < ₹100 → category: Others

Keyword-based clues:
- Dining: Zomato, Swiggy, Restaurant(Domino’s Pizza, KFC), Cafe(Starbucks), Momo(Wow! Momo), Food Court(Inox food court), Bar(Hard Rock Cafe)
- Groceries: Grocery(D-Mart, Reliance Fresh), Supermarket(Big Bazaar), Mart(JioMart), Fresh(FreshToHome)
- Shopping: Amazon, Flipkart, Myntra, Zudio, Fashion(H&M), Lifestyle
- Entertainment: netflix, movie, ticket, pvr, bookmyshow, hotstar
- Healthcare: Pharmacy(Apollo, Medlife), Clinic(Practo), Hospital(Fortis, AIIMS)
- Utilities: Recharge(Airtel, Jio, DTH), Broadband, Gas, BSNL, Water Bill, Electricity
- Person: UPI with unknown title or ALL CAPS names → likely peer transfer → category "Others" unless clues suggest otherwise

Only assign "Others" if it clearly doesn’t match any pattern or category.

---
Return output as **a JSON array** of transactions only. No explanation, no markdown, no labels.

Examples:

Input:
01-08-23 01-08-23 UPI/DR/321360840952/VIKRANT /UTIB/vik.bhat22/UPI 000000 2519.00 DR
Output:
{
  "date": "2023-08-01",
  "title": "VIKRANT",
  "amount": 2519.00,
  "type": "debit",
  "payment_method": "UPI",
  "category": "Utilities",
  "description": "Paytm to VIKRANT",
  "confidence": 87
}

Input:
02-08-23 02-08-23 NEFT*ICIC0000393*CMS346613 PHYSICSWALLAH 000000 - 52000.00 CR
Output:
{
  "date": "2023-08-02",
  "title": "PHYSICSWALLAH",
  "amount": 52000.00,
  "type": "credit",
  "payment_method": "NEFT",
  "category": "Salary",
  "description": "Monthly Salary credited",
  "confidence": 98
}

Now extract all transactions below and respond with a JSON array only:
""" + "\n".join(transaction_blocks)
    return base_prompt.strip()


def sanitize_json_text(text: str) -> str:
    text = text.strip().strip("```json").strip("```")

    text = text.replace("'", '"')

    text = re.sub(r",\s*([\]}])", r"\1", text)

    text = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', text)

    return text


def call_gemini_and_get_json(prompt: str):
    try:
        response = model.generate_content(prompt)
        content = response.text.strip()

        content = sanitize_json_text(content)
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:

            return []

        if isinstance(parsed, dict) and "transactions" in parsed:
            return parsed["transactions"]
        elif isinstance(parsed, list):
            return parsed
        else:

            return []

    except Exception as e:

        return []


def chunk_transactions(transactions: list[str], chunk_size: int = 20):
    for i in range(0, len(transactions), chunk_size):
        yield transactions[i:i + chunk_size]


def extract_all_transactions(transaction_lines: list[str]):
    all_results = []
    for chunk in chunk_transactions(transaction_lines):
        prompt = build_prompt_with_rules(chunk)
        results = call_gemini_and_get_json(prompt)
        all_results.extend(results)
    return all_results
