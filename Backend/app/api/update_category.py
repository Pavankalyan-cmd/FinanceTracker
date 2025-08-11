from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from firebase_admin import firestore

from app.dependencies.verify_token import verify_firebase_token

router = APIRouter()

# Request Body Schema
class UpdateCategoryRequest(BaseModel):
    transaction_id: str
    new_category: str
    title: str
    amount: float



@router.post("/transactions/update-category")
def update_transaction_category(request: Request, body: UpdateCategoryRequest):
    uid = verify_firebase_token(request)
    db = firestore.client()

    #  Update category of the transaction
    tx_ref = db.collection("users").document(uid).collection("transactions").document(body.transaction_id)
    tx_ref.update({
        "category": body.new_category,
        "category_updated_manually": True
    })

    # Save user-specific learning
    learn_ref = db.collection("users").document(uid).collection("category_learning")
    learn_doc_id = f"{body.title.lower().strip()}_{int(body.amount)}" 
    learn_ref.document(learn_doc_id).set({
        "category": body.new_category,
        "title": body.title,
        "amount": body.amount,
        "learned_from": "manual",
        "updated_at": firestore.SERVER_TIMESTAMP,
    })

    return {"success": True, "message": "Category updated and learning saved."}
