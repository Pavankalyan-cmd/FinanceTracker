import React, { useRef, useEffect, useState } from "react";
import "./TransactionsPage.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { fetchTransactions } from "../services/services";

const getCategoryColor = (category) => {
  switch (category) {
    case "Dining":
      return "orange";
    case "Groceries":
      return "green";
    case "Shopping":
      return "purple";
    case "Utilities":
      return "blue";
    case "Transportation":
      return "yellow";
    case "Entertainment":
      return "red";
    case "Healthcare":
      return "teal";
    case "Salary":
    case "Income":
      return "green";
    default:
      return "gray";
  }
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTxns, setFilteredTxns] = useState([]);
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTransactions();
        const sorted = [...data].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setTransactions(sorted);
        setFilteredTxns(sorted);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetched.current) {
      hasFetched.current = true;
      loadData();
    }
  }, []);
  const handleFilter = () => {
    let filtered = [...transactions];

    if (month) {
      filtered = filtered.filter((tx) => tx.date.slice(0, 7) === month);
    }

    if (category) {
      filtered = filtered.filter((tx) => tx.category === category);
    }

    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredTxns(sorted);
  };

  const handleReset = () => {
    setMonth("");
    setCategory("");
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setFilteredTxns(sorted);
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Title,Date,Amount,Type,Category,Payment Method"]
        .concat(
          filteredTxns.map((tx) =>
            [
              tx.title,
              tx.date,
              tx.amount,
              tx.type,
              tx.category,
              tx.payment_method || "Unknown",
            ].join(",")
          )
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
  };

  const getHeadingTitle = () => {
    if (!month) return "Transactions";
    const dateObj = new Date(month + "-01");
    return `${dateObj.toLocaleString("default", {
      month: "long",
      year: "numeric",
    })} Transactions`;
  };

  return (
    <div className="transactions-page">
      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <p>Loading transactions...</p>
        </div>
      ) : (
        <>
          <div className="transactions-header-row">
            <h2 className="transactions-title">{getHeadingTitle()}</h2>
            <div className="transactions-actions">
              <Box sx={{ minWidth: 130, marginRight: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={month}
                    label="Month"
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {[
                      ...new Set(transactions.map((t) => t.date.slice(0, 7))),
                    ].map((m) => (
                      <MenuItem key={m} value={m}>
                        {new Date(m + "-01").toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: 140, marginRight: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {[...new Set(transactions.map((t) => t.category))].map(
                      (c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Box>

              <Button variant="contained" onClick={handleFilter}>
                Filter
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ marginLeft: 1 }}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                onClick={handleExport}
                sx={{ marginLeft: 1 }}
              >
                Export
              </Button>
            </div>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Debit</TableCell>
                  <TableCell>Credit</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Category</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTxns.map((tx, idx) => {
                  const isCredit = tx.type === "credit";
                  const color = getCategoryColor(tx.category);

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          {isCredit ? (
                            <AttachMoneyIcon fontSize="small" />
                          ) : (
                            <CreditCardIcon fontSize="small" />
                          )}
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span style={{ fontWeight: 500 }}>{tx.title}</span>
                            <span
                              style={{ fontSize: "0.85rem", color: "#777" }}
                            >
                              {tx.date}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        sx={{ color: !isCredit ? "#4caf50" : "inherit" }}
                      >
                        {!isCredit && `₹${parseFloat(tx.amount).toFixed(2)}`}
                      </TableCell>
                      <TableCell
                        sx={{ color: isCredit ? "#4caf50" : "inherit" }}
                      >
                        {isCredit && `₹${parseFloat(tx.amount).toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {tx.payment_method || "Not specified"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`category-badge ${color}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {tx.category}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
};

export default TransactionsPage;
