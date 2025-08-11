# gmail_service.py
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from firebase_config import db
from dotenv import load_dotenv

load_dotenv()

def get_gmail_service(user_id):
    doc_ref = db.collection("users").document(user_id).collection("gmail").document("latest")
    doc = doc_ref.get()

    if not doc.exists:
        raise Exception("User Gmail credentials not found")

    data = doc.to_dict()
    refresh_token = data.get("gmail_refresh_token")

    if not refresh_token:
        raise Exception("Missing Gmail refresh token")

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    )

    return build("gmail", "v1", credentials=creds)
