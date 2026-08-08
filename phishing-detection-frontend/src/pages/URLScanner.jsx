// pages/URLScanner.jsx
import React, { useState } from "react";
import { scanURL, submitFeedbackMessage, submitAccuracy, getScanByReference } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useGuest } from "../context/GuestContext";
import AuthModal from "../components/common/AuthModal";
import {
  FaShieldAlt,
  FaDownload,
  FaInfoCircle,
  FaLink,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCopy,
  FaThumbsUp,
  FaThumbsDown,
  FaSpinner,
  FaUserPlus,
  FaExclamationCircle,
  FaWifi,
  FaFilePdf,
} from "react-icons/fa";
import toast from "react-hot-toast";

const URLScanner = () => {
  const [url, setUrl] = useState("");
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
  const [scanId, setScanId] = useState("");
  const [feedback, setFeedback] = useState({
    type: "url",
    isAccurate: null,
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackReply, setFeedbackReply] = useState("");
  const [accuracySubmitted, setAccuracySubmitted] = useState(false);
  const [accuracyError, setAccuracyError] = useState(null);

  const getRiskScoreFromPrediction = (prediction) => {
    if (!prediction) return 50;
    const upper = prediction.toUpperCase().trim();
    switch (upper) {
      case "PHISHING":
      case "DANGEROUS":
      case "MALICIOUS":
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

  const processScanResponse = (response, scannedUrl) => {
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
      url: response.url || scannedUrl,
      prediction: prediction,
      classification: prediction || "UNKNOWN",
      riskScore: riskScore,
      explanation: response.conclusion || "Analysis completed",
      result: resultType,
      scannedAt: response.scannedAt || new Date().toISOString(),
      type: "url", // ✅ Explicitly set type for consistency
      content: scannedUrl,
      _raw: response,
    };
  };

  const handleScan = async (e) => {
    e.preventDefault();

    if (!url || url.trim() === "") {
      toast.error("Please enter a URL to scan");
      return;
    }

    setLoading(true);
    setError(null);
    setConnectionError(false);
    setShowFeedback(false);
    setFeedbackSubmitted(false);
    setFeedbackReply("");
    setAccuracySubmitted(false);
    setAccuracyError(null);
    setScanId("");
    setFeedback({
      type: "url",
      isAccurate: null,
      comments: "",
    });

    try {
      const response = await scanURL(url);
      console.log("API Response:", response);

      const scanResult = processScanResponse(response, url);
      console.log("Processed Result:", scanResult);
      setResult(scanResult);

      if (!isAuthenticated) {
        addScan({
          ...scanResult,
          type: "url",
          content: url,
        });
      }

      const reference = response.reference || "";
      setScanId(reference);
      
      setShowFeedback(true);
      setFeedback({
        type: "url",
        isAccurate: null,
        comments: "",
      });
      
      toast.success("Scan completed successfully!");
    } catch (err) {
      console.error("Scan Error:", err);
      
      if (err.isCorsError || err.message?.includes("CORS") || err.message?.includes("Network")) {
        setConnectionError(true);
        setError("Cannot connect to the server. Please check your connection.");
        toast.error("Connection Error");
      } else {
        const errorMsg = err.message || "Failed to scan URL";
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
        url: scanDetails.url || result.url,
        prediction: scanDetails.overallPrediction || scanDetails.prediction,
        riskScore: result.riskScore || getRiskScoreFromPrediction(scanDetails.overallPrediction || scanDetails.prediction),
        conclusion: scanDetails.conclusion || "Analysis completed",
        scannedAt: scanDetails.scannedAt,
        phishingReasons: scanDetails.phishingReasons || [],
        legitimateReasons: scanDetails.legitimateReasons || [],
        overallPrediction: scanDetails.overallPrediction || scanDetails.prediction,
        scanType: scanDetails.scanType || "URL",
      };
      
      const { downloadPDF } = await import('../services/pdfGenerator');
      downloadPDF(pdfData, 'url');
      
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Download Error:", error);
      toast.error(error.message || "Failed to download report");
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

  const handleAccuracySelect = async (isAccurate) => {
    console.log("Scan ID:", scanId);
    
    if (!scanId || scanId.trim() === "") {
      toast.error("Scan ID not found. Please try scanning again.");
      console.error("Scan ID is null or empty:", scanId);
      return;
    }

    if (feedback.isAccurate === isAccurate) {
      setFeedback({ ...feedback, isAccurate: null });
      setAccuracySubmitted(false);
      setAccuracyError(null);
      return;
    }

    setFeedback({ ...feedback, isAccurate });
    setAccuracyError(null);
    
    try {
      console.log("Submitting accuracy with:", {
        reference: scanId,
        accurate: isAccurate
      });
      
      const response = await submitAccuracy({
        reference: scanId,
        accurate: isAccurate
      });
      
      console.log("Accuracy Response:", response);
      setAccuracySubmitted(true);
      
      if (response?.reply) {
        toast.success(response.reply);
      } else {
        toast.success("Thank you for your feedback!");
      }
    } catch (error) {
      console.error("Accuracy Submit Error:", error);
      setAccuracyError(error.message || "Failed to submit accuracy");
      toast.error(error.message || "Failed to submit accuracy");
      setFeedback({ ...feedback, isAccurate: null });
      setAccuracySubmitted(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.comments || feedback.comments.trim() === "") {
      toast.error("Please write your feedback");
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await submitFeedbackMessage(feedback.comments);
      console.log("Feedback Message Response:", response);
      
      if (response?.reply) {
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
      console.error("Feedback Submit Error:", error);
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score > 70)
      return {
        label: "High Risk",
        color: "#ef4444",
        bg: "#fee2e2",
        border: "#fca5a5",
        icon: "🚨",
        badge: "Phishing",
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
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "12px" }}>
              Supports HTTP, HTTPS, and all standard URL formats
            </p>
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                position: "relative",
                zIndex: 1,
                marginTop: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", width: "100%" }}>
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

            <div style={{ marginTop: "20px", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              />
            </div>
          </div>

          {/* Phishing Reasons */}
          {result._raw?.phishingReasons && result._raw.phishingReasons.length > 0 && (
            <div
              style={{
                background: "#fee2e2",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: "1px solid #fca5a5",
              }}
            >
              <h4 style={{ color: "#dc2626", marginBottom: "12px", fontSize: "16px", fontWeight: "700" }}>
                🚨 Phishing Indicators
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569" }}>
                {result._raw.phishingReasons.map((reason, index) => (
                  <li key={index} style={{ marginBottom: "6px" }}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

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

              <div style={{ marginBottom: "12px", fontSize: "12px", color: "#94a3b8" }}>
                Scan ID: {scanId || "Not set"}
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
                    onClick={() => handleAccuracySelect(true)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background:
                        feedback.isAccurate === true ? "#10b981" : "#f8fafc",
                      color:
                        feedback.isAccurate === true ? "white" : "#64748b",
                      border: feedback.isAccurate === true ? "2px solid #10b981" : "2px solid #e2e8f0",
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
                    {feedback.isAccurate === true && (
                      <span style={{ marginLeft: "8px", fontSize: "12px" }}>✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccuracySelect(false)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background:
                        feedback.isAccurate === false ? "#ef4444" : "#f8fafc",
                      color:
                        feedback.isAccurate === false ? "white" : "#64748b",
                      border: feedback.isAccurate === false ? "2px solid #ef4444" : "2px solid #e2e8f0",
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
                    {feedback.isAccurate === false && (
                      <span style={{ marginLeft: "8px", fontSize: "12px" }}>✓</span>
                    )}
                  </button>
                </div>
                {accuracyError && (
                  <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px", textAlign: "center" }}>
                    ❌ {accuracyError}
                  </p>
                )}
                {accuracySubmitted && feedback.isAccurate !== null && (
                  <p style={{ fontSize: "12px", color: "#10b981", marginTop: "8px", textAlign: "center" }}>
                    ✓ Accuracy feedback submitted successfully
                  </p>
                )}
              </div>

              <form onSubmit={handleFeedbackSubmit}>
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
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
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

export default URLScanner;