import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv
from fastapi import  HTTPException, Request

load_dotenv()

cred_path = os.getenv("FIREBASE_CREDENTIAL_PATH")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


db = firestore.client()





def verify_firebase_token(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    id_token = auth_header.split("Bearer ")[1]
    try:
        decoded = auth.verify_id_token(id_token)

        return decoded["uid"]
    except Exception as e:

        raise HTTPException(status_code=401, detail="Invalid Firebase token")