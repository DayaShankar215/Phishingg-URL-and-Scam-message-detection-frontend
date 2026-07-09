// components/common/ProtectedRoute.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "./AuthModal";

const ProtectedRoute = ({ children, showAuthModal = true }) => {
  const { isAuthenticated, loading } = useAuth();
  const [showModal, setShowModal] = React.useState(false);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated && showAuthModal) {
    return (
      <>
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <span style={{ fontSize: "40px" }}>🔒</span>
          </div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "12px",
            }}
          >
            Sign in to Access
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#64748b",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            Sign in to save your scan history, download PDF reports, and access
            all premium features across all your devices.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(102,126,234,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(102,126,234,0.4)";
            }}
          >
            Sign In / Register
          </button>
        </div>
        <AuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      </>
    );
  }

  return children;
};

export default ProtectedRoute;