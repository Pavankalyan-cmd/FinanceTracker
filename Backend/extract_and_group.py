import re
import pdfplumber
from typing import List, Optional
from io import BytesIO

def extract_text_with_pdfplumber(content: bytes, password: Optional[str] = None) -> str:
    text = ""
    try:
        with pdfplumber.open(BytesIO(content), password=password) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        if "File has not been decrypted" in str(e):
            raise Exception("PDF is password-protected. Please provide the correct password.")
        raise Exception(f"PDF extraction failed: {str(e)}")
    return text.strip()


def group_transactions_from_lines(raw_text: str) -> List[str]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    date_line_pattern = re.compile(r'^\d{2}-\d{2}-\d{2}\s+\d{2}-\d{2}-\d{2}')
    transactions = []
    current_transaction = []

    for line in lines:
        if date_line_pattern.match(line):
            if current_transaction:
                transactions.append(" ".join(current_transaction))
                current_transaction = []
        current_transaction.append(line)

    if current_transaction:
        transactions.append(" ".join(current_transaction))

    return transactions