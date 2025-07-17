import React, { useState, useEffect, useRef } from "react";
import "./DashboardLayout.css";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { linkGmailAccount } from "../services/services";
const navItems = [
  { label: "Overview" },
  { label: "Transactions" },
  { label: "Insights" },
  { label: "Categories" },
  { label: "Financial Advice" },
];

const DashboardLayout = () => {
  const [active, setActive] = useState("Overview");
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

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
  const handleProfileClick=()=>{
    navigate("/dashboard/userprofile");
  }

  useEffect(() => {
    const currentPath = location.pathname.toLowerCase();
    const matchedLabel = pathToLabel[currentPath];
    if (matchedLabel) {
      setActive(matchedLabel);
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        console.warn("User not logged in.");
        navigate("/login");
      }
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [location]);

  const handleNavClick = (label) => {
    setActive(label);
    navigate(labelToPath[label]);
  };

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  const handleLinkGmail = async () => {
    const password = prompt("Enter PDF password used for bank statements:");
    if (!password || password.trim() === "") {
      alert("Password is required.");
      return;
    }

    try {
      await linkGmailAccount(password);
    } catch (error) {
      console.error("Error linking Gmail:", error);
      alert("Failed to link Gmail. Please try again.");
    }
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
        <div className="dashboard-actions">
          <button className="upload-btn" onClick={handleLayoutUploadClick}>
            Upload Statement
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="dashboard-button">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-btn${active === item.label ? " active" : ""}`}
              onClick={() => handleNavClick(item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="dashboard-profile">
          {user && (
            <div className="profile-dropdown" ref={dropdownRef}>
              <button
                className="profile-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                👤 {user.displayName || "User"}
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">{user.email}</div>
                  <div className="dropdown-item" onClick={handleProfileClick}>
                    Profile
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleLinkGmail()}
                  >
                    📩 Link Gmail
                  </div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    Logout
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
