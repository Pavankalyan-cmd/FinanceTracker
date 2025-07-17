import { getAuth } from "firebase/auth";
import axios from "axios";

const API_BASE = process.env.REACT_APP_BASE_URL; 
export async function uploadBankStatement(
  file,
  password = "",
  checkContinuity = true
) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);
  formData.append("check_continuity", checkContinuity.toString()); 

  const response = await fetch(`${API_BASE}/upload-bank-statement-cot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

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




// Update a transaction's category + store learning
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

// Delete a goal
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

  // Return directly, since data already has `insights`, `monthly_health`, `updated_at`
  return data;
}
export async function generateFinancialAdvice() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}/ai/financial-advice/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to generate AI financial advice");

  const data = await res.json();

  return data.advice_json;
}




export async function syncGmailStatements() {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}/gmail/sync`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to sync Gmail statements");
  }

  return await res.json(); // returns { synced_pdfs: N }
}



export async function linkGmailAccount(password) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();

  const params = new URLSearchParams({
    token,
    password,
  });

  // Redirect to backend which will generate Gmail auth URL
  window.location.href = `${API_BASE}/auth/gmail?${params.toString()}`;
}
