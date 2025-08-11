from fastapi import APIRouter, Request, HTTPException, Depends
from starlette.responses import RedirectResponse
from app.services.gmail_auth import create_gmail_flow
from app.services.gmail_service import get_gmail_service
from app.core.firebase_config import db
from firebase_admin import auth
from app.core.config import Config
import base64
from app.dependencies.verify_token import verify_firebase_token
import requests
from googleapiclient.discovery import build

gmail_router = APIRouter()

@gmail_router.get("/auth/gmail")
def auth_gmail(token: str, password: str = ""):
    flow = create_gmail_flow()
    # Encode state with token|password
    state_data = f"{token}|{password}"
    encoded_state = base64.urlsafe_b64encode(state_data.encode()).decode()
    
    # ✅ Ensure these flags are set properly
    auth_url, _ = flow.authorization_url(
        access_type="offline",            # needed for refresh token
        include_granted_scopes=False,      # preserves previously granted scopes
        prompt="consent",                 # forces Google to show all scopes again
        state=encoded_state               # passes your state forward
    )

    return RedirectResponse(auth_url)

@gmail_router.get("/oauth2callback")
def oauth2callback(request: Request):
    code = request.query_params.get("code")
    encoded_state = request.query_params.get("state")
    decoded = base64.urlsafe_b64decode(encoded_state).decode()
    token, password = decoded.split("|")
    try:
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token["uid"]
    except:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    flow = create_gmail_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials
    print("Granted Scopes:", flow.credentials.scopes)
    if "https://www.googleapis.com/auth/gmail.readonly" not in credentials.scopes:
        raise HTTPException(status_code=403, detail="Required Gmail scope not granted.")

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
    urls = Config().FRONTEND_URL
    frontend_url = str(urls[0])
    return RedirectResponse(url=frontend_url)

@gmail_router.get("/gmail/sync")
def sync_gmail(request: Request, user=Depends(verify_firebase_token)):
    user_id = user["uid"]
    service = get_gmail_service(user_id)
    gmail_doc = db.collection("users").document(user_id).collection("gmail").document("latest").get()
    if not gmail_doc.exists:
        raise HTTPException(status_code=400, detail="Gmail not linked.")
    gmail_data = gmail_doc.to_dict()
    pdf_password = gmail_data.get("pdf_password", "")
    query = 'subject:Account Statement has:attachment newer_than:6d'
    results = service.users().messages().list(userId='me', q=query).execute()
    messages = results.get('messages', [])
    synced_count = 0
    backend_url = Config().BACKEND_BASE_URL
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