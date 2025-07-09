import React, { useRef, useState, useEffect } from "react";
import "./OverviewPage.css";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BarChartIcon from "@mui/icons-material/BarChart";
import WalletIcon from "@mui/icons-material/Wallet";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { uploadBankStatement, fetchTransactions } from "../services/services";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import CountUp from "react-countup";
import Confetti from "react-confetti";

const OverviewPage = () => {
  const fileInputRef = useRef();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlySpending: 0,
    categoryCount: 0,
  });

  const [uploadSteps, setUploadSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchAndSetTransactions();
  }, []);

  const fetchAndSetTransactions = async () => {
    try {
      setLoading(true);
      const txs = await fetchTransactions();
      setTransactions(txs);
      computeSummary(txs);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const computeSummary = (transactions) => {
    let creditTotal = 0;
    let debitTotal = 0;
    let monthlySpending = 0;
    const categories = new Set();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (let tx of transactions) {
      const amt = parseFloat(tx.amount || 0);
      const txDate = new Date(tx.date);

      if (tx.type === "credit") creditTotal += amt;

      if (tx.type === "debit") {
        debitTotal += amt;
        if (
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        ) {
          monthlySpending += amt;
        }
      }

      if (tx.category) categories.add(tx.category);
    }

    setSummary({
      totalBalance: creditTotal - debitTotal,
      monthlySpending,
      categoryCount: categories.size,
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
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
        await new Promise((res) => setTimeout(res, 1000)); // simulate delay
      }

      const result = await uploadBankStatement(file, password);
      toast.success(`${result.data.length} transactions uploaded`);
      setShowConfetti(true);

      setTimeout(() => setShowConfetti(false), 4000);
      await fetchAndSetTransactions();
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
                    />
                  </div>
                </div>
                <div className="summary-icon green-bg">
                  <AttachMoneyIcon fontSize="large" />
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
                      end={summary.monthlySpending}
                      duration={1.5}
                      separator=","
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
            <h2 className="upload-title">Upload Bank Statement</h2>
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
