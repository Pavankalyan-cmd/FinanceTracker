import React from "react";
import "./LandingPage.css";
import Button from "@mui/material/Button";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import EmojiObjectsOutlinedIcon from "@mui/icons-material/EmojiObjectsOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const LandingPage = ({ onLogin, onSignup }) => {
  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="landing-logo-group">
          <span className="landing-logo">FinanceTracker</span>
          <span className="landing-subtitle">
            AI-powered personal finance management
          </span>
        </div>
        <div className="landing-header-actions">
          <Button className="landing-login-btn" onClick={onLogin}>
            Login
          </Button>
          <Button
            className="landing-getstarted-btn"
            variant="contained"
            onClick={onSignup}
          >
            Get Started
          </Button>
        </div>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <h1 className="landing-hero-title">
            Take Control of Your <span className="blue">Financial Future</span>
          </h1>
          <p className="landing-hero-desc">
            Our AI-powered platform automatically extracts and categorizes your
            transactions, providing personalized insights to help you make
            smarter financial decisions.
          </p>
          <Button
            className="landing-hero-btn"
            variant="contained"
            onClick={onSignup}
          >
            Start Your Journey
          </Button>
        </section>
        <section className="landing-summary-cards">
          <div className="landing-summary-card">
            <MonetizationOnOutlinedIcon className="summary-icon green" />
            <div className="summary-value green">$12,456.78</div>
            <div className="summary-label">Total Balance</div>
          </div>
          <div className="landing-summary-card">
            <BarChartOutlinedIcon className="summary-icon red" />
            <div className="summary-value red">$3,248.92</div>
            <div className="summary-label">Monthly Spending</div>
          </div>
          <div className="landing-summary-card">
            <WalletOutlinedIcon className="summary-icon blue" />
            <div className="summary-value blue">12</div>
            <div className="summary-label">Categories</div>
          </div>
        </section>
        <section className="landing-features">
          <h2 className="features-title">Powerful AI Features</h2>
          <p className="features-desc">
            Upload your bank statements and let our AI do the heavy lifting
          </p>
          <div className="features-row">
            <div className="feature-card">
              <MonetizationOnOutlinedIcon className="feature-icon blue-bg" />
              <div className="feature-title">AI Extraction</div>
              <div className="feature-desc">
                Automatically extract transactions from PDFs with advanced
                machine learning algorithms
              </div>
            </div>
            <div className="feature-card">
              <WalletOutlinedIcon className="feature-icon green-bg" />
              <div className="feature-title">Smart Categorization</div>
              <div className="feature-desc">
                Auto-categorize spending with machine learning for better
                financial insights
              </div>
            </div>
            <div className="feature-card">
              <EmojiObjectsOutlinedIcon className="feature-icon purple-bg" />
              <div className="feature-title">Instant Insights</div>
              <div className="feature-desc">
                Get personalized financial insights and advice tailored to your
                spending patterns
              </div>
            </div>
          </div>
          <Button
            className="features-upload-btn"
            variant="contained"
            startIcon={<CloudUploadOutlinedIcon />}
          >
            Upload Your First Statement
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        © 2024 FinanceTracker. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
