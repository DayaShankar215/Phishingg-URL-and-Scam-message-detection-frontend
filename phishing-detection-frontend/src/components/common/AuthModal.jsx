// components/common/AuthModal.jsx
import React, { useState } from "react";
import { FaTimes, FaEnvelope, FaLock, FaUser, FaGoogle, FaGithub } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const AuthModal = ({ isOpen, onClose, initialMode = "login", onSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setConfirmPassword("");
    setAcceptTerms(false);
    setMode(initialMode);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "register") {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (!acceptTerms) {
        toast.error("Please accept the terms and conditions");
        return;
      }
      if (!firstName.trim()) {
        toast.error("Please enter your first name");
        return;
      }
    }

    setLoading(true);
    try {
      let response;
      if (mode === "login") {
        response = await login({ email, password });
      } else {
        response = await register({ firstName, lastName, email, password });
      }

      toast.success(mode === "login" ? "Welcome back! 🎉" : "Account created successfully! 🎉");
      
      if (onSuccess) {
        onSuccess(response);
      }
      handleClose();
    } catch (error) {
      // Error handling is done in the auth context
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setConfirmPassword("");
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
        animation: "fadeIn 0.3s ease-out",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          maxWidth: "440px",
          width: "100%",
          padding: "32px 28px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f1f5f9",
            border: "none",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
        >
          <FaTimes style={{ color: "#64748b", fontSize: "18px" }} />
        </button>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
            }}
          >
            <span style={{ fontSize: "28px" }}>🛡️</span>
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "4px",
            }}
          >
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {mode === "login"
              ? "Sign in to save your scans and access premium features"
              : "Start securing your online experience today"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#1e293b",
                    marginBottom: "6px",
                  }}
                >
                  First Name
                </label>
                <div style={{ position: "relative" }}>
                  <FaUser
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 44px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "15px",
                      outline: "none",
                      transition: "border-color 0.3s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#1e293b",
                    marginBottom: "6px",
                  }}
                >
                  Last Name
                </label>
                <div style={{ position: "relative" }}>
                  <FaUser
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 44px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "15px",
                      outline: "none",
                      transition: "border-color 0.3s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <FaEnvelope
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <FaLock
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                required
                minLength={6}
              />
            </div>
            {mode === "register" && (
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                Minimum 6 characters
              </p>
            )}
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "6px",
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 44px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "15px",
                    outline: "none",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  required
                />
              </div>
            </div>
          )}

          {mode === "register" && (
            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "#667eea",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                I agree to the{" "}
                <a href="#" style={{ color: "#667eea", textDecoration: "none" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" style={{ color: "#667eea", textDecoration: "none" }}>
                  Privacy Policy
                </a>
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ 
                  width: "20px", 
                  height: "20px", 
                  border: "3px solid rgba(255,255,255,0.3)",
                  borderTop: "3px solid white",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
                <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
              </>
            ) : (
              <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "20px 0",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>
            OR
          </span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>

        {/* Social Buttons */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          {/* <button
            type="button"
            style={{
              flex: 1,
              padding: "12px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            <FaGoogle style={{ color: "#ea4335", fontSize: "18px" }} />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>
              Google
            </span>
          </button> */}
          {/* <button
            type="button"
            style={{
              flex: 1,
              padding: "12px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            <FaGithub style={{ color: "#333", fontSize: "18px" }} />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>
              GitHub
            </span>
          </button> */}
        </div>

        {/* Switch Mode */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={switchMode}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                fontWeight: "600",
                cursor: "pointer",
                marginLeft: "6px",
                fontSize: "14px",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#764ba2")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#667eea")}
            >
              {mode === "login" ? "Sign up now" : "Sign in instead"}
            </button>
          </p>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthModal;