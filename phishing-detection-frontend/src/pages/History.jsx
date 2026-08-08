// pages/History.jsx
import React, { useState, useEffect } from "react";
import {
  getScanHistory,
  getScanByReference,
  deleteScanByReference,
} from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate, truncateText } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useGuest } from "../context/GuestContext";
import AuthModal from "../components/common/AuthModal";
import {
  FaSearch,
  FaEye,
  FaChartLine,
  FaCalendar,
  FaShieldAlt,
  FaLink,
  FaEnvelope,
  FaTrashAlt,
  FaSpinner,
  FaCalendarAlt,
  FaTimes,
  FaHashtag,
  FaUserPlus,
  FaInfoCircle,
  FaFilePdf,
  FaComment,
  FaSortNumericDown,
} from "react-icons/fa";
import toast from "react-hot-toast";

const History = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    url: 0,
    message: 0,
  });

  const { isAuthenticated } = useAuth();
  const { scans: guestScans } = useGuest();

  const [dateFilter, setDateFilter] = useState({
    preset: "all",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  const getPrediction = (scan) => {
    return scan.overallPrediction || scan.prediction || "UNKNOWN";
  };

  const getScanType = (scan) => {
    if (scan.type) return scan.type;
    if (scan.scanType) {
      const type = scan.scanType.toLowerCase();
      if (type === "url" || type === "message") return type;
    }
    if (scan.message) return "message";
    if (scan.url) return "url";
    if (scan.content) {
      const content = scan.content || "";
      if (content.match(/^https?:\/\/[^\s]+/)) return "url";
      return "message";
    }
    return "url";
  };

  useEffect(() => {
    fetchHistory();
  }, [filter, isAuthenticated]);

  useEffect(() => {
    calculateStats();
  }, [scans]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await getScanHistory();
        console.log("Scan History Response:", response);

        let scansData = [];
        if (response && response.scans && Array.isArray(response.scans)) {
          scansData = response.scans;
        } else if (Array.isArray(response)) {
          scansData = response;
        }

        const formattedScans = scansData.map((scan) => {
          const type = getScanType(scan);
          return {
            reference: scan.reference,
            url: scan.url || scan.content,
            prediction: getPrediction(scan),
            conclusion: scan.conclusion,
            scannedAt: scan.scannedAt,
            type: type,
            content: scan.url || scan.message || scan.content || scan.url,
            scanType: scan.scanType,
            message: scan.message,
            messagePrediction: scan.messagePrediction,
            messagePhishingReasons: scan.messagePhishingReasons || [],
            messageLegitimateReasons: scan.messageLegitimateReasons || [],
            urlsFound: scan.urlsFound || [],
            urlResults: scan.urlResults || [],
            phishingReasons: scan.phishingReasons || [],
            legitimateReasons: scan.legitimateReasons || [],
            _raw: scan,
          };
        });
        //Sorting based on new scan
        formattedScans.sort((a, b) => {
          const dateA = new Date(a.scannedAt || a.date || a.timestamp || 0);
          const dateB = new Date(b.scannedAt || b.date || b.timestamp || 0);
          return dateB - dateA; // Descending: newest first
        });
        setScans(formattedScans);
      } else {
        const guestFiltered =
          filter === "all"
            ? guestScans
            : guestScans.filter((s) => s.type === filter);
        setScans(guestFiltered);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      if (isAuthenticated) {
        toast.error("Failed to load scan history");
      }
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = scans.length;
    const url = scans.filter((s) => s?.type === "url").length;
    const message = scans.filter((s) => s?.type === "message").length;
    setStats({ total, url, message });
  };

  const getDateFilteredScans = (scansList) => {
    if (!scansList || !Array.isArray(scansList)) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return scansList.filter((scan) => {
      const scanDate = new Date(
        scan?.scannedAt ||
          scan?.date ||
          scan?.timestamp ||
          scan?.createdAt ||
          Date.now(),
      );

      switch (dateFilter.preset) {
        case "today":
          return scanDate >= today;
        case "yesterday":
          return scanDate >= yesterday && scanDate < today;
        case "week":
          return scanDate >= weekAgo;
        case "month":
          return scanDate >= monthAgo;
        case "custom":
          if (tempStartDate && tempEndDate) {
            const start = new Date(tempStartDate);
            const end = new Date(tempEndDate);
            end.setHours(23, 59, 59, 999);
            return scanDate >= start && scanDate <= end;
          }
          return true;
        case "all":
        default:
          return true;
      }
    });
  };

  const handleDatePresetChange = (preset) => {
    setDateFilter({ preset });
    setShowDatePicker(false);
    if (preset !== "custom") {
      setTempStartDate("");
      setTempEndDate("");
    }
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      setDateFilter({ preset: "custom" });
      setShowDatePicker(false);
      toast.success(`Date filter applied`);
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  const clearDateFilter = () => {
    setDateFilter({ preset: "all" });
    setTempStartDate("");
    setTempEndDate("");
    setShowDatePicker(false);
  };

  const getDateFilterLabel = (preset = null) => {
    const currentPreset = preset || dateFilter.preset;
    switch (currentPreset) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 30 Days";
      case "custom":
        return "Custom Range";
      default:
        return "All Time";
    }
  };

  const handleViewDetails = async (reference) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await getScanByReference(reference);
      console.log("Scan Details Response:", response);

      const isMessageScan = response.scanType === "MESSAGE" || response.message;

      setSelectedScan({
        reference: response.reference,
        url: response.url || response.message || "",
        prediction: getPrediction(response),
        legitimateReasons:
          response.legitimateReasons || response.messageLegitimateReasons || [],
        phishingReasons:
          response.phishingReasons || response.messagePhishingReasons || [],
        conclusion: response.conclusion,
        scannedAt: response.scannedAt,
        isMessageScan: isMessageScan,
        message: response.message,
        scanType: response.scanType,
        messagePrediction: response.messagePrediction,
        messagePhishingReasons: response.messagePhishingReasons || [],
        messageLegitimateReasons: response.messageLegitimateReasons || [],
        urlsFound: response.urlsFound || [],
        urlResults: response.urlResults || [],
        overallPrediction: response.overallPrediction,
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching scan details:", error);
      toast.error("Failed to load scan details");
    }
  };

  const handleDownloadReport = async (reference) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (downloadingId === reference) return;

    setDownloadingId(reference);
    const toastId = toast.loading("Generating PDF report...");

    try {
      const scanDetails = await getScanByReference(reference);
      console.log("Scan Details for PDF:", scanDetails);

      const isMessageScan =
        scanDetails.scanType === "MESSAGE" || scanDetails.message;

      const pdfData = {
        reference: scanDetails.reference,
        url: isMessageScan ? "" : scanDetails.url || "",
        message: scanDetails.message || "",
        prediction: getPrediction(scanDetails),
        conclusion: scanDetails.conclusion || "Analysis completed",
        scannedAt: scanDetails.scannedAt,
        scanType: scanDetails.scanType || (isMessageScan ? "MESSAGE" : "URL"),
        messagePrediction: scanDetails.messagePrediction,
        messagePhishingReasons: scanDetails.messagePhishingReasons || [],
        messageLegitimateReasons: scanDetails.messageLegitimateReasons || [],
        urlsFound: scanDetails.urlsFound || [],
        urlResults: scanDetails.urlResults || [],
        phishingReasons: scanDetails.phishingReasons || [],
        legitimateReasons: scanDetails.legitimateReasons || [],
        overallPrediction: scanDetails.overallPrediction,
      };

      const { downloadPDF } = await import("../services/pdfGenerator");
      downloadPDF(pdfData, isMessageScan ? "message" : "url");

      toast.success("PDF report downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error(error.message || "Failed to download report", {
        id: toastId,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // ============================================================
  // ✅ DELETE - Simple delete by reference
  // ============================================================
  const handleDeleteScan = async (reference) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (deletingId === reference) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this scan? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(reference);
    const toastId = toast.loading("Deleting scan...");

    try {
      console.log(`[DELETE] Deleting scan: ${reference}`);

      const response = await deleteScanByReference(reference);
      console.log("[DELETE] Success:", response);

      toast.success("Scan deleted successfully!", { id: toastId });

      // Remove from UI
      setScans((prev) => prev.filter((scan) => scan.reference !== reference));
      calculateStats();
    } catch (error) {
      console.error("[DELETE] Error:", error);

      // Handle errors
      if (error.status === 403) {
        toast.error(`🔒 ${error.message || "Permission denied"}`, {
          id: toastId,
          duration: 5000,
        });
        return;
      }

      if (error.status === 404) {
        toast.success("Scan already deleted.", { id: toastId });
        setScans((prev) => prev.filter((scan) => scan.reference !== reference));
        calculateStats();
        return;
      }

      if (error.status === 401) {
        toast.error("Session expired. Please login again.", { id: toastId });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      if (error.isCorsError || error.status === 0) {
        toast.error("Cannot connect to server. Please check your connection.", {
          id: toastId,
        });
        return;
      }

      toast.error(error?.message || "Failed to delete scan", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const smartSearch = (scan, term) => {
    if (!term || term.trim() === "") return true;

    const searchLower = term.toLowerCase().trim();
    const reference = (scan?.reference || "").toString().toLowerCase();
    const content = (
      scan?.content ||
      scan?.url ||
      scan?.message ||
      ""
    ).toLowerCase();
    const type = (scan?.type || "").toLowerCase();

    return (
      reference.includes(searchLower) ||
      content.includes(searchLower) ||
      type.includes(searchLower)
    );
  };

  const filteredScans = (() => {
    if (!Array.isArray(scans)) return [];

    let filtered = getDateFilteredScans(scans);

    if (filter !== "all") {
      filtered = filtered.filter((s) => s.type === filter);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter((scan) => smartSearch(scan, searchTerm));
    }

    return filtered;
  })();

  const getPredictionColor = (pred) => {
    const upperPred = pred?.toUpperCase() || "";
    switch (upperPred) {
      case "PHISHING":
      case "DANGEROUS":
      case "MALICIOUS":
        return { bg: "#fee2e2", color: "#dc2626" };
      case "SCAM":
        return { bg: "#fef3c7", color: "#d97706" };
      case "SUSPICIOUS":
      case "WARNING":
        return { bg: "#fef3c7", color: "#d97706" };
      case "SAFE":
      case "LEGITIMATE":
        return { bg: "#d1fae5", color: "#065f46" };
      default:
        return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  const getTypeBadge = (type) => {
    if (type === "url") {
      return {
        bg: "#dbeafe",
        color: "#1d4ed8",
        icon: <FaLink size={12} />,
        label: "URL",
      };
    } else if (type === "message") {
      return {
        bg: "#fce7f3",
        color: "#be185d",
        icon: <FaComment size={12} />,
        label: "Message",
      };
    }
    return { bg: "#f1f5f9", color: "#64748b", icon: null, label: "Unknown" };
  };

  if (loading) {
    return <LoadingSpinner text="Loading security history..." />;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "800",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "12px",
            }}
          >
            Security History
          </h1>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            Track and analyze all your security scans
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <FaChartLine
              style={{
                fontSize: "32px",
                color: "#667eea",
                marginBottom: "12px",
              }}
            />
            <div
              style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}
            >
              {stats.total}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Total Scans
            </div>
          </div>
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <FaLink
              style={{
                fontSize: "32px",
                color: "#3b82f6",
                marginBottom: "12px",
              }}
            />
            <div
              style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}
            >
              {stats.url}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>URL Scans</div>
          </div>
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <FaEnvelope
              style={{
                fontSize: "32px",
                color: "#f5576c",
                marginBottom: "12px",
              }}
            />
            <div
              style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}
            >
              {stats.message}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Message Scans
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "32px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["all", "url", "message"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: "10px 24px",
                background: filter === type ? "#667eea" : "white",
                color: filter === type ? "white" : "#64748b",
                border: filter === type ? "none" : "1px solid #e2e8f0",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
            >
              {type === "all"
                ? "All Scans"
                : type === "url"
                  ? "URL Scans"
                  : "Message Scans"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          style={{
            padding: "10px 20px",
            background: dateFilter.preset !== "all" ? "#667eea" : "white",
            color: dateFilter.preset !== "all" ? "white" : "#64748b",
            border: "2px solid",
            borderColor: dateFilter.preset !== "all" ? "#667eea" : "#e2e8f0",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.3s ease",
          }}
        >
          <FaCalendarAlt />
          {dateFilter.preset === "all" ? "All Time" : getDateFilterLabel()}
          {dateFilter.preset !== "all" && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearDateFilter();
              }}
              style={{
                background: "rgba(255,255,255,0.3)",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "12px",
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              <FaTimes />
            </span>
          )}
        </button>

        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <FaSearch
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
            placeholder="Search by reference ID, content or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 48px",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          />
        </div>
      </div>

      {/* Date Picker Dropdown */}
      {showDatePicker && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b" }}
            >
              <FaCalendarAlt style={{ marginRight: "8px", color: "#667eea" }} />{" "}
              Filter by Date
            </h3>
            <button
              onClick={() => setShowDatePicker(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#94a3b8",
              }}
            >
              <FaTimes />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {[
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "week", label: "Last 7 Days" },
              { value: "month", label: "Last 30 Days" },
              { value: "custom", label: "Custom Range" },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleDatePresetChange(preset.value)}
                style={{
                  padding: "8px 16px",
                  background:
                    dateFilter.preset === preset.value ? "#667eea" : "#f1f5f9",
                  color:
                    dateFilter.preset === preset.value ? "white" : "#475569",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  fontSize: "13px",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {dateFilter.preset === "custom" && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "end",
                paddingTop: "16px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div style={{ flex: "1", minWidth: "150px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.3s",
                  }}
                />
              </div>
              <div style={{ flex: "1", minWidth: "150px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.3s",
                  }}
                />
              </div>
              <button
                onClick={handleCustomDateApply}
                style={{
                  padding: "10px 24px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                }}
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div
        style={{
          marginBottom: "16px",
          fontSize: "14px",
          color: "#64748b",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span>
          Showing {filteredScans.length} of {scans.length} scans
          {searchTerm && (
            <span
              style={{ marginLeft: "8px", fontWeight: "600", color: "#667eea" }}
            >
              (filtered by "{searchTerm}")
            </span>
          )}
        </span>
        {dateFilter.preset !== "all" && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <FaCalendarAlt size={12} /> {getDateFilterLabel()}
          </span>
        )}
      </div>

      {/* Scans Table */}
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                    width: "60px",
                  }}
                >
                  <FaSortNumericDown style={{ marginRight: "4px" }} />
                  S.No
                </th>
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Reference
                </th>
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Content
                </th>
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Prediction
                </th>
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "80px",
                      color: "#94a3b8",
                    }}
                  >
                    <FaShieldAlt
                      style={{
                        fontSize: "48px",
                        marginBottom: "16px",
                        opacity: 0.5,
                      }}
                    />
                    <p>No scans found.</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        style={{
                          marginTop: "12px",
                          padding: "8px 20px",
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Clear Search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan, index) => {
                  const reference = scan?.reference;
                  const isDownloading = downloadingId === reference;
                  const isDeleting = deletingId === reference;
                  const isGuest = scan?.isGuest === true;
                  const prediction = scan?.prediction || "UNKNOWN";
                  const predColor = getPredictionColor(prediction);
                  const typeBadge = getTypeBadge(scan?.type);

                  // ✅ Show delete button for ALL authenticated users
                  const showDelete = isAuthenticated && !isGuest;

                  return (
                    <tr
                      key={reference || `scan_${index}`}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.3s",
                        ...(isGuest ? { background: "#f8fafc" } : {}),
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isGuest
                          ? "#f8fafc"
                          : "white")
                      }
                    >
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#94a3b8",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          fontWeight: "600",
                          color: "#667eea",
                          fontSize: "13px",
                          fontFamily: "monospace",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaHashtag size={10} style={{ opacity: 0.5 }} />
                          {reference ? truncateText(reference, 20) : "N/A"}
                          {isGuest && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "9px",
                                background: "#94a3b8",
                                color: "white",
                                padding: "1px 8px",
                                borderRadius: "4px",
                                fontWeight: "500",
                              }}
                            >
                              Guest
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: typeBadge.bg,
                            color: typeBadge.color,
                          }}
                        >
                          {typeBadge.icon}
                          {typeBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", maxWidth: "300px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#475569",
                          }}
                          title={scan?.content || scan?.url || "N/A"}
                        >
                          {truncateText(
                            scan?.content || scan?.url || "N/A",
                            50,
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: predColor.bg,
                            color: predColor.color,
                          }}
                        >
                          {prediction}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FaCalendar size={12} />
                          {formatDate(
                            scan?.scannedAt ||
                              scan?.date ||
                              scan?.timestamp ||
                              Date.now(),
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleViewDetails(reference)}
                            disabled={!isAuthenticated}
                            style={{
                              background: "none",
                              border: "none",
                              color: isAuthenticated ? "#667eea" : "#94a3b8",
                              cursor: isAuthenticated
                                ? "pointer"
                                : "not-allowed",
                              padding: "6px",
                              borderRadius: "8px",
                              transition: "background 0.3s",
                            }}
                            title={
                              isAuthenticated
                                ? "View details"
                                : "Sign in to view details"
                            }
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDownloadReport(reference)}
                            disabled={isDownloading || !isAuthenticated}
                            style={{
                              background: "none",
                              border: "none",
                              color: isDownloading
                                ? "#94a3b8"
                                : isAuthenticated
                                  ? "#64748b"
                                  : "#94a3b8",
                              cursor:
                                isDownloading || !isAuthenticated
                                  ? "not-allowed"
                                  : "pointer",
                              padding: "6px",
                              borderRadius: "8px",
                              transition: "all 0.3s",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title={
                              isAuthenticated
                                ? "Download report"
                                : "Sign in to download report"
                            }
                          >
                            {isDownloading ? (
                              <FaSpinner className="spinning" size={14} />
                            ) : (
                              <FaFilePdf />
                            )}
                          </button>

                          {/* ✅ DELETE BUTTON - Show for all authenticated users */}
                          {showDelete && (
                            <button
                              onClick={() => handleDeleteScan(reference)}
                              disabled={isDeleting}
                              style={{
                                background: "none",
                                border: "none",
                                color: isDeleting ? "#94a3b8" : "#ef4444",
                                cursor: isDeleting ? "not-allowed" : "pointer",
                                padding: "6px",
                                borderRadius: "8px",
                                transition: "all 0.3s",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Delete scan"
                            >
                              {isDeleting ? (
                                <FaSpinner className="spinning" size={14} />
                              ) : (
                                <FaTrashAlt />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedScan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "32px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "white",
                padding: "24px 32px",
                borderBottom: "2px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1e293b",
                }}
              >
                Scan Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  width: "36px",
                  height: "36px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "20px",
                  transition: "all 0.3s",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "32px" }}>
              {/* Reference */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Reference
                </h3>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    color: "#1e293b",
                    fontFamily: "monospace",
                    fontSize: "14px",
                  }}
                >
                  {selectedScan.reference}
                </div>
              </div>

              {/* Type */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Scan Type
                </h3>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background:
                      selectedScan.scanType === "MESSAGE"
                        ? "#fce7f3"
                        : "#dbeafe",
                    color:
                      selectedScan.scanType === "MESSAGE"
                        ? "#be185d"
                        : "#1d4ed8",
                    fontWeight: "600",
                  }}
                >
                  {selectedScan.scanType ||
                    (selectedScan.isMessageScan ? "MESSAGE" : "URL")}
                </div>
              </div>

              {/* Content */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedScan.isMessageScan ? "Message" : "URL"}
                </h3>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    color: "#1e293b",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedScan.isMessageScan
                    ? selectedScan.message || selectedScan.url
                    : selectedScan.url}
                </div>
              </div>

              {/* Overall Prediction */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Overall Prediction
                </h3>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background:
                      selectedScan.prediction === "PHISHING"
                        ? "#fee2e2"
                        : "#d1fae5",
                    color:
                      selectedScan.prediction === "PHISHING"
                        ? "#dc2626"
                        : "#065f46",
                    fontWeight: "600",
                  }}
                >
                  {selectedScan.overallPrediction || selectedScan.prediction}
                </div>
              </div>

              {/* Message Prediction */}
              {selectedScan.isMessageScan && selectedScan.messagePrediction && (
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#64748b",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Message Prediction
                  </h3>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background:
                        selectedScan.messagePrediction === "PHISHING"
                          ? "#fee2e2"
                          : "#d1fae5",
                      color:
                        selectedScan.messagePrediction === "PHISHING"
                          ? "#dc2626"
                          : "#065f46",
                      fontWeight: "600",
                    }}
                  >
                    {selectedScan.messagePrediction}
                  </div>
                </div>
              )}

              {/* Phishing Reasons */}
              {selectedScan.phishingReasons &&
                selectedScan.phishingReasons.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#64748b",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                      }}
                    >
                      🚨 Phishing Indicators
                    </h3>
                    <div
                      style={{
                        padding: "16px",
                        background: "#fee2e2",
                        borderRadius: "12px",
                        color: "#dc2626",
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {selectedScan.phishingReasons.map((reason, i) => (
                          <li key={i} style={{ marginBottom: "4px" }}>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Message Phishing Reasons */}
              {selectedScan.isMessageScan &&
                selectedScan.messagePhishingReasons &&
                selectedScan.messagePhishingReasons.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#64748b",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                      }}
                    >
                      🚨 Message Phishing Indicators
                    </h3>
                    <div
                      style={{
                        padding: "16px",
                        background: "#fee2e2",
                        borderRadius: "12px",
                        color: "#dc2626",
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {selectedScan.messagePhishingReasons.map(
                          (reason, i) => (
                            <li key={i} style={{ marginBottom: "4px" }}>
                              {reason}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              {/* URLs Found */}
              {selectedScan.isMessageScan &&
                selectedScan.urlsFound &&
                selectedScan.urlsFound.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#64748b",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                      }}
                    >
                      🔗 URLs Found in Message
                    </h3>
                    <div
                      style={{
                        padding: "16px",
                        background: "#fef3c7",
                        borderRadius: "12px",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      {selectedScan.urlsFound.map((url, index) => {
                        const urlResult = selectedScan.urlResults?.[index];
                        return (
                          <div
                            key={index}
                            style={{
                              marginBottom: "8px",
                              padding: "8px 12px",
                              background: "white",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <p
                              style={{
                                fontWeight: "600",
                                color: "#1e293b",
                                wordBreak: "break-all",
                                margin: 0,
                              }}
                            >
                              {url}
                            </p>
                            {urlResult && (
                              <div style={{ marginTop: "4px" }}>
                                <span
                                  style={{
                                    padding: "2px 10px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    background:
                                      urlResult.prediction === "LEGITIMATE"
                                        ? "#d1fae5"
                                        : "#fee2e2",
                                    color:
                                      urlResult.prediction === "LEGITIMATE"
                                        ? "#065f46"
                                        : "#dc2626",
                                  }}
                                >
                                  {urlResult.prediction || "UNKNOWN"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Conclusion */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Conclusion
                </h3>
                <div
                  style={{
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    color: "#475569",
                    lineHeight: "1.7",
                  }}
                >
                  {selectedScan.conclusion}
                </div>
              </div>

              {/* Scanned At */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Scanned At
                </h3>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCalendar /> {formatDate(selectedScan.scannedAt)}
                </div>
              </div>

              {/* Download Button */}
              <div>
                <button
                  onClick={() => handleDownloadReport(selectedScan.reference)}
                  disabled={downloadingId === selectedScan.reference}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background:
                      downloadingId === selectedScan.reference
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      downloadingId === selectedScan.reference
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {downloadingId === selectedScan.reference ? (
                    <>
                      <FaSpinner className="spinning" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FaFilePdf />
                      <span>Download Full Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
        onSuccess={() => {
          setShowAuthModal(false);
          fetchHistory();
        }}
      />

      <style>{`
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

export default History;
