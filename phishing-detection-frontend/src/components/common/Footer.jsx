import React, { useState, useEffect } from "react";
import {
  FaShieldAlt,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaHeart,
  FaRocket,
  FaClock,
  FaShieldVirus,
  FaLock,
  FaUserShield,
  FaArrowUp,
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
    { name: "Feedback", path: "/feedback" },
  ];

  const resources = [
    { name: "About SecureShield", icon: "🔒" },
    { name: "Security Blog", icon: "📝" },
    { name: "Privacy Policy", icon: "🔐" },
    { name: "Terms of Service", icon: "⚖️" },
    { name: "API Documentation", icon: "📚" },
  ];

  const features = [
    { name: "Real-time Detection", icon: "⚡" },
    { name: "AI-Powered Analysis", icon: "🤖" },
    { name: "PDF Reports", icon: "📄" },
    { name: "Scan History", icon: "📊" },
  ];

  return (
    <>
      <footer
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          marginTop: "60px",
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
                "radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)",
              top: "-150px",
              right: "-150px",
              borderRadius: "50%",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              background:
                "radial-gradient(circle, rgba(240,147,251,0.1) 0%, transparent 70%)",
              bottom: "-100px",
              left: "-100px",
              borderRadius: "50%",
            }}
          ></div>
        </div>

        {/* Main Footer Content */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "10px 1px 50px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top Section with Newsletter */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)",
              borderRadius: "24px",
              padding: "40px",
              marginBottom: "60px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(102,126,234,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "8px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Stay Protected
                </h3>
                <p style={{ color: "#cbd5e0", fontSize: "14px" }}>
                  Get weekly security tips and threat alerts
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    padding: "14px 20px",
                    borderRadius: "12px",
                    border: "1px solid rgba(102,126,234,0.5)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontSize: "14px",
                    minWidth: "280px",
                    outline: "none",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) =>
                    (e.target.style.background = "rgba(255,255,255,0.2)")
                  }
                  onBlur={(e) =>
                    (e.target.style.background = "rgba(255,255,255,0.1)")
                  }
                />
                <button
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    padding: "14px 28px",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "transform 0.3s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Footer Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "48px",
              marginBottom: "60px",
            }}
          >
            {/* Brand Column */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 15px rgba(102,126,234,0.3)",
                  }}
                >
                  <FaShieldAlt style={{ fontSize: "24px", color: "white" }} />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: "800",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                      color: "#94a3b8",
                      letterSpacing: "0.5px",
                    }}
                  >
                    AI-Powered Security
                  </span>
                </div>
              </div>
              <p
                style={{
                  color: "#cbd5e0",
                  lineHeight: "1.6",
                  marginBottom: "20px",
                  fontSize: "14px",
                }}
              >
                Protecting users from phishing URLs and scam messages using
                advanced machine learning technology.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <a
                  href="#"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    color: "white",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#667eea")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                >
                  <FaGithub />
                </a>
                <a
                  href="#"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    color: "white",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#1da1f2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                >
                  <FaTwitter />
                </a>
                <a
                  href="#"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    color: "white",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#0077b5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                >
                  <FaLinkedin />
                </a>
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "20px",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Quick Links
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    width: "40px",
                    height: "3px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "2px",
                  }}
                ></div>
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {quickLinks.map((link, index) => (
                  <li key={index} style={{ marginBottom: "12px" }}>
                    <a
                      href={link.path}
                      style={{
                        color: "#cbd5e0",
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#667eea";
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#cbd5e0";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <span>→</span>
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
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "20px",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Features
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    width: "40px",
                    height: "3px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "2px",
                  }}
                ></div>
              </h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#cbd5e0",
                      fontSize: "14px",
                    }}
                  >
                    <span>{feature.icon}</span>
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Info Column */}
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "20px",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                Contact Info
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    width: "40px",
                    height: "3px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "2px",
                  }}
                ></div>
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#cbd5e0",
                  }}
                >
                  <FaEnvelope style={{ color: "#667eea" }} />
                  <span style={{ fontSize: "14px" }}>
                    support@SecureShield.com
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#cbd5e0",
                  }}
                >
                  <FaPhone style={{ color: "#667eea" }} />
                  <span style={{ fontSize: "14px" }}>+977 1-1234567</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#cbd5e0",
                  }}
                >
                  <FaMapMarkerAlt style={{ color: "#667eea" }} />
                  <span style={{ fontSize: "14px" }}>
                    Balkumari, Lalitpur, Nepal
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#cbd5e0",
                  }}
                >
                  <FaClock style={{ color: "#667eea" }} />
                  <span style={{ fontSize: "14px" }}>
                    24/7 Real-time Protection
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              padding: "20px 0",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              marginBottom: "30px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaLock style={{ color: "#10b981" }} />
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                SSL Encrypted
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaUserShield style={{ color: "#10b981" }} />
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                GDPR Compliant
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaShieldVirus style={{ color: "#10b981" }} />
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Real-time Protection
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaRocket style={{ color: "#10b981" }} />
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                99.9% Uptime
              </span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#94a3b8" }}>
              © {currentYear} SecureShield. All rights reserved.
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Made with{" "}
              <FaHeart style={{ color: "#ef4444", fontSize: "12px" }} /> by Team
              SecureShield
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              {resources.map((resource, index) => (
                <a
                  key={index}
                  href="#"
                  style={{
                    color: "#94a3b8",
                    textDecoration: "none",
                    fontSize: "12px",
                    transition: "color 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#667eea")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#94a3b8")
                  }
                >
                  <span>{resource.icon}</span>
                  {resource.name}
                </a>
              ))}
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
            width: "50px",
            height: "50px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "25px",
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
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow =
              "0 8px 30px rgba(102,126,234,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(102,126,234,0.4)";
          }}
        >
          <FaArrowUp size={20} />
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
      `}</style>
    </>
  );
};

export default Footer;
