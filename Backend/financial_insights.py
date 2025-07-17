from fastapi import APIRouter, Request, Query, HTTPException
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from firebase_config import db, verify_firebase_token
from calendar import month_name

router = APIRouter()

@router.get("/financial-insights")
def get_financial_insights(request: Request, period: str = Query("monthly")):
    uid = verify_firebase_token(request)
    period = period.strip().lower()

    def get_date_ranges(period):
        today = datetime.utcnow().date()

        if period == "weekly":
            current_start = today - timedelta(days=7)
            current_end = today
            previous_start = today - timedelta(days=14)
            previous_end = current_start

        elif period == "monthly":
            current_start = today.replace(day=1)
            current_end = (current_start + relativedelta(months=1)).replace(day=1)
            previous_start = current_start - relativedelta(months=1)
            previous_end = current_start

        elif period == "yearly":
            current_start = today.replace(month=1, day=1)
            current_end = today + timedelta(days=1)
            previous_start = current_start.replace(year=current_start.year - 1)
            previous_end = previous_start + (current_end - current_start)

        else:
            raise HTTPException(status_code=400, detail="Invalid period")

        return today, current_start, current_end, previous_start, previous_end

    today, current_start, current_end, previous_start, previous_end = get_date_ranges(period)

    def get_transactions(start_date, end_date):
        txs = db.collection("users").document(uid).collection("transactions") \
            .where("date", ">=", str(start_date)) \
            .where("date", "<", str(end_date)) \
            .stream()
        return [t.to_dict() for t in txs]

    def summarize(txns, tx_type):
        return sum(float(t["amount"]) for t in txns if t.get("type") == tx_type)

    current_txns = get_transactions(current_start, current_end)
    fallback_used = False
    fallback_period_label = ""

    if not current_txns:
        fallback_used = True
        current_txns = get_transactions(previous_start, previous_end)
        if period == "monthly":
            fallback_period_label = month_name[previous_start.month]
        elif period == "weekly":
            fallback_period_label = "previous week"
        elif period == "yearly":
            fallback_period_label = str(previous_start.year)

    previous_txns = get_transactions(previous_start, previous_end)

    # Health score periods
    health_3_start = today - relativedelta(months=3)
    health_6_start = today - relativedelta(months=6)
    health_3_txns = get_transactions(health_3_start, today)
    health_6_txns = get_transactions(health_6_start, today)

    def compute_category_summary(txns_curr, txns_prev):
        def summarize_by_category(txns):
            category_totals = {}
            total = 0
            for t in txns:
                if t.get("type") != "debit":
                    continue
                cat = t.get("category", "Others")
                amt = float(t.get("amount", 0))
                category_totals[cat] = category_totals.get(cat, 0) + amt
                total += amt
            return category_totals, total

        curr_map, curr_total = summarize_by_category(txns_curr)
        prev_map, prev_total = summarize_by_category(txns_prev)

        summary = []
        for cat, amt in curr_map.items():
            curr_pct = (amt / curr_total * 100) if curr_total else 0
            prev_pct = (prev_map.get(cat, 0) / prev_total * 100) if prev_total else 0
            summary.append({
                "name": cat,
                "amount": round(amt, 2),
                "percent": round(curr_pct, 1),
                "change": round(curr_pct - prev_pct, 1)
            })
        return summary

    def compute_health_score(txns):
        income = summarize(txns, "credit")
        expense = summarize(txns, "debit")
        savings = income - expense

        savings_rate = ((savings / income) * 100) if income else 0
        debt_to_income = ((expense / income) * 100) if income else 0

        avg_monthly_exp = expense / 3 if expense else 0
        emergency_fund_months = savings / avg_monthly_exp if avg_monthly_exp else 0

        score = 50
        if savings_rate >= 20:
            score += 20
        elif savings_rate >= 10:
            score += 10
        if expense < income:
            score += 10

        return {
            "score": min(100, max(0, round(score))),
            "savings_rate": round(savings_rate, 1),
            "debt_to_income": round(debt_to_income, 1),
            "emergency_fund_months": round(emergency_fund_months, 1)
        }

    def compute_spending_trends(curr_txns, prev_txns, period, now):
        curr_spend = summarize(curr_txns, "debit")
        prev_spend = summarize(prev_txns, "debit")
        diff = curr_spend - prev_spend
        percent_change = (diff / prev_spend * 100) if prev_spend else 0

        if period == "weekly":
            periods = [now - timedelta(days=7 * (i + 1)) for i in range(6)]
            avg_spend = sum(
                summarize(get_transactions(p, p + timedelta(days=7)), "debit") for p in periods
            ) / 6
        elif period == "monthly":
            periods = [(now - relativedelta(months=i)).replace(day=1) for i in range(6)]
            avg_spend = sum(
                summarize(get_transactions(p, p + relativedelta(months=1)), "debit") for p in periods
            ) / 6
        elif period == "yearly":
            periods = [(now - relativedelta(years=i)).replace(month=1, day=1) for i in range(6)]
            avg_spend = sum(
                summarize(get_transactions(p, p + relativedelta(years=1)), "debit") for p in periods
            ) / 6
        else:
            avg_spend = 0

        largest = max(
            (t for t in curr_txns if t["type"] == "debit"),
            key=lambda x: float(x.get("amount", 0)),
            default=None
        )

        return {
            "diff": round(diff),
            "percent_change": round(percent_change, 1),
            "average_spend": round(avg_spend),
            "largest_expense": {
                "amount": round(float(largest.get("amount", 0))) if largest else 0,
                "title": largest.get("title", "N/A") if largest else "N/A"
            }
        }

    return {
        "category_summary": compute_category_summary(current_txns, previous_txns),
        "health_score_3_month": compute_health_score(health_3_txns),
        "health_score_6_month": compute_health_score(health_6_txns),
        "spending_trends": compute_spending_trends(current_txns, previous_txns, period, current_end),
        "fallback": fallback_used,
        "fallback_label": fallback_period_label
    }
