import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router-dom";
import DashboardLayout from "../DashboardLayout/DashboardLayout";
import LoginPage from "../LoginPage/LoginPage";
import SignupPage from "../SignupPage/SignupPage";
import LandingPage from "../LandingPage/LandingPage";



export default function MainPage() {
  ;

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="*" element={<DashboardLayout />} />
      </Routes>
    </div>
  );
}
