import { Route, Routes, Navigate } from "react-router-dom";
import DashboardLayout from "../DashboardLayout/DashboardLayout";
import OverviewPage from "../OverviewPage/OverviewPage";
import TransactionsPage from "../TransactionsPage/TransactionsPage";
import FinancialInsightsPage from "../FinancialInsightsPage/FinancialInsightsPage";
import CategoriesPage from "../CategoriesPage/CategoriesPage";
import FinancialAdvicePage from "../FinancialAdvicePage/FinancialAdvicePage";
import LandingPage from "../LandingPage/LandingPage";
import LoginPage from "../LoginPage/LoginPage";
import SignupPage from "../SignupPage/SignupPage";
import PageNotFound from "../PageNotFound/PageNotFound";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function MainPage() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route
            path="financial-insights"
            element={<FinancialInsightsPage />}
          />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="financial-advice" element={<FinancialAdvicePage />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
