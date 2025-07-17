from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request
from firebase_admin import auth
from firebase_config import db,verify_firebase_token
from extract_and_group import extract_text_with_pdfplumber, group_transactions_from_lines,extract_months_from_raw_blocks
from llm_prompt_builder import build_prompt_with_rules, call_gemini_and_get_json
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from goals import auto_allocate_to_goals,calculate_monthly_savings
from financial_advice import router as financial_advice_router
from financial_insights import router as financial_insights_router
from pending_review import  router as review_router
from update_category import router as update_category_router
from goals import router as goals_router
from datetime import datetime
import os
import requests
import base64

from googleapiclient.discovery import build
from starlette.responses import RedirectResponse
from gmail_auth import create_gmail_flow
from dotenv import load_dotenv
load_dotenv()
from gmail_service import get_gmail_service
from base64 import urlsafe_b64decode

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = os.getenv("ALLOWED_ORIGINS","").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(financial_advice_router)
app.include_router(financial_insights_router)
app.include_router(review_router)
app.include_router(update_category_router)
app.include_router(goals_router, tags=["Goals"])


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

@app.get("/auth/gmail")
def auth_gmail(token: str, password: str = ""):
    flow = create_gmail_flow()
    state_data = f"{token}|{password}"
    encoded_state = base64.urlsafe_b64encode(state_data.encode()).decode()

    auth_url, _ = flow.authorization_url(
        prompt="consent",
        access_type="offline",
        state=encoded_state
    )
    return RedirectResponse(auth_url)

@app.get("/oauth2callback")
def oauth2callback(request: Request):
    code = request.query_params.get("code")
    encoded_state = request.query_params.get("state")

    # Decode token and password from state
    decoded = base64.urlsafe_b64decode(encoded_state).decode()
    token, password = decoded.split("|")

    # Verify Firebase token
    try:
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token["uid"]
    except:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    # Complete OAuth flow
    flow = create_gmail_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials

    service = build("oauth2", "v2", credentials=credentials)
    user_info = service.userinfo().get().execute()
    user_email = user_info["email"]

    db.collection("users").document(user_id).collection("gmail").document("latest").set({
        "gmail_refresh_token": credentials.refresh_token,
        "gmail_email": user_email,
        "gmail_linked": True,
        "last_gmail_sync": None,
        "pdf_password": password,
        "pdf_password_valid": True
    })
    urls = os.getenv("FRONTEND_URL", "http://localhost:3000/dashboard/overview").split(",")
    # Choose first (or some logic to pick)
    frontend_url = urls[0].strip()
    return RedirectResponse(url=frontend_url)

@app.get("/gmail/sync")
def sync_gmail(request: Request):
    user_id = verify_firebase_token(request)
    service = get_gmail_service(user_id)

    # Load Gmail settings
    gmail_doc = db.collection("users").document(user_id).collection("gmail").document("latest").get()
    if not gmail_doc.exists:
        raise HTTPException(status_code=400, detail="Gmail not linked.")

    gmail_data = gmail_doc.to_dict()
    pdf_password = gmail_data.get("pdf_password", "")

    query = 'subject:Account Statement has:attachment newer_than:6d'
    results = service.users().messages().list(userId='me', q=query).execute()
    messages = results.get('messages', [])

    synced_count = 0
    backend_url = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

    for msg in messages:
        msg_data = service.users().messages().get(userId='me', id=msg['id']).execute()
        pdf_parts = extract_pdf_parts(msg_data.get("payload", {}))

        for part in pdf_parts:
            att_id = part['body'].get('attachmentId')
            if not att_id:
                continue

            try:
                attachment = service.users().messages().attachments().get(
                    userId='me', messageId=msg['id'], id=att_id).execute()
                file_data = base64.urlsafe_b64decode(attachment['data'])

                files = {
                    "file": (part['filename'], file_data, "application/pdf")
                }
                data = {
                    "password": pdf_password,
                    "check_continuity": "true"
                }

                headers = {
                    "Authorization": request.headers.get("authorization")
                }

                response = requests.post(
                    f"{backend_url}/upload-bank-statement-cot",
                    files=files,
                    data=data,
                    headers=headers
                )
   

                if response.status_code == 200:
                    synced_count += 1
                elif "PDF extraction failed" in response.text:
                    db.collection("users").document(user_id).collection("gmail").document("latest").update({
                        "pdf_password_valid": False
                    })

            except Exception as e:
               return e
     

    return {"synced_pdfs": synced_count}

def extract_pdf_parts(payload):
    pdf_parts = []
    parts = payload.get("parts", [])
    for part in parts:
        if part.get("filename", "").endswith(".pdf") and part["body"].get("attachmentId"):
            pdf_parts.append(part)
        elif part.get("parts"):
            pdf_parts += extract_pdf_parts(part)
    return pdf_parts


#  Upload Endpoint
@app.post("/upload-bank-statement-cot")
async def upload_bank_statement_with_llm(
    request: Request,
    file: UploadFile = File(...),
    password: str = Form(None),
    check_continuity: bool = Form(True) 
):

    uid = verify_firebase_token(request)

    contents = await file.read()

    try:
        raw_text = extract_text_with_pdfplumber(contents, password=password)
     
        transaction_blocks = group_transactions_from_lines(raw_text)
      
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")

    

    #  Early check for continuity using extracted months
    uploaded_months = extract_months_from_raw_blocks(transaction_blocks)

    # Fetch existing transaction months
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
        # Combine uploaded + existing to check continuity
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
    # Final check


    prompt = build_prompt_with_rules(transaction_blocks)
    transactions = call_gemini_and_get_json(prompt)




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

            success_count += 1
 
        except Exception as e:
            return e

     
    savings_by_month=calculate_monthly_savings(transactions)

    auto_allocate_to_goals(uid,savings_by_month)           
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

        return {"transactions": transactions, "count": len(transactions)}
    
    except Exception as e:

        raise HTTPException(status_code=500, detail="Failed to fetch transactions")


