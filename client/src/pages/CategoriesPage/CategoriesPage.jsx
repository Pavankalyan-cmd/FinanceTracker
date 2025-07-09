import React, { useState, useEffect } from "react";
import "./CategoriesPage.css";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  fetchPendingReviewTransactions,
  updateTransactionCategory,
} from "../services/services";

const categories = [
  "Dining",
  "Groceries",
  "Utilities",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Income",
  "Others",
];

const getCategoryColor = (category) => {
  switch (category) {
    case "Dining":
      return "orange";
    case "Groceries":
      return "green";
    case "Utilities":
      return "blue";
    case "Transportation":
      return "yellow";
    case "Shopping":
      return "purple";
    case "Entertainment":
      return "pink";
    case "Healthcare":
      return "red";
    case "Income":
      return "green";
    default:
      return "gray";
  }
};

const CategoriesPage = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [successIndex, setSuccessIndex] = useState(null);

  useEffect(() => {
    fetchPendingReviewTransactions()
      .then(setPendingTransactions)
      .catch(console.error);
  }, []);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setSelectedCategory(pendingTransactions[index].category);
  };

  const handleSave = async (index) => {
    const tx = pendingTransactions[index];
    try {
      await updateTransactionCategory(
        tx.id,
        selectedCategory,
        tx.title,
        tx.amount
      );

      setSuccessIndex(index);
      setTimeout(() => {
        const updated = [...pendingTransactions];
        updated.splice(index, 1);
        setPendingTransactions(updated);
        setEditingIndex(null);
        setSuccessIndex(null);
      }, 1000);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="category-management-page">
      <div className="category-header-row">
        <h2 className="category-title">Category Management</h2>
      </div>
      <div className="category-card">
        <div className="pending-review-header">
          <WarningAmberOutlinedIcon
            className="pending-warning-icon"
            fontSize="small"
          />
          <span className="pending-title">Transactions Pending Review</span>
          <span className="pending-count">{pendingTransactions.length}</span>
        </div>
        <div className="pending-list">
          {pendingTransactions.map((tx, idx) => (
            <div
              key={tx.id}
              className={`pending-row ${
                successIndex === idx ? "fade-out" : ""
              }`}
            >
              <div className="pending-info">
                <div className="pending-name">{tx.title}</div>
                <div className="pending-meta">
                  ₹{tx.amount.toFixed(2)} · {tx.confidence}% confidence
                </div>
              </div>
              <div className="pending-actions">
                {editingIndex === idx ? (
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    size="small"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <span
                    className={`category-badge ${getCategoryColor(
                      tx.category
                    )}`}
                  >
                    {tx.category}
                  </span>
                )}

                {editingIndex === idx ? (
                  <Button
                    onClick={() => handleSave(idx)}
                    variant="outlined"
                    className="approve-btn"
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleEdit(idx)}
                    variant="outlined"
                    className="edit-btn"
                  >
                    Edit
                  </Button>
                )}

                <Tooltip
                  title={
                    <div style={{ fontSize: "12px", padding: "4px" }}>
                      <div>
                        <strong>Date:</strong> {tx.date}
                      </div>
                      <div>
                        <strong>Description:</strong> {tx.description}
                      </div>
                      <div>
                        <strong>Payment Method:</strong> {tx.payment_method}
                      </div>
                      <div>
                        <strong>Type:</strong> {tx.type}
                      </div>
                      <div>
                        <strong>ID:</strong> {tx.id}
                      </div>
                    </div>
                  }
                  arrow
                  placement="top"
                >
                  <InfoOutlinedIcon
                    fontSize="small"
                    style={{ cursor: "pointer", marginLeft: 8 }}
                  />
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
