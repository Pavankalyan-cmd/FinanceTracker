from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from firebase_admin import firestore
from datetime import datetime
from firebase_config import verify_firebase_token

router = APIRouter()
db = firestore.client()

class GoalInput(BaseModel):
    name: str
    target_amount: float
    deadline: str  # "YYYY-MM-DD"
    manual_allocated: float | None = None

@router.post("/goals")
def add_goal(request: Request, goal: GoalInput):
    user_id = verify_firebase_token(request)

    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")

    goal_id = str(uuid4())
    goal_data = {
        **goal.dict(),
        "created_at": datetime.utcnow().isoformat()
    }

    db.collection("users").document(user_id).collection("goals").document(goal_id).set(goal_data)
    return {"message": "Goal added", "goal_id": goal_id}


@router.put("/goals/{goal_id}")
def edit_goal(goal_id: str, request: Request, goal: GoalInput):
    user_id = verify_firebase_token(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")

    goal_ref = db.collection("users").document(user_id).collection("goals").document(goal_id)
    if not goal_ref.get().exists:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal_ref.update(goal.dict())
    return {"message": "Goal updated"}


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, request: Request):
    user_id = verify_firebase_token(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")

    goal_ref = db.collection("users").document(user_id).collection("goals").document(goal_id)
    if not goal_ref.get().exists:
        raise HTTPException(status_code=404, detail="Goal not found")

    goal_ref.delete()
    return {"message": "Goal deleted"}







def calculate_months_left(deadline_str):
    today = datetime.today()
    deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
    months = max((deadline - today).days // 30, 1)
    return months

@router.get("/goals")
def get_goals_with_progress(request: Request):
    user_id = verify_firebase_token(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")

    # Fetch goals
    goals_ref = db.collection("users").document(user_id).collection("goals")
    goals_docs = goals_ref.stream()
    goals = [doc.to_dict() | {"id": doc.id} for doc in goals_docs]

    if not goals:
        return {"goals": []}

    # Fetch transactions
    txn_ref = db.collection("users").document(user_id).collection("transactions")
    txns = [doc.to_dict() for doc in txn_ref.stream()]
    income = sum(txn["amount"] for txn in txns if txn["type"] == "credit")
    expenses = sum(txn["amount"] for txn in txns if txn["type"] == "debit")
    total_savings = income - expenses

    # Total target (for proportional allocation)
    total_goal_target = sum(goal["target_amount"] for goal in goals)

    # Enhance goals with progress data
    enhanced_goals = []
    for goal in goals:
        share = goal["target_amount"] / total_goal_target if total_goal_target else 0
        allocated = goal.get("manual_allocated") or round(total_savings * share)
        remaining = goal["target_amount"] - allocated
        progress_percent = round((allocated / goal["target_amount"]) * 100, 2) if goal["target_amount"] > 0 else 0
        months_left = calculate_months_left(goal["deadline"])
        required_monthly = round(remaining / months_left, 2) if months_left > 0 else remaining

        enhanced_goals.append({
            **goal,
            "allocated": allocated,
            "remaining": remaining,
            "progress_percent": progress_percent,
            "months_left": months_left,
            "required_monthly_saving": required_monthly
        })

    return {"goals": enhanced_goals}
