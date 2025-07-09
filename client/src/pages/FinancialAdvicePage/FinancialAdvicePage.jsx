import React from "react";
import "./FinancialAdvicePage.css";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

const insights = [
  {
    title: "Reduce Dining Expenses",
    impact: "High Impact",
    impactColor: "primary",
    description:
      "You've spent 25% more on dining this month. Consider meal prepping to save $200/month.",
    savings: "Potential savings: $200/month",
    savingsColor: "green",
  },
  {
    title: "Subscription Review Needed",
    impact: "Medium Impact",
    impactColor: "error",
    description:
      "You have $89/month in recurring subscriptions. 3 haven't been used in 60 days.",
    savings: "Potential savings: $45/month",
    savingsColor: "green",
  },
  {
    title: "Emergency Fund Progress",
    impact: "Low Impact",
    impactColor: "default",
    description:
      "Great job! You're 70% toward your 6-month emergency fund goal. Keep it up!",
    savings: "",
    savingsColor: "",
  },
  {
    title: "Cashback Optimization",
    impact: "High Impact",
    impactColor: "primary",
    description:
      "Switch to a cashback card for groceries to earn an extra $15/month.",
    savings: "Potential savings: $15/month",
    savingsColor: "green",
  },
];

const budget = [
  {
    name: "Dining",
    status: "Over Budget",
    statusColor: "error",
    current: 450,
    recommended: 350,
    diff: "+$100",
    diffColor: "error",
  },
  {
    name: "Entertainment",
    status: "Under Budget",
    statusColor: "success",
    current: 165,
    recommended: 200,
    diff: "-$35",
    diffColor: "success",
  },
  {
    name: "Transportation",
    status: "Over Budget",
    statusColor: "error",
    current: 280,
    recommended: 250,
    diff: "+$30",
    diffColor: "error",
  },
  {
    name: "Groceries",
    status: "Under Budget",
    statusColor: "success",
    current: 380,
    recommended: 400,
    diff: "-$20",
    diffColor: "success",
  },
];

const goals = [
  {
    name: "Emergency Fund",
    percent: 70,
    color: "success",
    current: 7000,
    total: 10000,
    barColor: "#1ecb6b",
  },
  {
    name: "Vacation Savings",
    percent: 45,
    color: "primary",
    current: 1350,
    total: 3000,
    barColor: "#1ea7fd",
  },
];

const healthStats = [
  {
    value: "+18%",
    label: "Savings Rate",
    color: "green",
  },
  {
    value: "$260",
    label: "Potential Savings",
    color: "blue",
  },
  {
    value: "3",
    label: "Areas to Improve",
    color: "yellow",
  },
  {
    value: "A-",
    label: "Financial Grade",
    color: "green",
  },
];

const FinancialAdvicePage = () => {
  return (
    <div className="financial-advice-page">
      <div className="advice-header-row">
        <h2 className="advice-title">Personalized Financial Advice</h2>
        <Button
          variant="outlined"
          className="refresh-btn"
          startIcon={<RefreshOutlinedIcon />}
        >
          Refresh Insights
        </Button>
      </div>
      <div className="advice-card">
        <div className="advice-card-header">
          <InfoOutlinedIcon className="advice-info-icon" />
          <span className="advice-card-title">AI-Powered Insights</span>
          <span className="advice-card-count">4 new</span>
        </div>
        <div className="advice-insights-list">
          {insights.map((insight, idx) => (
            <div className="advice-insight-row" key={idx}>
              <div className="advice-insight-main">
                <div className="advice-insight-title-row">
                  <span className="advice-insight-title">{insight.title}</span>
                  <Chip
                    label={insight.impact}
                    color={insight.impactColor}
                    size="small"
                    className="advice-impact-badge"
                  />
                </div>
                <div className="advice-insight-desc">{insight.description}</div>
                {insight.savings && (
                  <div className="advice-insight-savings {insight.savingsColor}">
                    {insight.savings}
                  </div>
                )}
              </div>
              <div className="advice-insight-actions">
                <Button variant="text" className="advice-dismiss-btn">
                  Dismiss
                </Button>
                <Button variant="contained" className="advice-apply-btn">
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="advice-card">
        <div className="advice-card-title">Smart Budget Recommendations</div>
        <div className="advice-budget-list">
          {budget.map((item, idx) => (
            <div className="advice-budget-row" key={idx}>
              <span className="advice-budget-name">{item.name}</span>
              <Chip
                label={item.status}
                color={item.statusColor}
                size="small"
                className="advice-budget-status"
              />
              <span className="advice-budget-current">
                Current: ${item.current}
              </span>
              <span className="advice-budget-recommended">
                Recommended: ${item.recommended}
              </span>
              <span className={`advice-budget-diff ${item.diffColor}`}>
                {item.diff}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="advice-card advice-goals-card">
        <div className="advice-card-title">Financial Goal Tracking</div>
        <div className="advice-goals-row">
          {goals.map((goal, idx) => (
            <div className="advice-goal-col" key={idx}>
              <div className="advice-goal-title-row">
                <span className="advice-goal-title">{goal.name}</span>
                <span className="advice-goal-percent">
                  {goal.percent}% complete
                </span>
              </div>
              <LinearProgress
                className="advice-goal-bar"
                variant="determinate"
                value={goal.percent}
                style={{ height: 8, borderRadius: 6, background: "#f0f1f3" }}
                sx={{
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: goal.barColor,
                  },
                }}
              />
              <div className="advice-goal-meta">
                ${goal.current.toLocaleString()} of $
                {goal.total.toLocaleString()} goal
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="advice-card advice-health-card">
        <div className="advice-health-row">
          {healthStats.map((stat, idx) => (
            <div className={`advice-health-col ${stat.color}`} key={idx}>
              <div className="advice-health-value">{stat.value}</div>
              <div className="advice-health-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialAdvicePage;
