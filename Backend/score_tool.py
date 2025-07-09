from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")



def get_health_score(transactions: List[Dict]) -> List[Dict]:
    prompt = f"""
    Analyze the user’s financial health based on these transactions:
    {transactions}

    Return metrics like savings rate, grade, potential savings, areas to improve.
    Format:
    [
      {{"value": str, "label": str, "color": str}},
      ...
    ]
    """
    result = llm.invoke(prompt)
    return eval(result.content)