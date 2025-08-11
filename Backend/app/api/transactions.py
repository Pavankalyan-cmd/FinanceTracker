from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form, Depends
from app.core.firebase_config import db
from app.services.extract_and_group import extract_text_with_pdfplumber, group_transactions_from_lines, extract_months_from_raw_blocks
from app.services.llm_prompt_builder import build_prompt_with_rules, call_gemini_and_get_json
from app.api.goals import auto_allocate_to_goals, calculate_monthly_savings
from uuid import uuid4
from datetime import datetime
from app.dependencies.verify_token import verify_firebase_token

transactions_router = APIRouter()

@transactions_router.post("/upload-bank-statement-cot")
async def upload_bank_statement_with_llm(
    user=Depends(verify_firebase_token),
    file: UploadFile = File(...),
    password: str = Form(None),
    check_continuity: bool = Form(True)
):
    uid = user["uid"]
    contents = await file.read()
    try:
        raw_text = extract_text_with_pdfplumber(contents, password=password)
        transaction_blocks = group_transactions_from_lines(raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")
    uploaded_months = extract_months_from_raw_blocks(transaction_blocks)
    user_tx_ref = db.collection("users").document(uid).collection("transactions")
    docs = user_tx_ref.stream()
    existing_months = set()
    if not uploaded_months:
        return {
            "status": "error",
            "warning": "No valid transaction months were detected from this statement. Please upload a valid or clearer PDF.",
            "raw_months_detected": []
        }
    for doc in docs:
        try:
            tx = doc.to_dict()
            dt = datetime.strptime(tx["date"], "%Y-%m-%d")
            existing_months.add(dt.strftime("%Y-%m"))
        except:
            continue
    duplicate_months = [m for m in uploaded_months if m in existing_months]
    if duplicate_months:
        return {
            "status": "error",
            "warning": f"Duplicate month(s) detected: {', '.join(duplicate_months)}. You have already uploaded these.",
            "raw_months_detected": uploaded_months
        }
    missing_months = []
    if check_continuity:
        all_months = sorted(existing_months.union(set(uploaded_months)))
        all_dts = [datetime.strptime(m, "%Y-%m") for m in all_months]
        all_dts.sort()
        expected = []
        current = all_dts[0]
        end = all_dts[-1]
        while current < end:
            current = current.replace(day=1)
            current = datetime(current.year + (current.month // 12), (current.month % 12) + 1, 1)
            expected.append(current.strftime("%Y-%m"))
        missing_months = [m for m in expected if m not in uploaded_months and m not in existing_months]
    if missing_months:
        return {
            "status": "error",
            "warning": f"Missing month(s): {', '.join(missing_months)}. Please upload them before proceeding.",
            "raw_months_detected": uploaded_months
        }
    prompt = build_prompt_with_rules(transaction_blocks)
    transactions = call_gemini_and_get_json(prompt)
    from app.api.transactions import match_transaction  # ensure match_transaction is defined below
    learning_ref = db.collection("users").document(uid).collection("category_learning")
    learning_docs = learning_ref.stream()
    learning_map = {}
    for doc in learning_docs:
        data = doc.to_dict()
        key = f"{data['title'].lower().strip()}_{int(data['amount'])}"
        learning_map[key] = data["category"]
    success_count = 0
    for tx in transactions:
        try:
            if not tx or not isinstance(tx, dict):
                continue
            matched_category = match_transaction(tx, learning_map)
            if matched_category:
                tx["category"] = matched_category
                tx["confidence"] = 100
                tx["category_overridden_by_learning"] = True
            else:
                tx["category_overridden_by_learning"] = False
            tx["id"] = str(uuid4())
            tx["user"] = uid
            db.collection("users").document(uid).collection("transactions").document(tx["id"]).set(tx)
            success_count += 1
        except Exception as e:
            return e
    savings_by_month = calculate_monthly_savings(transactions)
    auto_allocate_to_goals(uid, savings_by_month)
    return {
        "message": f"{success_count} transactions uploaded",
        "data": transactions
    }

def match_transaction(tx, learning_map, tolerance=10):
    tx_title = tx["title"].lower().strip()
    tx_amount = int(tx["amount"])
    for key, category in learning_map.items():
        try:
            learned_title, learned_amount = key.rsplit("_", 1)
            if (
                learned_title == tx_title and
                abs(int(learned_amount) - tx_amount) <= tolerance
            ):
                return category
        except:
            continue
    return None

@transactions_router.get("/transactions")
async def get_user_transactions(user=Depends(verify_firebase_token)):
    uid = user["uid"]
    print(uid)

    try:
        user_tx_ref = db.collection("users").document(uid).collection("transactions")
        docs = user_tx_ref.stream()
        transactions = [doc.to_dict() for doc in docs]
        return {"transactions": transactions, "count": len(transactions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch transactions") 