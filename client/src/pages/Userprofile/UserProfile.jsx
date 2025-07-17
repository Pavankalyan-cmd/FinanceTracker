import React, { useEffect, useState } from "react";
import { getAuth, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import "./UserProfile.css";
import { toast } from "react-toastify";

const UserProfile = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(user, { displayName, photoURL });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile.");
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Error sending reset email.");
    }
  };

  return (
    < div className="container-fluid">
      <div className="profile-wrapper">
        <div>
          <div className="profile-header-section">
            <img
              src={photoURL || "/default-avatar.png"}
              alt="Profile"
              className="profile-avatar"
            />
            <h2>{displayName || "User"}</h2>
            <p>{email}</p>
          </div>
        </div>
        <div className="profile-body">
          <div>
            <div className="form-group">
              <label>Display Name:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Photo URL:</label>
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input type="text" value={email} disabled />
            </div>

            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>

            <button className="reset-btn" onClick={handlePasswordReset}>
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
