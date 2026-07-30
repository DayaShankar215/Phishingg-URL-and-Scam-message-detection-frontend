// pages/MessageScanner.jsx
import React, { useState } from "react";
import { scanMessage, submitFeedback, getScanByReference } from "../services/api";
// import { validateMessage } from "../utils/validators";
import { useAuth } from "../context/AuthContext";
import { useGuest } from "../context/GuestContext";
import AuthModal from "../components/common/AuthModal";
import {
  FaShieldAlt,
  FaDownload,
  FaInfoCircle,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCopy,
  FaStar,
  FaRegStar,
  FaThumbsUp,
  FaThumbsDown,
  FaSpinner,
  FaUserPlus,
  FaExclamationCircle,
  FaWifi,
  FaFilePdf,
  FaWhatsapp,
} from "react-icons/fa";
import toast from "react-hot-toast";

const MessageScanner = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const { isAuthenticated } = useAuth();
  const { addScan } = useGuest();

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    scanId: "",
    type: "message",
    isAccurate: true,
    rating: 0,
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackReply, setFeedbackReply] = useState("");

  const getRiskScoreFromPrediction = (prediction) => {
    if (!prediction) return 50;
    const upper = prediction.toUpperCase().trim();
    switch (upper) {
      case "PHISHING":
      case "DANGEROUS":
      case "MALICIOUS":
      case "SCAM":
        return 85;
      case "SUSPICIOUS":
      case "WARNING":
        return 55;
      case "SAFE":
      case "LEGITIMATE":
        return 15;
      default:
        return 50;
    }
  };

  const processScanResponse = (response, scannedMessage) => {
    const rawPrediction = response.overallPrediction || response.prediction || "UNKNOWN";
    const prediction = rawPrediction;
    
    let riskScore = 50;
    let resultType = "unknown";

    const upperPrediction = prediction.toUpperCase().trim();
    
    switch (upperPrediction) {
      case "PHISHING":
      case "DANGEROUS":
      case "MALICIOUS":
        riskScore = 85;
        resultType = "phishing";
        break;
      case "SCAM":
        riskScore = 85;
        resultType = "scam";
        break;
      case "SUSPICIOUS":
      case "WARNING":
        riskScore = 55;
        resultType = "suspicious";
        break;
      case "SAFE":
      case "LEGITIMATE":
        riskScore = 15;
        resultType = "safe";
        break;
      default:
        riskScore = 50;
        resultType = "unknown";
    }

    return {
      reference: response.reference,
      message: response.message || scannedMessage,
      prediction: prediction,
      classification: prediction || "UNKNOWN",
      riskScore: riskScore,
      explanation: response.conclusion || "Analysis completed",
      result: resultType,
      scannedAt: response.scannedAt || new Date().toISOString(),
    };
  };

  const handleScan = async (e) => {
    e.preventDefault();

    // const validation = validateMessage(message);
    // if (!validation.isValid) {
    //   toast.error(validation.error);
    //   setError(validation.error);
    //   return;
    // }

    setLoading(true);
    setError(null);
    setConnectionError(false);
    setShowFeedback(false);
    setFeedbackSubmitted(false);
    setFeedbackReply("");

    try {
      const response = await scanMessage(message);
      console.log("API Response:", response);

      const scanResult = processScanResponse(response, message);
      console.log("Processed Result:", scanResult);
      setResult(scanResult);

      if (!isAuthenticated) {
        addScan({
          ...scanResult,
          type: "message",
          content: message,
        });
      }

      setShowFeedback(true);
      setFeedback((prev) => ({ ...prev, scanId: response.reference, comments: "" }));
      toast.success("Message analysis completed!");
    } catch (err) {
      console.error("Scan Error:", err);
      
      if (err.isCorsError || err.message?.includes("CORS") || err.message?.includes("Network")) {
        setConnectionError(true);
        setError("Cannot connect to the server. Please check your connection.");
        toast.error("Connection Error");
      } else {
        const errorMsg = err.message || "Failed to scan message";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result || downloading) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const reference = result.reference;
    if (!reference) {
      toast.error("Scan reference not found");
      return;
    }

    setDownloading(true);
    try {
      const scanDetails = await getScanByReference(reference);
      console.log("Scan Details for PDF:", scanDetails);
      
      const pdfData = {
        reference: scanDetails.reference,
        message: scanDetails.message || result.message,
        prediction: scanDetails.overallPrediction || scanDetails.prediction,
        riskScore: result.riskScore || getRiskScoreFromPrediction(scanDetails.overallPrediction || scanDetails.prediction),
        conclusion: scanDetails.conclusion,
        scannedAt: scanDetails.scannedAt,
        phishingReasons: scanDetails.phishingReasons || [],
        legitimateReasons: scanDetails.legitimateReasons || [],
      };
      
      const { downloadPDF } = await import('../services/pdfGenerator');
      downloadPDF(pdfData, 'message');
      
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Download Error:", error);
      toast.error(error.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.comments || feedback.comments.trim() === "") {
      toast.error("Please provide your feedback");
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitFeedback(feedback.comments);
      console.log("Feedback Response:", response);
      
      if (response && response.reply) {
        setFeedbackReply(response.reply);
      }
      
      setFeedbackSubmitted(true);
      toast.success("Thank you for your feedback! 🎉");
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackReply("");
      }, 5000);
    } catch (error) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Commented out - will be used in future
  // const renderStars = () => {
  //   return [1, 2, 3, 4, 5].map((star) => (
  //     <button
  //       key={star}
  //       type="button"
  //       onClick={() => setFeedback({ ...feedback, rating: star })}
  //       style={{
  //         background: "none",
  //         border: "none",
  //         cursor: "pointer",
  //         fontSize: "30px",
  //         transition: "transform 0.2s",
  //         padding: "0 4px",
  //       }}
  //       onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
  //       onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  //     >
  //       {star <= feedback.rating ? (
  //         <FaStar style={{ color: "#ffc107" }} />
  //       ) : (
  //         <FaRegStar style={{ color: "#ddd" }} />
  //       )}
  //     </button>
  //   ));
  // };

  const getRiskLevel = (score) => {
    if (score > 70)
      return {
        label: "High Risk",
        color: "#ef4444",
        bg: "#fee2e2",
        border: "#fca5a5",
        icon: "🚨",
        badge: "Scam",
      };
    if (score > 30)
      return {
        label: "Medium Risk",
        color: "#f59e0b",
        bg: "#fef3c7",
        border: "#fcd34d",
        icon: "⚠️",
        badge: "Suspicious",
      };
    return {
      label: "Low Risk",
      color: "#10b981",
      bg: "#d1fae5",
      border: "#6ee7b7",
      icon: "✅",
      badge: "Safe",
    };
  };

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
            background: "linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)",
            padding: "8px 20px",
            borderRadius: "100px",
            marginBottom: "20px",
          }}
        >
          <FaWhatsapp style={{ color: "#f5576c" }} />
          <span style={{ fontWeight: "600", color: "#f5576c" }}>
            SMS & Message Security
          </span>
        </div>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "16px",
          }}
        >
          Scam Message Detector
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#64748b",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          AI-powered scam detection for SMS, WhatsApp, and instant messages
        </p>
        {!isAuthenticated && (
          <p
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginTop: "8px",
              background: "#f1f5f9",
              padding: "6px 16px",
              borderRadius: "100px",
              display: "inline-block",
            }}
          >
            👋 Guest mode • Sign up to save your scan history
          </p>
        )}
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
              Paste Suspicious Message
            </label>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <FaEnvelope
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "20px",
                    color: "#94a3b8",
                  }}
                />
                <textarea
                  rows="6"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Paste the suspicious message here...&#10;&#10;Example:&#10;'Congratulations! You've won $1000! Click here to claim your prize: http://bit.ly/fake-link'"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "16px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    transition: "all 0.3s ease",
                    outline: "none",
                    lineHeight: "1.6",
                    minHeight: "160px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f5576c")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  disabled={loading}
                />
                {message && (
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    style={{
                      position: "absolute",
                      bottom: "16px",
                      right: "16px",
                      background: "#f8fafc",
                      border: "none",
                      padding: "8px",
                      borderRadius: "8px",
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
                    : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
                  whiteSpace: "nowrap",
                  height: "56px",
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "12px",
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              <span>Characters: {message.length}</span>
              <span>Minimum 10 characters recommended</span>
            </div>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {connectionError && (
        <div
          style={{
            background: "#fef2f2",
            border: "2px solid #fca5a5",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <FaExclamationCircle style={{ color: "#dc2626", fontSize: "32px", flexShrink: 0, marginTop: "4px" }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ color: "#dc2626", margin: "0 0 8px", fontSize: "18px" }}>
                ⚠️ Connection Error
              </h3>
              <p style={{ color: "#475569", margin: "0 0 12px", lineHeight: "1.6" }}>
                {error || "Cannot connect to the server. Please check your connection."}
              </p>
              <button
                onClick={() => {
                  setConnectionError(false);
                  setError(null);
                }}
                style={{
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaWifi />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !connectionError && (
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
          <FaExclamationTriangle style={{ color: "#ef4444", fontSize: "20px" }} />
          <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div style={{ animation: "slideUp 0.5s ease-out" }}>
          {/* Risk Score Card */}
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
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
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
                    fontSize: "18px",
                    fontWeight: "700",
                    color: riskLevel.color,
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  {result.prediction || result.classification}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {result.reference && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      background: "#f1f5f9",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#64748b",
                    }}
                  >
                    <FaInfoCircle size={14} />
                    Ref: {result.reference}
                  </div>
                )}
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
                    Analysis Details
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      margin: 0,
                    }}
                  >
                   Key Scam Indicators
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

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleDownloadReport}
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
                  ) : !isAuthenticated ? (
                    <>
                      <FaUserPlus />
                      <span>Sign in to Download</span>
                    </>
                  ) : (
                    <>
                      <FaFilePdf />
                      <span>Download Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {/* <div style={{ marginTop: "20px", position: "relative", zIndex: 1 }}>
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
            </div> */}

            {/* <p
              style={{
                marginTop: "16px",
                fontSize: "15px",
                color: riskLevel.color,
                fontWeight: "500",
                position: "relative",
                zIndex: 1,
              }}
            > */}
              {/* {result.riskScore > 70
                ? "🚨 HIGH RISK: This is likely a scam! Do not respond or click any links."
                : result.riskScore > 30
                ? "⚠️ MEDIUM RISK: This message shows scam indicators. Exercise caution."
                : "✅ LOW RISK: This message appears legitimate."} */}
            {/* </p> */}
          </div>

          {/* Recommendation */}
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
                ? "🚫 DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier."
                : result.riskScore > 30
                ? "⚠️ Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels."
                : "✓ This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers."}
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
                      "linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)",
                    padding: "8px 20px",
                    borderRadius: "100px",
                    marginBottom: "16px",
                  }}
                >
                  <FaThumbsUp style={{ color: "#f5576c" }} />
                  <span style={{ fontWeight: "600", color: "#f5576c" }}>
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
                </div>

                {/* Commented out - Will be used in future */}
                {/* <div style={{ marginBottom: "24px" }}>
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
                </div> */}

                {/* Commented out - Will be used in future */}
                {/* <div style={{ marginBottom: "24px" }}>
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
                </div> */}

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
                    Your Feedback *
                  </label>
                  <textarea
                    rows="4"
                    value={feedback.comments}
                    onChange={(e) =>
                      setFeedback({ ...feedback, comments: e.target.value })
                    }
                    placeholder="Tell us about your experience... What could we improve?"
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
                    onFocus={(e) => (e.target.style.borderColor = "#f5576c")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    required
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
                      : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
              {feedbackReply && (
                <div
                  style={{
                    padding: "16px",
                    background: "#f1f5f9",
                    borderRadius: "12px",
                    marginTop: "12px",
                    maxWidth: "480px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#475569",
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    💬 "{feedbackReply}"
                  </p>
                </div>
              )}
              <p style={{ color: "#64748b", marginTop: "12px" }}>
                Your feedback helps us improve our AI models and make the
                internet safer for everyone.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
        onSuccess={() => {
          setShowAuthModal(false);
          toast.success("Welcome! You can now download reports.");
        }}
      />

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

export default MessageScanner;