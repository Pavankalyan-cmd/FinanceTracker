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

from datetime import datetime
import re
from typing import List

def extract_months_from_raw_blocks(transaction_blocks: List[str]) -> List[str]:
    months = set()

    # Add patterns for various date formats
    date_patterns = [
        r"\b(\d{2})-(\d{2})-(\d{2})\b",               # DD-MM-YY
        r"\b(\d{2})-(\d{2})-(\d{4})\b",               # DD-MM-YYYY
        r"\b(\d{2})-([A-Za-z]{3,9})-(\d{2,4})\b",     # DD-MMM-YY or DD-MMMM-YYYY
    ]

    # Month name to number mapping
    month_map = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12
    }

    for block in transaction_blocks:
        for pattern in date_patterns:
            matches = re.findall(pattern, block, flags=re.IGNORECASE)
            for match in matches:
                try:
                    # Format: DD-MMM-YY or DD-MMMM-YYYY
                    if pattern == date_patterns[2]:
                        day = int(match[0])
                        month_str = match[1].lower()
                        month = month_map.get(month_str[:3])
                        year = int(match[2])
                        if year < 100:
                            year += 2000
                    else:
                        day, month, year = map(int, match)
                        if len(str(year)) == 2:
                            year += 2000 if year < 50 else 1900

                    dt = datetime(year, month, day)
                    months.add(dt.strftime("%Y-%m"))
                    break  # Only one date per block needed. 
                except Exception as e:
                    continue


    return sorted(months)
