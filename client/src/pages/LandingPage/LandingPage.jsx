import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom"; // 👈 import navigate hook
import Button from "@mui/material/Button";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import EmojiObjectsOutlinedIcon from "@mui/icons-material/EmojiObjectsOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

const LandingPage = () => {
  const navigate = useNavigate(); // 👈 initialize navigate

  const heroTitleRef = useRef();
  const heroDescRef = useRef();
  const featuresTitleRef = useRef();
  const featuresDescRef = useRef();
  const cardRefs = useRef([]);
  const featureRefs = useRef([]);

  useEffect(() => {
    gsap.fromTo(
      heroTitleRef.current,
      { opacity: 0, y: -80, rotateX: 75 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.2,
        ease: "power4.out",
        transformOrigin: "top center"
      }
    );
    gsap.fromTo(
      heroDescRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: "power2.out" }
    );
    gsap.fromTo(
      featuresTitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.6, ease: "power3.out" }
    );
    gsap.fromTo(
      featuresDescRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.8, ease: "power2.out" }
    );

    cardRefs.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: 0.4 + i * 0.2,
          ease: "power3.out"
        }
      );
    });

    featureRefs.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 1 + i * 0.2,
          ease: "power3.out"
        }
      );
    });

    gsap.to(".icon1", { y: 25, x: 15, repeat: -1, yoyo: true, duration: 5, ease: "sine.inOut" });
    gsap.to(".icon2", { y: -30, x: -20, repeat: -1, yoyo: true, duration: 6, ease: "sine.inOut" });
    gsap.to(".icon3", { y: 20, x: -10, repeat: -1, yoyo: true, duration: 7, ease: "sine.inOut" });
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  return (
    <motion.div
      className="landing-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="gradient-blob blob1" />
      <div className="gradient-blob blob2" />
      <CurrencyRupeeIcon className="floating-icon icon1" />
      <BarChartOutlinedIcon className="floating-icon icon2" />
      <WalletOutlinedIcon className="floating-icon icon3" />
      <header className="landing-header">
        <div className="landing-logo-group">
          <span className="landing-logo">FinanceTracker</span>
          <span className="landing-subtitle">
            AI-powered personal finance management
          </span>
        </div>
        <div className="landing-header-actions">
          <Button
            className="landing-login-btn"
            onClick={handleLogin}
            variant="text"
            style={{ color: "#3f51b5", fontWeight: "600" }}
          >
            Login
          </Button>
          <Button
            className="landing-getstarted-btn"
            variant="contained"
            onClick={handleSignup}
            style={{
              background: "#3f51b5",
              color: "#fff",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
            }}
          >
            Get Started
          </Button>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
          <h1 className="landing-hero-title" ref={heroTitleRef}>
            Take Control of Your <span className="blue">Financial Future</span>
          </h1>
          <p
            className="landing-hero-desc"
            ref={heroDescRef}
          >
            Our AI-powered platform automatically extracts and categorizes your
            transactions, providing personalized insights to help you make
            smarter financial decisions.
          </p>
          <Button
            className="landing-hero-btn"
            variant="contained"
            color="secondary"
            size="large"
            style={{
              padding: "14px 28px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: "12px",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
              background: "linear-gradient(135deg, #3f51b5, #1de9b6)",
              color: "#fff"
            }}
            onClick={handleSignup}
          >
            Start Your Journey
          </Button>
        </section>

        <section className="landing-summary-cards">
          <div
            className="landing-summary-card"
            ref={(el) => (cardRefs.current[0] = el)}
          >
            <CurrencyRupeeIcon className="summary-icon green" />
            <div className="summary-value green">₹ 12,456.78</div>
            <div className="summary-label">Total Balance</div>
          </div>
          <div
            className="landing-summary-card"
            ref={(el) => (cardRefs.current[1] = el)}
          >
            <BarChartOutlinedIcon className="summary-icon red" />
            <div className="summary-value red">₹ 3,248.92</div>
            <div className="summary-label">Monthly Spending</div>
          </div>
          <div
            className="landing-summary-card"
            ref={(el) => (cardRefs.current[2] = el)}
          >
            <WalletOutlinedIcon className="summary-icon blue" />
            <div className="summary-value blue">12</div>
            <div className="summary-label">Categories</div>
          </div>
        </section>

        <section className="landing-features">
          <h2
            className="features-title"
            ref={featuresTitleRef}
          >
            Powerful AI Features
          </h2>
          <p
            className="features-desc"
            ref={featuresDescRef}
          >
            Upload your bank statements and let our AI do the heavy lifting
          </p>
          <div className="features-row">
            <div
              className="feature-card"
              ref={(el) => (featureRefs.current[0] = el)}
            >
              <MonetizationOnOutlinedIcon className="feature-icon blue-bg" />
              <div className="feature-title">AI Extraction</div>
              <div className="feature-desc">
                Automatically extract transactions from PDFs with advanced
                machine learning algorithms
              </div>
            </div>
            <div
              className="feature-card"
              ref={(el) => (featureRefs.current[1] = el)}
            >
              <WalletOutlinedIcon className="feature-icon green-bg" />
              <div className="feature-title">Smart Categorization</div>
              <div className="feature-desc">
                Auto-categorize spending with machine learning for better
                financial insights
              </div>
            </div>
            <div
              className="feature-card"
              ref={(el) => (featureRefs.current[2] = el)}
            >
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
            onClick={handleSignup}
            style={{
              marginTop: "2rem",
              padding: "12px 24px",
              fontWeight: "600",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ff4081, #7c4dff)",
              color: "#fff",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.15)"
            }}
          >
            Upload Your First Statement
          </Button>
        </section>
      </main>

      <footer className="landing-footer">
        © 2024 FinanceTracker. All rights reserved.
      </footer>
    </motion.div>
  );
};

export default LandingPage;
