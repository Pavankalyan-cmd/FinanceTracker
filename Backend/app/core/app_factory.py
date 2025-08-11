from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import Config
from app.api.goals import router as goals_router
from app.api.financial_advice import router as financial_advice_router
from app.api.financial_insights import router as financial_insights_router
from app.api.pending_review import router as review_router
from app.api.update_category import router as update_category_router
from app.api.gmail import gmail_router
from app.api.transactions import transactions_router

def create_app():
    config = Config()
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(financial_advice_router)
    app.include_router(financial_insights_router)
    app.include_router(review_router)
    app.include_router(update_category_router)
    app.include_router(goals_router, tags=["Goals"])
    app.include_router(gmail_router)
    app.include_router(transactions_router)
    return app 