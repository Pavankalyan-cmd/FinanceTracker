import React, { useRef,useEffect, useState } from "react";
import "./FinancialInsightsPage.css";
import { Button, ButtonGroup, CircularProgress, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast } from "react-toastify";
import { fetchFinancialInsights } from "../services/services";

const FinancialInsightsPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("Monthly");
  const [scoreDuration, setScoreDuration] = useState("3 Month");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [fallbackLabel, setFallbackLabel] = useState("");
  const [categorySummary, setCategorySummary] = useState([]);
  const [spendingTrends, setSpendingTrends] = useState({});
  const [healthScore3, setHealthScore3] = useState(null);
  const [healthScore6, setHealthScore6] = useState(null);
  const hasFetched = useRef(false);

  const healthScoreData =
    scoreDuration === "6 Month" ? healthScore6 : healthScore3;

  const healthScoreLabel =
    healthScoreData?.score >= 80
      ? "Excellent"
      : healthScoreData?.score >= 60
      ? "Good"
      : "Fair";

    useEffect(() => {
        if (!hasFetched.current) {
          hasFetched.current = true;
          loadInsights(period.toLowerCase());
        }
      }, [period]);
  const loadInsights = async (selectedPeriod) => {
    setLoading(true);
    try {
      const insights = await fetchFinancialInsights(selectedPeriod);
      setCategorySummary(insights?.category_summary || []);
      setSpendingTrends(insights?.spending_trends || {});
      setHealthScore3(insights?.health_score_3_month || {});
      setHealthScore6(insights?.health_score_6_month || {});
      setFallbackUsed(insights?.fallback || false);
      setFallbackLabel(insights?.fallback_label || "");
    } catch (err) {
      console.error("Error fetching insights:", err);
      toast.error("Failed to fetch financial insights");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="financial-insights-page">
      {fallbackUsed && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "10px 16px",
            borderRadius: "6px",
            marginBottom: "14px",
            border: "1px solid #ffeeba",
            fontSize: "14px",
          }}
        >
          ⚠️ Data shown is for <strong>{fallbackLabel}</strong>, since current{" "}
          {period.toLowerCase()} bank statement isn’t uploaded yet.
        </div>
      )}

      {/* Header */}
      <div className="insights-header-row">
        <h2 className="insights-title">Financial Insights</h2>
        <ButtonGroup className="insights-toggle-group">
          {["Weekly", "Monthly", "Yearly"].map((label) => (
            <Button
              key={label}
              variant={period === label ? "contained" : "outlined"}
              onClick={() => setPeriod(label)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* Category Summary + Health Score */}
      <div className="insights-main-row">
        <div className="insights-card spending-by-category">
          <div className="insights-card-title">
            Spending by Category
            <Tooltip title="Compare your category-wise spending with previous period">
              <InfoOutlinedIcon fontSize="small" />
            </Tooltip>
          </div>

          {/* Bar Legend */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              fontSize: "12px",
              marginBottom: "10px",
              marginTop: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#1976d2",
                  borderRadius: "2px",
                }}
              ></div>
              <span>Actual</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "red",
                  borderRadius: "2px",
                }}
              ></div>
              <span>Increase</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#1ecb6b",
                  borderRadius: "2px",
                }}
              ></div>
              <span>Decrease</span>
            </div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : categorySummary.length ? (
            categorySummary.map((cat) => {
              const actual = Math.min(cat.percent, 100);
              const change = Math.min(Math.abs(cat.change), 100 - actual);
              const isDecrease = parseFloat(cat.change) < 0;

              return (
                <div
                  className="spending-category-row"
                  key={cat.name}
                  style={{ marginBottom: "14px" }}
                >
                  <div className="spending-category-label">{cat.name}</div>
                  <div className="spending-category-amount">
                    ₹{cat.amount?.toFixed(2) || "0.00"}
                  </div>
                  <div
                    className={`spending-category-percent ${
                      isDecrease ? "green" : "red"
                    }`}
                  >
                    {cat.change > 0 ? "+" : ""}
                    {cat.change}%
                  </div>

                  {/* Multi-color bar */}
                  <div
                    className="spending-category-bar-wrapper"
                    style={{
                      display: "flex",
                      height: "8px",
                      width: "100%",
                      background: "#eee",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginTop: "6px",
                    }}
                  >
                    {/* Actual % - Blue */}
                    <div
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: "#1976d2",
                      }}
                    />

                    {/* Change % - Red or Green */}
                    {Math.abs(cat.change) > 0 && (
                      <div
                        style={{
                          width: `${Math.abs(cat.change)}%`,
                          backgroundColor: isDecrease ? "#1ecb6b" : "red",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div>No spending data</div>
          )}
        </div>

        {/* Health Score */}
        <div className="insights-card health-score-card">
          <div className="insights-card-title">
            Financial Health Score
            <Tooltip title="Score based on income, expenses and savings trends">
              <InfoOutlinedIcon fontSize="small" />
            </Tooltip>
          </div>

          <div className="health-score-circle">
            <CircularProgress
              variant="determinate"
              value={healthScoreData?.score || 0}
              size={150}
              thickness={3}
              style={{
                color: "#1ecb6b",
                background: "#f5f7fa",
                borderRadius: "50%",
              }}
            />
            <div className="health-score-value">
              <div className="health-score-number">
                {healthScoreData?.score || 0}
              </div>
              <div className="health-score-label">{healthScoreLabel}</div>
            </div>
          </div>
          <ButtonGroup size="small" style={{ marginTop: 10 }}>
            {["3 Month", "6 Month"].map((label) => (
              <Button
                key={label}
                variant={scoreDuration === label ? "contained" : "outlined"}
                onClick={() => setScoreDuration(label)}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
          <div className="health-score-metrics">
            <div className="health-score-metric green">
              <div>Savings Rate</div>
              <div>{healthScoreData?.savings_rate?.toFixed(1) || 0}%</div>
            </div>
            <div className="health-score-metric orange">
              <div>Debt-to-Income</div>
              <div>{healthScoreData?.debt_to_income?.toFixed(1) || 0}%</div>
            </div>
            <div className="health-score-metric red">
              <div>Emergency Fund</div>
              <div>
                {healthScoreData?.emergency_fund_months?.toFixed(1) || 0} mo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Trends */}
      <div className="insights-card spending-trends">
        <div className="insights-card-title">
          Spending Trends
          <Tooltip title="Compare your spending with the previous period">
            <InfoOutlinedIcon fontSize="small" />
          </Tooltip>
        </div>
        <div className="spending-trends-row">
          {loading ? (
            <div>Loading...</div>
          ) : spendingTrends && spendingTrends.diff !== undefined ? (
            [
              {
                label: `vs. Last ${period}`,
                value: `${spendingTrends.diff >= 0 ? "+" : "-"}₹${Math.abs(
                  spendingTrends.diff
                ).toFixed(0)}`,
                sub: `${
                  spendingTrends.percent_change >= 0 ? "↑" : "↓"
                } ${Math.abs(spendingTrends.percent_change).toFixed(
                  1
                )}% change`,
                color: spendingTrends.diff >= 0 ? "red" : "green",
              },
              {
                label: `Average ${period}`,
                value: `₹${spendingTrends.average_spend?.toFixed(0) || 0}`,
                sub:
                  period === "Weekly"
                    ? "Last 4 weeks"
                    : period === "Yearly"
                    ? "Last 12 months"
                    : "Last 6 months",
                color: "blue",
              },
              {
                label: "Largest Expense",
                value: `₹${
                  spendingTrends.largest_expense?.amount?.toFixed(0) || 0
                }`,
                sub: spendingTrends.largest_expense?.title || "N/A",
                color: "yellow",
              },
            ].map((trend, idx) => (
              <div className={`spending-trend-card ${trend.color}`} key={idx}>
                <div className="spending-trend-value">{trend.value}</div>
                <div className="spending-trend-label">{trend.label}</div>
                <div className="spending-trend-sub">{trend.sub}</div>
              </div>
            ))
          ) : (
            <div>No trend data</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FinancialInsightsPage;
