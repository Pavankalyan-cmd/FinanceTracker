import React, { useState, useEffect } from "react";
import "./DashboardLayout.css";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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

  const labelToPath = {
    Overview: "overview",
    Transactions: "transactions",
    Insights: "financial-insights",
    Categories: "categories",
    "Financial Advice": "financial-advice",
  };

  const pathToLabel = Object.fromEntries(
    Object.entries(labelToPath).map(([label, path]) => [
      `/dashboard/${path}`,
      label,
    ])
  );
  const handleLayoutUploadClick = () => {
    navigate("/dashboard/overview");
    setTimeout(() => {
      window.dispatchEvent(new Event("trigger-upload"));
    }, 300); // Give OverviewPage time to mount
  };

  useEffect(() => {
    const currentPath = location.pathname.toLowerCase();
    const matchedLabel = pathToLabel[currentPath];
    if (matchedLabel) {
      setActive(matchedLabel);
    }

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
        <button className="upload-btn" onClick={handleLayoutUploadClick}>
          Upload Statement
        </button>
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
        {/* 🔁 This renders the correct child page from /dashboard/* */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
