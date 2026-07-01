import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaShieldAlt,
  FaHome,
  FaGlobe,
  FaEnvelope,
  FaHistory,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark } = useTheme();

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

  // Theme-based colors
  const themeColors = {
    background: isDark ? '#0f172a' : 'rgba(255, 255, 255, 0.98)',
    backgroundScrolled: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    backgroundMobile: isDark ? '#1e293b' : 'white',
    text: isDark ? '#f1f5f9' : '#475569',
    textActive: isDark ? '#93c5fd' : '#667eea',
    textInactive: isDark ? '#94a3b8' : '#475569',
    border: isDark ? '#334155' : '#e2e8f0',
    hoverBg: isDark ? '#334155' : '#f1f5f9',
    shadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
  };

  return (
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
          padding: "16px 24px",
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
              AI Security
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
          {/* Theme Toggle in Mobile Menu */}
          <div style={{ 
            marginTop: "12px", 
            paddingTop: "12px", 
            borderTop: `1px solid ${themeColors.border}` 
          }}>
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
  );
};

export default Navbar;