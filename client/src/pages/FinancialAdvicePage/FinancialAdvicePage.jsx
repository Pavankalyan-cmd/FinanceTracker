import React, { useEffect, useState, useRef } from "react";
import "./FinancialAdvicePage.css";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import {
  fetchFinancialAdvice,
  generateFinancialAdvice,
} from "../services/services";
import FinancialGoalsCard from "../../components/GoalCard";

const FinancialAdvicePage = () => {
  const [adviceData, setAdviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchAdvice = async () => {
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

  const regenerateAdvice = async () => {
    try {
      setLoading(true);
      await generateFinancialAdvice(); // hit POST /ai/financial-advice/generate
      await fetchAdvice(); // re-fetch updated data
    } catch (err) {
      console.error("Failed to generate new advice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAdvice();
    }
  }, []);

  const insights = adviceData?.insights || [];

  const healthStats = adviceData?.monthly_health
    ? [
        {
          value:
            adviceData.monthly_health.savings_rate != null
              ? `${adviceData.monthly_health.savings_rate.toFixed(0)}%`
              : "N/A",
          label: "Savings Rate",
          color: "green",
          tooltip: "Portion of income you saved this month.",
        },
        {
          value:
            adviceData.monthly_health.potential_savings != null
              ? `₹${adviceData.monthly_health.potential_savings}`
              : "N/A",
          label: "Potential Savings",
          color: "blue",
          tooltip: "Extra savings possible by optimizing your spending.",
        },
        {
          value:
            adviceData.monthly_health.areas_to_improve?.length != null
              ? `${adviceData.monthly_health.areas_to_improve.length}`
              : "0",
          label: "Areas to Improve",
          color: "yellow",
          tooltip: "Categories where you can reduce expenses.",
        },
        {
          value: adviceData.monthly_health.financial_grade || "N/A",
          label: "Financial Grade",
          color: "green",
          tooltip: "Performance rating based on savings rate.",
        },
      ]
    : [];

  const formattedUpdatedTime = adviceData?.updated_at
    ? new Date(adviceData.updated_at).toLocaleString()
    : null;

  return (
    <div className="financial-advice-page">
      <div className="advice-header-row">
        <h2 className="advice-title">Personalized Financial Advice</h2>
        <Button
          variant="outlined"
          className="refresh-btn"
          startIcon={<RefreshOutlinedIcon />}
          onClick={regenerateAdvice}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Insights"}
        </Button>
      </div>

      {formattedUpdatedTime && (
        <p className="last-updated-text">
          Last Updated: <strong>{formattedUpdatedTime}</strong>
        </p>
      )}

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
                <h4>
                  {insight.title}{" "}
                  <span
                    className={`insight-title ${
                      insight.status === "OverBudget" ? "red" : "green"
                    }`}
                  >
                    {insight.status || ""}
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
          <h3>Last Month's Financial Health</h3>
          <div className="advice-health-row">
            {healthStats.map((stat, idx) => (
              <Tooltip title={stat.tooltip} key={idx} arrow>
                <div className={`advice-health-col ${stat.color}`}>
                  <div className="advice-health-value">{stat.value}</div>
                  <div className="advice-health-label">{stat.label}</div>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      <div className="advice-disclaimer">
        <p>
          <strong>Disclaimer:</strong> This advice is generated by an AI model
          based on your financial data and goals. Please use your own judgment
          before making any financial decisions.
        </p>
      </div>
    </div>
  );
};

export default FinancialAdvicePage;
