import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./SignupPage.css";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import EmojiObjectsOutlinedIcon from "@mui/icons-material/EmojiObjectsOutlined";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth } from "../../firebase";

const SignupPage = ({ onBack, onGoogle, onGitHub, onSignIn }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    toast.success("Account created successfully!");
    navigate("/dashboard");
  };

  const handleAuthError = (error) => {
    let errorMessage = "Signup failed. Please try again.";
    
    switch(error.code) {
      case "auth/email-already-in-use":
        errorMessage = "This email is already in use.";
        break;
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address.";
        break;
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters.";
        break;
      case "auth/operation-not-allowed":
        errorMessage = "Email/password accounts are not enabled.";
        break;
    }
    
    toast.error(errorMessage);
    setLoading(false);
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleSSOSignup = async (provider) => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      handleAuthSuccess();
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    await handleSSOSignup(provider);
  };

  const handleGitHubSignup = async () => {
    const provider = new GithubAuthProvider();
    await handleSSOSignup(provider);
  };

  return (
    <div className="signup-root">
      <div className="signup-back-home" onClick={onBack}>
        <ArrowBackIosNewIcon fontSize="small" /> Back to Home
      </div>
      <div className="signup-header">
        <div className="signup-app-title">FinanceTracker</div>
        <div className="signup-app-desc">
          Start your financial journey today
        </div>
      </div>
      <div className="signup-card">
        <div className="signup-card-title">Create Account</div>
        <div className="signup-card-desc">
          Join thousands of users managing their finances smarter
        </div>
        <Button
          className="signup-google-btn"
          startIcon={<EmailOutlinedIcon />}
          fullWidth
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          Continue with Google
        </Button>
        <Button
          className="signup-github-btn"
          startIcon={<GitHubIcon />}
          fullWidth
          onClick={handleGitHubSignup}
          disabled={loading}
        >
          Continue with GitHub
        </Button>
        <div className="signup-divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>
        <form className="signup-form" onSubmit={handleEmailSignup}>
          <div className="signup-name-row">
            <TextField
              label="First Name"
              type="text"
              fullWidth
              margin="normal"
              variant="outlined"
              className="signup-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Last Name"
              type="text"
              fullWidth
              margin="normal"
              variant="outlined"
              className="signup-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
            />
          </div>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            className="signup-input"
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
            className="signup-input"
            placeholder="Create a strong password"
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
          <TextField
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            fullWidth
            margin="normal"
            variant="outlined"
            className="signup-input"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((s) => !s)}
                    edge="end"
                    disabled={loading}
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            fullWidth
            className="signup-create-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        <div className="signup-footer">
          Already have an account?{" "}
          <span className="signup-signin-link" onClick={onSignIn}>
            Sign in
          </span>
        </div>
      </div>
      <div className="signup-features-row">
        <div className="signup-feature-card">
          <CloudDownloadOutlinedIcon className="signup-feature-icon blue-bg" />
          <div className="signup-feature-title">AI Extraction</div>
        </div>
        <div className="signup-feature-card">
          <CategoryOutlinedIcon className="signup-feature-icon green-bg" />
          <div className="signup-feature-title">Smart Categories</div>
        </div>
        <div className="signup-feature-card">
          <EmojiObjectsOutlinedIcon className="signup-feature-icon purple-bg" />
          <div className="signup-feature-title">Instant Insights</div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
