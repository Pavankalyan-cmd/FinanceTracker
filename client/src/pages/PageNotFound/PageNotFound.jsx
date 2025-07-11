import React from "react";
import Lottie from "lottie-react";
import animationData from "../../assets/404-animation.json";

export default function PageNotFound() {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <Lottie animationData={animationData} loop style={{ height: 300 }} />
      <h2>Oops! Page Not Found</h2>
      <p>This route doesn’t exist in your finance tracker app.</p>
    </div>
  );
}
