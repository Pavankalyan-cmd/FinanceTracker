from fastapi import APIRouter, Request, HTTPException
from firebase_admin import auth, firestore
from typing import List
from firebase_config import verify_firebase_token
router = APIRouter()





def get_pending_review_transactions(uid: str) -> List[dict]:
    db = firestore.client()

    transactions_ref = (
        db.collection("users")
        .document(uid)
        .collection("transactions")
        .where("category", "==", "Others")
    )

    docs = transactions_ref.stream()
    filtered = []

    for doc in docs:
        data = doc.to_dict()
        if data.get("confidence", 100) < 65:
            data["id"] = doc.id  
            filtered.append(data)

    return filtered


@router.get("/transactions/pending-review")
def fetch_pending_review_transactions(request: Request):
    uid = verify_firebase_token(request)
    transactions = get_pending_review_transactions(uid)
    return {"transactions": transactions}
