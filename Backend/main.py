from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from firebase_admin import auth
from firebase_config import db
from extract_and_group import extract_text_with_pdfplumber, group_transactions_from_lines
from llm_prompt_builder import build_prompt_with_rules, call_gemini_and_get_json
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware

from financial_advice import router as financial_advice_router
from financial_insights import router as financial_insights_router
from pending_review import  router as review_router
from update_category import router as update_category_router
from goals import router as goals_router
from financial_advice import router as financial_advice
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(financial_advice_router)
app.include_router(financial_insights_router)
app.include_router(review_router)
app.include_router(update_category_router)
app.include_router(goals_router,tags=["Goals"])
app.include_router(financial_advice)

#  Utility: Verify Firebase ID Token
def verify_firebase_token(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    id_token = auth_header.split("Bearer ")[1]
    try:
        decoded = auth.verify_id_token(id_token)
        print(id_token)
        return decoded["uid"]
    except Exception as e:
        print(f" Firebase token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    
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

#  Upload Endpoint
@app.post("/upload-bank-statement-cot")
async def upload_bank_statement_with_llm(
    request: Request,
    file: UploadFile = File(...),
    password: str = Form(None)
):
    print(f" Received file: {file.filename}")
    print(f"Received password: {password}")

    uid = verify_firebase_token(request)

    contents = await file.read()
    try:
        raw_text = extract_text_with_pdfplumber(contents, password=password)
        transaction_blocks = group_transactions_from_lines(raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")

    print(f"Grouped {len(transaction_blocks)} raw transaction blocks")

    prompt = build_prompt_with_rules(transaction_blocks)
    transactions = call_gemini_and_get_json(prompt)

    print(f"Gemini returned {len(transactions)} transactions")
    print(f"Parsed {len(transactions)} transactions")

    # Load user's saved category learning
    learning_ref = db.collection("users").document(uid).collection("category_learning")
    learning_docs = learning_ref.stream()
    learning_map = {}
    for doc in learning_docs:
        data = doc.to_dict()
        key = f"{data['title'].lower().strip()}_{int(data['amount'])}"
        learning_map[key] = data["category"]

    # Process and store transactions
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
            print(f" Uploaded transaction {tx['id']}")
            success_count += 1
        except Exception as e:
            print(f" Failed to upload: {tx}")
            print(f"Error: {e}")

    print(f" Finished uploading {success_count}/{len(transactions)} transactions for user {uid}")
    return {
        "message": f"{success_count} transactions uploaded",
        "data": transactions
    }

# Fetch Endpoint
@app.get("/transactions")
async def get_user_transactions(request: Request):
    uid = verify_firebase_token(request)
    try:
        user_tx_ref = db.collection("users").document(uid).collection("transactions")
        docs = user_tx_ref.stream()

        transactions = [doc.to_dict() for doc in docs]
        print(f" Fetched {len(transactions)} transactions for user {uid}")
        return {"transactions": transactions, "count": len(transactions)}
    
    except Exception as e:
        print(f" Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
