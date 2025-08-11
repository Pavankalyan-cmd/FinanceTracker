from pydantic import BaseModel
from typing import List

class Transaction(BaseModel):
    title: str
    amount: float
    tag: str
    type: str
    date: str
    payment_method: str
    description: str = ""

class TransactionPayload(BaseModel):
    id_token: str
    transactions: List[Transaction]
