from typing import List, Dict
from langchain_core.tools import tool
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.exceptions import OutputParserException

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.4)

@tool
def generate_full_financial_advice(transactions: List[dict]) -> dict:
    """
    Analyze user transactions and return structured financial advice:
    - insights: actionable suggestions
    - budget: category-level over/under budget
    - goals: goal progress
    - health: financial health indicators
    - category_suggestions: categorization suggestions
    - category_learning: AI accuracy by category
    - training_insights: model learning feedback
    
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a personal finance advisor and AI categorization engine."),
        (
            "user",
            """
Here are the user's recent transactions:
{transactions}

Return JSON strictly in the following format:

{{
  "insights": [
    {{
      "title": "string",
      "impact": "High Impact" | "Medium Impact" | "Low Impact",
      "description": "string",
      "savings": "string (optional)"
    }}
  ],
  "budget": [
    {{
      "name": "Category name",
      "status": "Over Budget" | "Under Budget",
      "current": number,
      "recommended": number,
      "diff": string (e.g. "+100"),
      "diffColor": "success" | "error"
    }}
  ],
  "goals": [
    {{
      "name": "Goal name",
      "percent": number (0-100),
      "current": number,
      "total": number
    }}
  ],
  "health": [
    {{
      "label": "Savings Rate" | "Potential Savings" | "Areas to Improve" | "Financial Grade",
      "value": "string or number",
      "color": "green" | "yellow" | "blue" | "red"
    }}
  ],
  "category_suggestions": [
    {{
      "title": "Transaction title",
      "amount": number,
      "confidence": number (0-100),
      "suggested_category": "string"
    }}
  ],
  "category_learning": [
    {{
      "category": "string",
      "accuracy": "string like 95%",
      "transactions": number
    }}
  ],
  "training_insights": {{
    "overall_accuracy": "string like 94.2%",
    "accuracy_delta": "string like ↑ 2.1%",
    "corrections_made": number,
    "new_patterns": number
  }}
}}

Only return valid JSON. Do not include explanations or commentary.
"""
        )
    ])

    chain: Runnable = prompt | llm | JsonOutputParser()

    try:
        return chain.invoke({"transactions": transactions})
    except OutputParserException as e:
        return {
            "insights": None,
            "budget": None,
            "goals": None,
            "health": None,
            "category_suggestions": None,
            "category_learning": None,
            "training_insights": None,
            "error": "Failed to parse response from LLM.",
            "details": str(e),
        }
    except Exception as e:
        return {
            "insights": None,
            "budget": None,
            "goals": None,
            "health": None,
            "category_suggestions": None,
            "category_learning": None,
            "training_insights": None,
            "error": "Unexpected error during financial analysis.",
            "details": str(e),
        }
