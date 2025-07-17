import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv
from fastapi import  HTTPException, Request
import json
import tempfile
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if firebase_admin._apps:
        return

    raw_json = os.getenv("FIREBASE_CREDENTIAL_JSON")  # Azure
    file_path = os.getenv("FIREBASE_CREDENTIAL_PATH", "Backend/firebase-credentials.json")  # Local fallback
    

    if raw_json:
        try:
            # Decode once
            cred_dict = json.loads(raw_json)

            # If still a string (i.e., double quotes were around whole JSON), decode again
            if isinstance(cred_dict, str):
                cred_dict = json.loads(cred_dict)

            with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as temp_cred_file:
                json.dump(cred_dict, temp_cred_file)
                temp_cred_file.flush()
                cred = credentials.Certificate(temp_cred_file.name)
        except Exception as e:
            raise RuntimeError(f"Invalid FIREBASE_CREDENTIAL_JSON: {e}")
    else:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Firebase credential file not found at {file_path}")
     
        cred = credentials.Certificate(file_path)

    firebase_admin.initialize_app(cred)


# Always call this once before using Firestore
initialize_firebase()
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