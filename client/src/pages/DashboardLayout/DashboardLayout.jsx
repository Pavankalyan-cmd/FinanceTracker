import React, { useState, useEffect } from "react";
import "./DashboardLayout.css";
import TransactionsPage from "../TransactionsPage/TransactionsPage";
import FinancialInsightsPage from "../FinancialInsightsPage/FinancialInsightsPage";
import OverviewPage from "../OverviewPage/OverviewPage";
import CategoriesPage from "../CategoriesPage/CategoriesPage";
import FinancialAdvicePage from "../FinancialAdvicePage/FinancialAdvicePage";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // ✅ Only for auth check

const navItems = [
  { label: "Overview" },
  { label: "Transactions" },
  { label: "Insights" },
  { label: "Categories" },
  { label: "Financial Advice" },
];

const DashboardLayout = () => {
  const [active, setActive] = useState("Overview");
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Paths
  const labelToPath = {
    Overview: "/overview",
    Transactions: "/transactions",
    Insights: "/financial-insights",
    Categories: "/categories",
    "Financial Advice": "/financial-advice",
  };

  const pathToLabel = Object.fromEntries(
    Object.entries(labelToPath).map(([label, path]) => [path, label])
  );

  useEffect(() => {
    // ✅ Sync active tab with current path
    const currentPath = location.pathname.toLowerCase();
    const matchedLabel = pathToLabel[currentPath];
    if (matchedLabel) {
      setActive(matchedLabel);
    }

    // ✅ Optional: Auth check only (no dispatch)
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.warn("User not logged in.");
        // Optionally redirect to login here: navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [location]);

  const handleNavClick = (label) => {
    setActive(label);
    navigate(labelToPath[label]);
  };

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-title-group">
          <h1 className="dashboard-title">FinanceTracker</h1>
          <p className="dashboard-subtitle">
            AI-powered personal finance management
          </p>
        </div>
        <button className="upload-btn">Upload Statement</button>
      </header>

      <nav className="dashboard-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-btn${active === item.label ? " active" : ""}`}
            onClick={() => handleNavClick(item.label)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        <Routes>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route
            path="/financial-insights"
            element={<FinancialInsightsPage />}
          />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/financial-advice" element={<FinancialAdvicePage />} />
        </Routes>
      </main>
    </div>
  );
};

export default DashboardLayout;
