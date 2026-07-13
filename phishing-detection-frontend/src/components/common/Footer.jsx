import React, { useState, useEffect } from "react";
import {
  FaShieldAlt,
  FaHeart,
  FaRocket,
  FaClock,
  FaShieldVirus,
  FaLock,
  FaUserShield,
  FaArrowUp,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quickLinks = [
    { name: "Dashboard", path: "/" },
    { name: "URL Scanner", path: "/url-scan" },
    { name: "Message Scanner", path: "/message-scan" },
    { name: "History", path: "/history" },
  ];

  const features = [
    { name: "Real-time Detection", icon: "⚡" },
    // { name: "AI-Powered Analysis", icon: "🤖" },
    { name: "PDF Reports", icon: "📄" },
    { name: "Scan History", icon: "📊" },
  ];

  return (
    <>
      <footer
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #1a1040 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          borderTop: "1px solid rgba(102,126,234,0.1)",
          // This ensures footer stays at bottom with no extra space
          marginTop: "auto",
          width: "100%",
        }}
      >
        {/* Animated Background Elements */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "300px",
              height: "300px",
              background:
                "radial-gradient(circle, rgba(102,126,234,0.08) 0%, transparent 70%)",
              top: "-150px",
              right: "-150px",
              borderRadius: "50%",
              animation: "float 20s infinite ease-in-out",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              background:
                "radial-gradient(circle, rgba(240,147,251,0.06) 0%, transparent 70%)",
              bottom: "-100px",
              left: "-100px",
              borderRadius: "50%",
              animation: "float 25s infinite ease-in-out reverse",
            }}
          />
        </div>

        {/* Main Footer Content - compact and flush */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "28px 24px 16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Footer Grid - compact */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.2fr",
              gap: "20px",
              marginBottom: "16px",
            }}
          >
            {/* Brand Column */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(102,126,234,0.3)",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.05) rotate(-5deg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1) rotate(0deg)")
                  }
                >
                  <FaShieldAlt style={{ fontSize: "18px", color: "white" }} />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    SecureShield
                  </span>
                  <span
                    style={{
                      fontSize: "8px",
                      display: "block",
                      color: "#94a3b8",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      marginTop: "1px",
                    }}
                  >
                    AI-Powered Security
                  </span>
                </div>
              </div>
              <p
                style={{
                  color: "#94a3b8",
                  lineHeight: "1.5",
                  marginBottom: "10px",
                  fontSize: "12px",
                  maxWidth: "320px",
                }}
              >
                Advanced machine learning protection against phishing URLs and
                scam messages. Stay safe online with real-time threat detection.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "rgba(16,185,129,0.1)",
                    padding: "3px 10px",
                    borderRadius: "16px",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "5px",
                      height: "5px",
                      background: "#10b981",
                      borderRadius: "50%",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <span style={{ fontSize: "10px", color: "#10b981" }}>
                    Active Protection
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "rgba(102,126,234,0.1)",
                    padding: "3px 10px",
                    borderRadius: "16px",
                    border: "1px solid rgba(102,126,234,0.2)",
                  }}
                >
                  <FaClock style={{ fontSize: "9px", color: "#667eea" }} />
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    24/7 Monitoring
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "10px",
                  color: "white",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Quick Links
                <div
                  style={{
                    position: "absolute",
                    bottom: "-3px",
                    left: 0,
                    width: "20px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #667eea, transparent)",
                    borderRadius: "2px",
                  }}
                />
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {quickLinks.map((link, index) => (
                  <li key={index} style={{ marginBottom: "4px" }}>
                    <a
                      href={link.path}
                      style={{
                        color: "#94a3b8",
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "12px",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#667eea";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span
                        style={{
                          opacity: 0,
                          transition: "opacity 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "0")
                        }
                      >
                        →
                      </span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Column */}
            <div>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "10px",
                  color: "white",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Features
                <div
                  style={{
                    position: "absolute",
                    bottom: "-3px",
                    left: 0,
                    width: "20px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #667eea, transparent)",
                    borderRadius: "2px",
                  }}
                />
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#94a3b8",
                      fontSize: "12px",
                      transition: "all 0.3s ease",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>{feature.icon}</span>
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "10px",
                  color: "white",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Get in Touch
                <div
                  style={{
                    position: "absolute",
                    bottom: "-3px",
                    left: 0,
                    width: "20px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #667eea, transparent)",
                    borderRadius: "2px",
                  }}
                />
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#94a3b8",
                    transition: "all 0.3s ease",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "rgba(102,126,234,0.15)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaEnvelope style={{ color: "#667eea", fontSize: "11px" }} />
                  </div>
                  <span>support@secureshield.com</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#94a3b8",
                    transition: "all 0.3s ease",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "rgba(102,126,234,0.15)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaPhone style={{ color: "#667eea", fontSize: "11px" }} />
                  </div>
                  <span>+977 9844330051</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#94a3b8",
                    transition: "all 0.3s ease",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "rgba(102,126,234,0.15)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaMapMarkerAlt
                      style={{ color: "#667eea", fontSize: "11px" }}
                    />
                  </div>
                  <span>Balkumari, Lalitpur, Nepal</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#94a3b8",
                    transition: "all 0.3s ease",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "rgba(102,126,234,0.15)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FaGlobe style={{ color: "#667eea", fontSize: "11px" }} />
                  </div>
                  <span>24/7 Global Protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators - compact */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              padding: "10px 0",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div
                style={{
                  background: "rgba(16,185,129,0.15)",
                  padding: "3px",
                  borderRadius: "50%",
                }}
              >
                <FaLock style={{ color: "#10b981", fontSize: "10px" }} />
              </div>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                SSL Encrypted
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div
                style={{
                  background: "rgba(16,185,129,0.15)",
                  padding: "3px",
                  borderRadius: "50%",
                }}
              >
                <FaUserShield style={{ color: "#10b981", fontSize: "10px" }} />
              </div>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                GDPR Compliant
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div
                style={{
                  background: "rgba(16,185,129,0.15)",
                  padding: "3px",
                  borderRadius: "50%",
                }}
              >
                <FaShieldVirus
                  style={{ color: "#10b981", fontSize: "10px" }}
                />
              </div>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                Real-time Protection
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <div
                style={{
                  background: "rgba(16,185,129,0.15)",
                  padding: "3px",
                  borderRadius: "50%",
                }}
              >
                <FaRocket style={{ color: "#10b981", fontSize: "10px" }} />
              </div>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                99.9% Uptime
              </span>
            </div>
          </div>

          {/* Bottom Bar - flush, no extra space */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              © {currentYear} SecureShield. All rights reserved.
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#94a3b8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#64748b")
              }
            >
              Made with{" "}
              <FaHeart
                style={{
                  color: "#ef4444",
                  fontSize: "10px",
                  animation: "heartbeat 1.5s infinite",
                }}
              />{" "}
              by Team SecureShield
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <a
                href="#"
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                  fontSize: "10px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#667eea";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Privacy
              </a>
              <a
                href="#"
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                  fontSize: "10px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#667eea";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Terms
              </a>
              <a
                href="#"
                style={{
                  color: "#64748b",
                  textDecoration: "none",
                  fontSize: "10px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#667eea";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            width: "42px",
            height: "42px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(102,126,234,0.4)",
            transition: "all 0.3s ease",
            zIndex: 1000,
            animation: "fadeInUp 0.3s ease-out",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px) scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 8px 30px rgba(102,126,234,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(102,126,234,0.4)";
          }}
        >
          <FaArrowUp size={16} />
        </button>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.3); }
          28% { transform: scale(1); }
          42% { transform: scale(1.3); }
          70% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default Footer;