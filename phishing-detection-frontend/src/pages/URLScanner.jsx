// URLScanner.jsx - Professional Analysis Display
import React, { useState } from "react";
import { scanURL, submitFeedback, downloadPDFReport } from "../services/api";
import { validateURL } from "../utils/validators";
import {
  FaShieldAlt,
  FaDownload,
  FaInfoCircle,
  FaLink,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCopy,
  FaStar,
  FaRegStar,
  FaThumbsUp,
  FaThumbsDown,
  FaSpinner,
  FaLock,
  FaUnlock,
  FaGlobe,
  FaServer,
  FaClock,
  FaSearch,
  FaChartLine,
  FaDatabase,
  FaCode,
  FaShieldVirus,
  FaUserSecret,
  FaExternalLinkAlt,
  FaCheck,
  FaTimes,
  FaArrowRight,
} from "react-icons/fa";
import toast from "react-hot-toast";

const URLScanner = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    scanId: "",
    type: "url",
    isAccurate: true,
    rating: 0,
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();

    const validation = validateURL(url);
    if (!validation.isValid) {
      toast.error(validation.error);
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    setShowFeedback(false);
    setFeedbackSubmitted(false);

    try {
      const response = await scanURL(url);
      setResult(response);
      setShowFeedback(true);
      setFeedback((prev) => ({ ...prev, scanId: response.id || response._id }));
      toast.success("Scan completed successfully!");
    } catch (err) {
      const errorMsg = err.message || "Failed to scan URL";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || downloading) return;
    
    const scanId = result.id || result._id;
    if (!scanId) {
      toast.error("Scan ID not found");
      return;
    }

    setDownloading(true);
    try {
      const response = await downloadPDFReport(scanId, "url");
      
      if (!response || !response.data) {
        throw new Error("No data received from server");
      }

      const blob = new Blob([response.data], { 
        type: response.headers?.['content-type'] || 'application/pdf' 
      });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `security_report_${scanId}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast.error(error.message || "Failed to download PDF report");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.scanId) {
      toast.error("Scan ID not found");
      return;
    }

    if (feedback.rating === 0) {
      toast.error("Please rate the detection accuracy");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(
        feedback.scanId,
        feedback.type,
        feedback.isAccurate,
        feedback.comments,
        feedback.rating,
      );
      setFeedbackSubmitted(true);
      toast.success("Thank you for your feedback! 🎉");
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
      }, 3000);
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setFeedback({ ...feedback, rating: star })}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "30px",
          transition: "transform 0.2s",
          padding: "0 4px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {star <= feedback.rating ? (
          <FaStar style={{ color: "#ffc107" }} />
        ) : (
          <FaRegStar style={{ color: "#ddd" }} />
        )}
      </button>
    ));
  };

  const getRiskLevel = (score) => {
    if (score > 70) return { 
      label: "High Risk", 
      color: "#ef4444", 
      bg: "#fee2e2", 
      border: "#fca5a5",
      icon: "🚨",
      badge: "Dangerous"
    };
    if (score > 30) return { 
      label: "Medium Risk", 
      color: "#f59e0b", 
      bg: "#fef3c7", 
      border: "#fcd34d",
      icon: "⚠️",
      badge: "Suspicious"
    };
    return { 
      label: "Low Risk", 
      color: "#10b981", 
      bg: "#d1fae5", 
      border: "#6ee7b7",
      icon: "✅",
      badge: "Safe"
    };
  };

  const getRiskColor = (score) => {
    if (score > 70) return { bg: "#ef4444", light: "#fee", text: "#dc2626" };
    if (score > 30) return { bg: "#f59e0b", light: "#fff3e0", text: "#ed6c02" };
    return { bg: "#10b981", light: "#e8f5e9", text: "#2e7d32" };
  };

  const riskColor = result ? getRiskColor(result.riskScore) : null;
  const riskLevel = result ? getRiskLevel(result.riskScore) : null;

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
        minHeight: "calc(100vh - 200px)",
        background: "#f8fafc",
      }}
    >
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
            padding: "8px 20px",
            borderRadius: "100px",
            marginBottom: "20px",
          }}
        >
          <FaShieldAlt style={{ color: "#667eea" }} />
          <span style={{ fontWeight: "600", color: "#667eea" }}>
            AI-Powered Security Scanner
          </span>
        </div>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "16px",
          }}
        >
          URL Security Scanner
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#64748b",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Instantly detect phishing URLs, malicious links, and suspicious
          websites using advanced machine learning
        </p>
      </div>

      {/* Input Card */}
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          padding: "32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          marginBottom: "32px",
        }}
      >
        <form onSubmit={handleScan}>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "12px",
                fontWeight: "600",
                color: "#1e293b",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Enter Website URL
            </label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <FaLink
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or suspect-website.com"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "16px",
                    fontSize: "16px",
                    transition: "all 0.3s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  disabled={loading}
                />
                {url && (
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: copied ? "#10b981" : "#94a3b8",
                    }}
                  >
                    <FaCopy />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  padding: "16px 32px",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>Scan URL</span>
                  </>
                )}
              </button>
            </div>
            <p
              style={{ fontSize: "12px", color: "#94a3b8", marginTop: "12px" }}
            >
              Supports HTTP, HTTPS, and all standard URL formats
            </p>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            background: "#fee",
            borderLeft: "4px solid #ef4444",
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FaExclamationTriangle
            style={{ color: "#ef4444", fontSize: "20px" }}
          />
          <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div style={{ animation: "slideUp 0.5s ease-out" }}>
          {/* ============================================================ */}
          {/* RISK SCORE CARD - Professional Design */}
          {/* ============================================================ */}
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              marginBottom: "32px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              border: `1px solid ${riskLevel.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gradient Background */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${riskLevel.color}15 0%, transparent 70%)`,
                transform: "translate(100px, -100px)",
              }}
            />
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{riskLevel.icon}</span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: riskLevel.color,
                      background: riskLevel.bg,
                      padding: "4px 16px",
                      borderRadius: "100px",
                    }}
                  >
                    {riskLevel.badge}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#94a3b8",
                    }}
                  >
                    Risk Assessment
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "56px",
                      fontWeight: "800",
                      color: riskLevel.color,
                      lineHeight: 1,
                    }}
                  >
                    {Math.round(result.riskScore)}%
                  </span>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: riskLevel.color,
                    }}
                  >
                    {riskLevel.label}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                style={{
                  background: riskLevel.color,
                  color: "white",
                  padding: "14px 28px",
                  border: "none",
                  borderRadius: "14px",
                  cursor: downloading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontWeight: "600",
                  fontSize: "15px",
                  transition: "all 0.3s ease",
                  opacity: downloading ? 0.6 : 1,
                  boxShadow: `0 4px 16px ${riskLevel.color}40`,
                }}
                onMouseEnter={(e) => {
                  if (!downloading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = `0 6px 24px ${riskLevel.color}50`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!downloading) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = `0 4px 16px ${riskLevel.color}40`;
                  }
                }}
              >
                {downloading ? (
                  <>
                    <FaSpinner className="spinning" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <FaDownload />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: "20px", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${result.riskScore}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${riskLevel.color}80, ${riskLevel.color})`,
                    borderRadius: "4px",
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                <span>Low Risk (0%)</span>
                <span>Medium (50%)</span>
                <span>High Risk (100%)</span>
              </div>
            </div>

            <p
              style={{
                marginTop: "16px",
                fontSize: "15px",
                color: riskLevel.color,
                fontWeight: "500",
                position: "relative",
                zIndex: 1,
              }}
            >
              {result.riskScore > 70
                ? "🚫 HIGH RISK: This website appears to be a phishing site! Do not proceed."
                : result.riskScore > 30
                  ? "⚠️ MEDIUM RISK: This website shows suspicious characteristics. Exercise caution."
                  : "✅ LOW RISK: This website appears to be safe."}
            </p>
          </div>

          {/* ============================================================ */}
          {/* TWO COLUMN ANALYSIS - Professional Cards */}
          {/* ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {/* Classification Card */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  🏷️
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    Classification
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      margin: 0,
                    }}
                  >
                    AI-Powered Prediction
                  </p>
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    color: "#1e293b",
                    lineHeight: "1.6",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {result.classification}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    background: `${riskLevel.color}15`,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: riskLevel.color,
                  }}
                >
                  <FaCheckCircle size={14} />
                  Confidence: {((result.confidence || 0.5) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Explanation Card */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  📋
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    Why It Was Flagged
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      margin: 0,
                    }}
                  >
                    Key Indicators
                  </p>
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    lineHeight: "1.7",
                    margin: 0,
                  }}
                >
                  {result.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* TECHNICAL ANALYSIS - Professional Grid */}
          {/* ============================================================ */}
          {result.features && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                marginBottom: "32px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #06b6d420 0%, #3b82f620 100%)",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  🔍
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    Technical Analysis
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      margin: 0,
                    }}
                  >
                    Detailed URL Features
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* URL Length */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "#e0f2fe",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0ea5e9",
                      fontSize: "16px",
                    }}
                  >
                    <FaLink />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      URL Length
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      {result.features.urlLength || "N/A"}
                    </div>
                  </div>
                </div>

                {/* HTTPS Usage */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    background: result.features.hasHTTPS ? "#ecfdf5" : "#fef2f2",
                    borderRadius: "12px",
                    border: `1px solid ${result.features.hasHTTPS ? "#6ee7b7" : "#fca5a5"}`,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: result.features.hasHTTPS ? "#d1fae5" : "#fee2e2",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: result.features.hasHTTPS ? "#10b981" : "#ef4444",
                      fontSize: "16px",
                    }}
                  >
                    {result.features.hasHTTPS ? <FaLock /> : <FaUnlock />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      HTTPS Usage
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: result.features.hasHTTPS ? "#10b981" : "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {result.features.hasHTTPS ? (
                        <>
                          <FaCheck size={14} /> Secure
                        </>
                      ) : (
                        <>
                          <FaTimes size={14} /> Not Secure
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special Characters */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "#fef3c7",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f59e0b",
                      fontSize: "16px",
                    }}
                  >
                    <FaCode />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Special Characters
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      {result.features.specialChars || 0}
                    </div>
                  </div>
                </div>

                {/* IP Address */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    background: result.features.hasIP ? "#fef2f2" : "#ecfdf5",
                    borderRadius: "12px",
                    border: `1px solid ${result.features.hasIP ? "#fca5a5" : "#6ee7b7"}`,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: result.features.hasIP ? "#fee2e2" : "#d1fae5",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: result.features.hasIP ? "#ef4444" : "#10b981",
                      fontSize: "16px",
                    }}
                  >
                    <FaServer />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      IP Address
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: result.features.hasIP ? "#ef4444" : "#10b981",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {result.features.hasIP ? (
                        <>
                          <FaExclamationTriangle size={14} /> Detected
                        </>
                      ) : (
                        <>
                          <FaCheck size={14} /> Not Detected
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suspicious Keywords */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    background: result.features.hasSuspiciousKeywords ? "#fef2f2" : "#ecfdf5",
                    borderRadius: "12px",
                    border: `1px solid ${result.features.hasSuspiciousKeywords ? "#fca5a5" : "#6ee7b7"}`,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: result.features.hasSuspiciousKeywords ? "#fee2e2" : "#d1fae5",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: result.features.hasSuspiciousKeywords ? "#ef4444" : "#10b981",
                      fontSize: "16px",
                    }}
                  >
                    <FaUserSecret />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Suspicious Keywords
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: result.features.hasSuspiciousKeywords ? "#ef4444" : "#10b981",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {result.features.hasSuspiciousKeywords ? (
                        <>
                          <FaExclamationTriangle size={14} /> Found
                        </>
                      ) : (
                        <>
                          <FaCheck size={14} /> Not Found
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* RECOMMENDATION */}
          {/* ============================================================ */}
          <div
            style={{
              background: `linear-gradient(135deg, ${riskLevel.bg} 0%, white 100%)`,
              borderRadius: "20px",
              padding: "28px",
              marginBottom: "32px",
              border: `2px solid ${riskLevel.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: riskLevel.bg,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                🛡️
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: riskLevel.color,
                    margin: 0,
                  }}
                >
                  Security Recommendation
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    margin: 0,
                  }}
                >
                  What you should do next
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: "15px",
                color: "#475569",
                lineHeight: "1.7",
                margin: 0,
                paddingLeft: "8px",
              }}
            >
              {result.riskScore > 70
                ? "🚫 DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials."
                : result.riskScore > 30
                  ? "⚠️ Exercise extreme caution. Verify the website's authenticity through official channels before entering any personal information or credentials."
                  : "✅ You can safely proceed. However, always verify the URL matches the official website before entering sensitive information."}
            </p>
          </div>

          {/* Feedback Section */}
          {showFeedback && !feedbackSubmitted && (
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "32px",
                marginBottom: "24px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    background:
                      "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                    padding: "8px 20px",
                    borderRadius: "100px",
                    marginBottom: "16px",
                  }}
                >
                  <FaThumbsUp style={{ color: "#667eea" }} />
                  <span style={{ fontWeight: "600", color: "#667eea" }}>
                    Help Us Improve
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  Was this detection accurate?
                </h3>
                <p style={{ color: "#64748b", marginTop: "8px" }}>
                  Your feedback helps us train better AI models
                </p>
              </div>

              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Scan ID
                  </label>
                  <input
                    type="text"
                    value={feedback.scanId}
                    disabled
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      fontSize: "14px",
                      color: "#64748b",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginTop: "8px",
                    }}
                  >
                    This Scan ID is automatically taken from your scan
                  </p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "12px",
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Was the detection accurate?
                  </label>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setFeedback({ ...feedback, isAccurate: true })
                      }
                      style={{
                        flex: 1,
                        padding: "14px",
                        background:
                          feedback.isAccurate === true ? "#10b981" : "#f8fafc",
                        color:
                          feedback.isAccurate === true ? "white" : "#64748b",
                        border: "none",
                        borderRadius: "14px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <FaThumbsUp />
                      Yes, accurate
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFeedback({ ...feedback, isAccurate: false })
                      }
                      style={{
                        flex: 1,
                        padding: "14px",
                        background:
                          feedback.isAccurate === false ? "#ef4444" : "#f8fafc",
                        color:
                          feedback.isAccurate === false ? "white" : "#64748b",
                        border: "none",
                        borderRadius: "14px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <FaThumbsDown />
                      No, inaccurate
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "12px",
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Rate Detection Quality *
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {renderStars()}
                    {feedback.rating > 0 && (
                      <span
                        style={{
                          marginLeft: "16px",
                          padding: "6px 12px",
                          background: "#f1f5f9",
                          borderRadius: "20px",
                          fontSize: "14px",
                          color: "#64748b",
                        }}
                      >
                        {feedback.rating === 5
                          ? "🌟 Excellent!"
                          : feedback.rating === 4
                            ? "😊 Good"
                            : feedback.rating === 3
                              ? "😐 Average"
                              : feedback.rating === 2
                                ? "😕 Poor"
                                : "😞 Very Poor"}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Additional Comments
                  </label>
                  <textarea
                    rows="4"
                    value={feedback.comments}
                    onChange={(e) =>
                      setFeedback({ ...feedback, comments: e.target.value })
                    }
                    placeholder="Tell us more about your experience... What could we improve?"
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "16px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      resize: "vertical",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      marginTop: "8px",
                      textAlign: "right",
                    }}
                  >
                    {feedback.comments.length}/500 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    background: submitting
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    padding: "16px",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinning" />
                      <span> Submitting Feedback...</span>
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Thank You Message */}
          {feedbackSubmitted && (
            <div
              style={{
                marginBottom: "24px",
                padding: "32px",
                background:
                  "linear-gradient(135deg, #10b98115 0%, #05966915 100%)",
                borderRadius: "24px",
                textAlign: "center",
                border: "1px solid #10b98130",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background:
                    "linear-gradient(135deg, #10b98120 0%, #05966920 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <FaCheckCircle style={{ fontSize: "48px", color: "#10b981" }} />
              </div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: "12px",
                }}
              >
                Thank You for Your Feedback!
              </h3>
              <p style={{ color: "#64748b" }}>
                Your feedback helps us improve our AI models and make the
                internet safer for everyone.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default URLScanner;