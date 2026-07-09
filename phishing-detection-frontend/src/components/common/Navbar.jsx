// components/common/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaHome,
  FaGlobe,
  FaEnvelope,
  FaHistory,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaUserPlus,
  FaSignInAlt,
} from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "./AuthModal";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: FaHome },
    { path: "/url-scan", label: "URL Scanner", icon: FaGlobe },
    { path: "/message-scan", label: "Message Scanner", icon: FaEnvelope },
    { path: "/history", label: "History", icon: FaHistory },
  ];

  const isActive = (path) => location.pathname === path;

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setShowUserMenu(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Refresh the current page to show authenticated content
    window.location.reload();
  };

  // Theme-based colors
  const themeColors = {
    background: isDark ? "#0f172a" : "rgba(255, 255, 255, 0.98)",
    backgroundScrolled: isDark ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)",
    backgroundMobile: isDark ? "#1e293b" : "white",
    text: isDark ? "#f1f5f9" : "#475569",
    textActive: isDark ? "#93c5fd" : "#667eea",
    textInactive: isDark ? "#94a3b8" : "#475569",
    border: isDark ? "#334155" : "#e2e8f0",
    hoverBg: isDark ? "#334155" : "#f1f5f9",
    shadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.4)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
  };

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: scrolled
            ? themeColors.backgroundScrolled
            : themeColors.background,
          backdropFilter: "blur(20px)",
          boxShadow: scrolled ? themeColors.shadow : "none",
          transition: "all 0.3s ease",
          borderBottom: `1px solid ${themeColors.border}`,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
              }}
            >
              <FaShieldAlt style={{ color: "white", fontSize: "20px" }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                SecureShield
              </span>
              <span
                style={{
                  fontSize: "10px",
                  display: "block",
                  color: isDark ? "#94a3b8" : "#64748b",
                  letterSpacing: "0.5px",
                }}
              >
                {isAuthenticated ? `Welcome, ${user?.name || "User"}` : "AI Security"}
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive(item.path) ? "white" : themeColors.textInactive,
                  background: isActive(item.path)
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "transparent",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = themeColors.hoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Section */}
            {isAuthenticated ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "transparent",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    color: themeColors.text,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = themeColors.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {user?.name || "User"}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: themeColors.backgroundMobile,
                      borderRadius: "16px",
                      boxShadow: `0 20px 60px ${themeColors.shadow}`,
                      border: `1px solid ${themeColors.border}`,
                      padding: "8px",
                      minWidth: "200px",
                      zIndex: 1000,
                    }}
                  >
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        textDecoration: "none",
                        color: themeColors.text,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = themeColors.hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <FaUser size={16} />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        width: "100%",
                        borderRadius: "10px",
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <FaSignOutAlt size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleAuthClick("login")}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    color: themeColors.text,
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = themeColors.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FaSignInAlt size={16} />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => handleAuthClick("register")}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    color: "white",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(102,126,234,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaUserPlus size={16} />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: themeColors.text,
              padding: "8px",
            }}
            className="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            style={{
              padding: "20px",
              background: themeColors.backgroundMobile,
              borderTop: `1px solid ${themeColors.border}`,
              display: "none",
            }}
            className="mobile-menu"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive(item.path) ? themeColors.textActive : themeColors.text,
                  background: isActive(item.path) ? themeColors.hoverBg : "transparent",
                  fontWeight: "500",
                  marginBottom: "8px",
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: `1px solid ${themeColors.border}`,
              }}
            >
              {isAuthenticated ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "12px",
                      background: themeColors.hoverBg,
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: themeColors.text }}>
                        {user?.name || "User"}
                      </div>
                      <div style={{ fontSize: "12px", color: themeColors.textInactive }}>
                        {user?.email || ""}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "12px",
                      textDecoration: "none",
                      color: themeColors.text,
                      marginBottom: "8px",
                    }}
                  >
                    <FaUser size={16} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "none",
                      background: "transparent",
                      color: "#ef4444",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <FaSignOutAlt size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick("login")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "none",
                      background: "transparent",
                      color: themeColors.text,
                      cursor: "pointer",
                      marginBottom: "8px",
                    }}
                  >
                    <FaSignInAlt size={16} />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => handleAuthClick("register")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      width: "100%",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <FaUserPlus size={16} />
                    <span>Create Account</span>
                  </button>
                </>
              )}
            </div>

            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: `1px solid ${themeColors.border}`,
              }}
            >
              <ThemeToggle />
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .mobile-menu-btn {
              display: block !important;
            }
            .mobile-menu {
              display: block !important;
            }
          }
        `}</style>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Navbar;