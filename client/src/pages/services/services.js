import { getAuth } from "firebase/auth";
import axios from "axios";

const API_BASE = "http://localhost:8000"; // or your deployed backend URL

export async function uploadBankStatement(file, password = "") {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);
  console.log("Uploading file:", file);

  console.log(password)
  console.log(idToken)
  const response = await fetch(
    `${API_BASE}/upload-bank-statement-cot`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to upload");
  }

  return data;
}

export async function fetchTransactions() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  const res = await fetch(`${API_BASE}/transactions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch transactions");
  }

  const data = await res.json();
  return data.transactions; 
}



// export const fetchFinancialAdviceAPI = async (transactions) => {
//   const auth = getAuth();
//   const user = auth.currentUser;

//   if (!user) throw new Error("User not authenticated");

//   const idToken = await user.getIdToken();

//   const res = await fetch("http://localhost:8000/ai/financial-advice", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${idToken}`, // 🔐 Secure with Firebase auth
//     },
//     body: JSON.stringify({ transactions }),
//   });

//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.detail || "Failed to fetch AI financial advice");
//   }

//   const data = await res.json();
//   return data;
// };




// Base URL for your FastAPI backend






export async function fetchFinancialInsights(period = "Monthly") {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();

  const response = await fetch(
    `${API_BASE}/financial-insights?period=${period}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch insights");
  }

  return data;
}



// services.js

export async function fetchPendingReviewTransactions() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE}/transactions/pending-review`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pending review transactions");
  }

  const data = await response.json();
  return data.transactions;
}







// ✏️ Update a transaction's category + store learning
export async function updateTransactionCategory(
  transactionId,
  newCategory,
  title,
  amount
) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  const res = await fetch(
    `${API_BASE}/transactions/update-category`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_id: transactionId,
        new_category: newCategory,
        title,
        amount,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update transaction category");
  }

  return await res.json();
}




// Fetch all goals (with progress)
export async function fetchGoals() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/goals`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch goals");
  const data = await res.json();
  return data.goals;
}

//  Add a new goal
export async function addGoal(goal) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/goals`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });

  if (!res.ok) throw new Error("Failed to add goal");
  return await res.json(); // returns { message, goal_id }
}

//  Edit a goal
export async function updateGoal(goalId, goal) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/goals/${goalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goal),
  });

  if (!res.ok) throw new Error("Failed to update goal");
  return await res.json();
}

// xDelete a goal
export async function deleteGoal(goalId) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/goals/${goalId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to delete goal");
  return await res.json();
}



export async function fetchFinancialAdvice() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}/ai/financial-advice`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch AI financial advice");

  const data = await res.json();

  // ✅ No need to parse again — already an object
  return data.advice_json;
}
