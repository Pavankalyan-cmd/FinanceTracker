import React, { useRef, useState, useEffect } from "react";
import "./OverviewPage.css";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import BarChartIcon from "@mui/icons-material/BarChart";
import WalletIcon from "@mui/icons-material/Wallet";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import {
  uploadBankStatement,
  fetchTransactions,
  generateFinancialAdvice,
  syncGmailStatements,
} from "../services/services";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import CountUp from "react-countup";
import Confetti from "react-confetti";
import { Switch, FormControlLabel, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const OverviewPage = () => {
  const fileInputRef = useRef();
  const hasFetched = useRef(false);
  const shouldTriggerUpload = useRef(false);
  const [skipContinuityCheck, setSkipContinuityCheck] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSteps, setUploadSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlySpending: 0,
    averageMonthlySpending: 0,
    categoryCount: 0,
  });

  const handleSyncGmail = async () => {
    const toastId = toast.loading("📥 Syncing Gmail statements...");
    try {
      const result = await syncGmailStatements();
      toast.update(toastId, {
        render: `Synced ${result.synced_pdfs} PDF(s) from Gmail.`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: err.message || "Gmail sync failed.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  useEffect(() => {
    const triggerUploadListener = () => {
      shouldTriggerUpload.current = true;
    };
    window.addEventListener("trigger-upload", triggerUploadListener);
    return () => {
      window.removeEventListener("trigger-upload", triggerUploadListener);
    };
  }, []);

  useEffect(() => {
    if (!loading && shouldTriggerUpload.current && fileInputRef.current) {
      fileInputRef.current.click();
      shouldTriggerUpload.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAndSetTransactions();
    }
  }, []);

  const fetchAndSetTransactions = async () => {
    try {
      setLoading(true);
      const txs = await fetchTransactions();
      setTransactions(txs);
      computeSummary(txs);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const computeSummary = (transactions) => {
    let creditTotal = 0;
    let debitTotal = 0;
    let monthlySpending = 0;
    let monthlySpendMap = new Map();
    const categories = new Set();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (let tx of transactions) {
      const amt = parseFloat(tx.amount || 0);
      const txDate = new Date(tx.date);
      const key = `${txDate.getFullYear()}-${txDate.getMonth() + 1}`;

      if (tx.type === "credit") creditTotal += amt;

      if (tx.type === "debit") {
        debitTotal += amt;
        if (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        ) {
          monthlySpending += amt;
        }

        monthlySpendMap.set(key, (monthlySpendMap.get(key) || 0) + amt);
      }

      if (tx.category) categories.add(tx.category);
    }

    const months = monthlySpendMap.size;
    const totalPastSpending = Array.from(monthlySpendMap.values()).reduce(
      (a, b) => a + b,
      0
    );
    const averageMonthlySpending = months > 0 ? totalPastSpending / months : 0;

    setSummary({
      totalBalance: creditTotal - debitTotal,
      monthlySpending,
      averageMonthlySpending,
      categoryCount: categories.size,
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
    e.dataTransfer.value = null;
  };

  const handleUpload = async (file) => {
    const password = prompt("Enter PDF password (if any):") || "";
    setUploadSteps([
      "🔍 Reading your PDF...",
      "📄 Extracting transactions...",
      "🧠 Categorizing your data...",
      "📊 Updating your dashboard...",
    ]);
    setCurrentStep(0);
    setIsUploading(true);
    try {
      for (let i = 0; i < 4; i++) {
        setCurrentStep(i);
        await new Promise((res) => setTimeout(res, 1000));
      }

      const result = await uploadBankStatement(
        file,
        password,
        !skipContinuityCheck
      );
      if (result.status === "error") {
        const warning =
          result.warning || "Upload rejected due to statement issues.";
        toast.warning(warning);
        return;
      }

      toast.success(`${result.data.length} transactions uploaded`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      await fetchAndSetTransactions();
      await generateFinancialAdvice();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setIsUploading(false);
      setUploadSteps([]);
    }
  };

  return (
    <div className="categories-page">
      <ToastContainer position="top-right" autoClose={4000} />
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      {loading ? (
        <div className="loading-container">
          <ClipLoader size={50} color="#4CAF50" />
          <p>Loading your dashboard...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-card-content">
                <div>
                  <div className="summary-title">Total Balance</div>
                  <div className="summary-value green">
                    ₹
                    <CountUp
                      end={summary.totalBalance}
                      duration={1.5}
                      separator=","
                      decimals={0}
                    />
                  </div>
                </div>
                <div className="summary-icon green-bg">
                  <CurrencyRupeeIcon fontSize="large" />
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-content">
                <div>
                  <div className="summary-title">Monthly Spending</div>
                  <div className="summary-value red">
                    ₹
                    <CountUp
                      end={summary.averageMonthlySpending}
                      duration={1.5}
                      separator=","
                      decimals={0}
                    />
                  </div>
                </div>
                <div className="summary-icon red-bg">
                  <BarChartIcon fontSize="large" />
                </div>
              </div>
            </div>

       

            <div className="summary-card">
              <div className="summary-card-content">
                <div>
                  <div className="summary-title">Categories</div>
                  <div className="summary-value blue">
                    <CountUp end={summary.categoryCount} duration={1.5} />
                  </div>
                </div>
                <div className="summary-icon blue-bg">
                  <WalletIcon fontSize="large" />
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="upload-section">
            <div className="upload-line">
              <h2 className="upload-title">Upload Bank Statement</h2>
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button
                  onClick={handleSyncGmail}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                    width={20}
                    height={20}
                  />
                  Sync Gmail Statements
                </button>
              </div>
            </div>

            <p className="upload-desc">
              Upload your PDF bank or credit card statements for AI-powered
              transaction extraction
            </p>

            <div
              className="upload-box"
              onClick={handleUploadClick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {isUploading && uploadSteps.length > 0 ? (
                <div className="upload-progress-animation">
                  <ClipLoader size={40} color="#4CAF50" />
                  <p>{uploadSteps[currentStep]}</p>
                </div>
              ) : (
                <>
                  <InsertDriveFileOutlinedIcon
                    className="upload-file-icon"
                    fontSize="large"
                  />
                  <div className="upload-box-text">
                    Drop your PDF statements here
                  </div>
                  <div className="upload-box-subtext">
                    or click to browse files
                  </div>
                  <button className="choose-files-btn">Choose Files</button>
                </>
              )}
              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={skipContinuityCheck}
                    onChange={(e) => setSkipContinuityCheck(e.target.checked)}
                    color="primary"
                  />
                }
                label="Skip continuity check"
              />
              <Tooltip title="Enable this if your bank statements are not in consecutive months. If disabled, uploads may be rejected for gaps.">
                <InfoOutlinedIcon
                  style={{ cursor: "pointer", color: "#888" }}
                />
              </Tooltip>
            </div>
          </div>

          {/* Features Section */}
          <div className="features-row">
            <div className="feature-card">
              <div className="feature-icon green-bg">
                <SmartToyOutlinedIcon fontSize="large" />
              </div>
              <div className="feature-title">AI Extraction</div>
              <div className="feature-desc">
                Automatically extract transactions from PDFs
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue-bg">
                <WalletIcon fontSize="large" />
              </div>
              <div className="feature-title">Smart Categorization</div>
              <div className="feature-desc">
                Auto-categorize spending with machine learning
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon red-bg">
                <BarChartIcon fontSize="large" />
              </div>
              <div className="feature-title">Instant Insights</div>
              <div className="feature-desc">
                Get personalized financial insights and advice
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewPage;
