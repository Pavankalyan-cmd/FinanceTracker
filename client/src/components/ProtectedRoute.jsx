// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust to your actual context path

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loader">Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
