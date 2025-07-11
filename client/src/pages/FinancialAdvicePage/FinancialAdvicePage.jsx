import React, { useEffect, useState,useContext } from "react";
import "./FinancialAdvicePage.css";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { fetchFinancialAdvice } from "../services/services";
import FinancialGoalsCard from "../../components/GoalCard";
import { TransactionContext } from "../../context/TransactionContext";
const FinancialAdvicePage = () => {
  const [adviceData, setAdviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastUpdated } = useContext(TransactionContext);

  const loadAdvice = async () => {
    try {
      setLoading(true);
      const data = await fetchFinancialAdvice();
      setAdviceData(data);
    } catch (err) {
      console.error("Failed to fetch advice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvice(); // Re-fetch financial advice when transactions change
  }, [lastUpdated]);

  const insights = adviceData?.insights || [];

  const healthStats = adviceData?.monthly_health
    ? [
        {
          value: `${adviceData.monthly_health.savings_rate.toFixed(0)}%`,
          label: "Savings Rate",
          color: "green",
        },
        {
          value: `₹${adviceData.monthly_health.potential_savings}`,
          label: "Potential Savings",
          color: "blue",
        },
        {
          value: `${adviceData.monthly_health.areas_to_improve.length}`,
          label: "Areas to Improve",
          color: "yellow",
        },
        {
          value: adviceData.monthly_health.financial_grade,
          label: "Financial Grade",
          color: "green",
        },
      ]
    : [];

  return (
    <div className="financial-advice-page">
      <div className="advice-header-row">
        <h2 className="advice-title">Personalized Financial Advice</h2>
        <Button
          variant="outlined"
          className="refresh-btn"
          startIcon={<RefreshOutlinedIcon />}
          onClick={loadAdvice}
        >
          Refresh Insights
        </Button>
      </div>

      <div className="advice-card">
        <div className="advice-card-header">
          <InfoOutlinedIcon className="advice-info-icon" />
          <span className="advice-card-title">AI-Powered Insights</span>
          <span className="advice-card-count">{insights.length} new</span>
        </div>
        <div className="advice-insights-list">
          {insights.map((insight, idx) => (
            <div className="insight-clean-card" key={idx}>
              <div className="insight-title-row">
                <h4
         
                >
                  {insight.title}{" "}
                  <span
                    className={`insight-title ${
                      insight.status == "OverBudget" ? "red" : "green"
                    }`}
                  >
                    {insight.status}
                  </span>
                </h4>
              </div>
              <p className="insight-description">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      <FinancialGoalsCard />

      {healthStats.length > 0 && (
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
      )}
    </div>
  );
};

export default FinancialAdvicePage;
