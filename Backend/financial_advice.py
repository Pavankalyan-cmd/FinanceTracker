from fastapi import APIRouter, Request, HTTPException
from typing import List, Dict, Union
from pydantic import BaseModel
from full_advice_tool import generate_full_financial_advice

router = APIRouter()
origins = [
    "http://localhost:3000",  
]


class Transaction(BaseModel):
    title: str
    amount: float
    type: str
    category: str
    date: str


class CategorySuggestion(BaseModel):
    title: str
    amount: float
    confidence: int
    suggested_category: str

class HealthMetric(BaseModel):
    label: str
    value: Union[str, float]
    color: str

class Goal(BaseModel):
    name: str
    percent: float
    current: float
    total: float

class BudgetItem(BaseModel):
    name: str
    status: str
    current: float
    recommended: float
    diff: str
    diffColor: str

class Insight(BaseModel):
    title: str
    impact: str
    description: str
    savings: Union[str, None] = None

class CategoryLearning(BaseModel):
    category: str
    accuracy: str
    transactions: int

class TrainingInsights(BaseModel):
    overall_accuracy: str
    accuracy_delta: str
    corrections_made: int
    new_patterns: int

class FullAdviceResponse(BaseModel):
    insights: Union[List[Insight], None] = None
    budget: Union[List[BudgetItem], None] = None
    goals: Union[List[Goal], None] = None
    health: Union[List[HealthMetric], None] = None
    category_suggestions: Union[List[CategorySuggestion], None] = None
    category_learning: Union[List[CategoryLearning], None] = None
    training_insights: Union[TrainingInsights, None] = None
    error: Union[str, None] = None
    details: Union[str, None] = None

@router.post("/ai/financial-advice", response_model=FullAdviceResponse)
async def full_advice(request: Request):
    try:
        body = await request.json()
        print(body)
        transactions = body.get("transactions", [])
        print("recevied transactions in backend :", transactions)

        if not transactions:
            raise HTTPException(status_code=400, detail="No transactions provided")

        # advice = generate_full_financial_advice.invoke({"transactions": transactions})
        # return advice

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
