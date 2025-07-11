import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./LoginPage.css";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  getAuth,
} from "firebase/auth";


const LoginPage = ({ onBack, onForgot, onSignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    const user = getAuth().currentUser;

  
    toast.success("Login successful!");
    navigate("/dashboard"); 
  };

  const handleAuthError = (error) => {
    let errorMessage = "Login failed. Please try again.";

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No user found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password.";
        break;
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address.";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled.";
        break;
      case "auth/popup-closed-by-user":
        errorMessage = "Login popup was closed before completion.";
        break;
    }

    toast.error(errorMessage);
    setLoading(false);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleSSOLogin = async (provider) => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      handleAuthSuccess();
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await handleSSOLogin(provider);
  };

  const handleGitHubLogin = async () => {
    const provider = new GithubAuthProvider();
    await handleSSOLogin(provider);
  };

  return (
    <div className="login-root">
      <div className="login-back-home" onClick={onBack}>
        <ArrowBackIosNewIcon fontSize="small" /> Back to Home
      </div>
      <div className="login-header">
        <div className="login-app-title">FinanceTracker</div>
        <div className="login-app-desc">
          Welcome back to your financial dashboard
        </div>
      </div>
      <div className="login-card">
        <div className="login-card-title">Sign In</div>
        <div className="login-card-desc">
          Access your personalized financial insights
        </div>
        <Button
          className="login-google-btn"
          startIcon={<EmailOutlinedIcon />}
          fullWidth
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Continue with Google
        </Button>
        <Button
          className="login-github-btn"
          startIcon={<GitHubIcon />}
          fullWidth
          onClick={handleGitHubLogin}
          disabled={loading}
        >
          Continue with GitHub
        </Button>
        <div className="login-divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>
        <form className="login-form" onSubmit={handleEmailLogin}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            className="login-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            variant="outlined"
            className="login-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <div className="login-row-between">
            <FormControlLabel
              control={
                <Checkbox
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Remember me"
              className="login-remember"
            />
            <span className="login-forgot" onClick={onForgot}>
              Forgot password?
            </span>
          </div>
          <Button
            variant="contained"
            fullWidth
            className="login-signin-btn"
            type="submit"
            startIcon={<PersonOutlineIcon />}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
        <div className="login-footer">
          Don&apos;t have an account?{" "}
          <span className="login-signup-link" onClick={onSignup}>
            Create one now
          </span>
        </div>
      </div>
      <div className="login-feature-card">
        <div className="login-feature-title">Why Choose FinanceTracker?</div>
        <div className="login-feature-row">
          <div className="login-feature-stat">
            <span className="login-feature-value blue">99%</span>
            <span className="login-feature-label">Accuracy Rate</span>
          </div>
          <div className="login-feature-stat">
            <span className="login-feature-value green">10k+</span>
            <span className="login-feature-label">Happy Users</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
