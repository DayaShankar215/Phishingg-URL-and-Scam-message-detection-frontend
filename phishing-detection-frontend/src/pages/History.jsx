// History.jsx - Complete Refined Version with Smart Search
import React, { useState, useEffect } from "react";
import {
  getScanHistory,
  getScanById,
  downloadPDFReport,
  clearScanHistory,
  deleteScanById,
} from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate, truncateText } from "../utils/formatters";
import {
  FaSearch,
  FaDownload,
  FaEye,
  FaChartLine,
  FaCalendar,
  FaShieldAlt,
  FaLink,
  FaEnvelope,
  FaTrash,
  FaTrashAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaTimes,
  FaHashtag,
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    url: 0,
    message: 0,
    avgRisk: 0,
  });

  // Date Filter State
  const [dateFilter, setDateFilter] = useState({
    preset: "all",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  useEffect(() => {
    calculateStats();
  }, [scans]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getScanHistory(filter === "all" ? null : filter);

      let scansData = [];
      if (response) {
        if (response.response && Array.isArray(response.response)) {
          scansData = response.response;
        } else if (Array.isArray(response)) {
          scansData = response;
        } else if (response.data && Array.isArray(response.data)) {
          scansData = response.data;
        } else if (response.scans && Array.isArray(response.scans)) {
          scansData = response.scans;
        }
      }

      setScans(scansData);
    } catch (error) {
      toast.error("Failed to load scan history");
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = scans.length;
    const url = scans.filter((s) => s?.type === "url").length;
    const message = scans.filter((s) => s?.type === "message").length;
    const avgRisk =
      total > 0 ? scans.reduce((sum, s) => sum + (s?.riskScore || 0), 0) / total : 0;
    setStats({ total, url, message, avgRisk });
  };

  // ============================================
  // DATE FILTER FUNCTIONS
  // ============================================
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
      const scanDate = new Date(scan?.date || scan?.timestamp || scan?.createdAt);

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
      toast.success(`Filter applied: ${getDateFilterLabel(preset)}`);
    }
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      setDateFilter({ preset: "custom" });
      setShowDatePicker(false);
      toast.success(
        `Date filter applied: ${formatDateForDisplay(tempStartDate)} - ${formatDateForDisplay(
          tempEndDate
        )}`
      );
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  const clearDateFilter = () => {
    setDateFilter({ preset: "all" });
    setTempStartDate("");
    setTempEndDate("");
    setShowDatePicker(false);
    toast.success("Date filter cleared");
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
        if (tempStartDate && tempEndDate) {
          return `${formatDateForDisplay(tempStartDate)} - ${formatDateForDisplay(tempEndDate)}`;
        }
        return "Custom Range";
      default:
        return "All Time";
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ============================================
  // SMART SEARCH - FIXED
  // ============================================
  const smartSearch = (scan, term) => {
    if (!term || term.trim() === "") return true;

    const searchLower = term.toLowerCase().trim();
    const scanId = (scan?.id || scan?._id || "").toString().toLowerCase();
    const content = (scan?.content || scan?.message || "").toLowerCase();

    // Check if search term is a number (likely an ID search)
    const isNumeric = /^\d+$/.test(searchLower);

    if (isNumeric) {
      // For numeric searches, FIRST check if ID matches
      if (scanId.includes(searchLower)) {
        return true;
      }
      
      // For content, only match if the number appears as a whole word
      // or in common patterns like #5, ID: 5, (5), etc.
      const contentWords = content.split(/[\s\-_.,;:!?(){}[\]<>/\\|]+/);
      if (contentWords.some(word => word === searchLower)) {
        return true;
      }
      
      // Check for patterns like #5 or id:5
      if (content.includes(`#${searchLower}`) || 
          content.includes(`id: ${searchLower}`) ||
          content.includes(`id:${searchLower}`)) {
        return true;
      }
      
      // If none of the above match, exclude this scan
      return false;
    }

    // For non-numeric searches, search in both ID and content
    return scanId.includes(searchLower) || content.includes(searchLower);
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================
  const handleViewDetails = async (id, type) => {
    try {
      const response = await getScanById(id, type);
      let scanData = response;
      if (
        response?.response &&
        Array.isArray(response.response) &&
        response.response.length > 0
      ) {
        scanData = response.response[0];
      } else if (response?.data) {
        scanData = response.data;
      }
      setSelectedScan(scanData);
      setShowModal(true);
    } catch (error) {
      toast.error("Failed to load scan details");
    }
  };

  const handleDownloadPDF = async (id, type) => {
    if (downloadingId === id) return;

    setDownloadingId(id);
    try {
      const response = await downloadPDFReport(id, type);

      if (!response || !response.data) {
        throw new Error("No data received from server");
      }

      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `security_report_${id}.pdf`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast.error(error.message || "Failed to download PDF report");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteScan = async (id, type) => {
    if (deletingId === id) return;

    if (
      !window.confirm(
        `Are you sure you want to delete this ${type} scan? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteScanById(id, type);
      if (result && result.success === false) {
        throw new Error(result.error || result.message || "Failed to delete scan");
      }
      toast.success(result?.message || "Scan deleted successfully!");
      await fetchHistory();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(error.message || "Failed to delete scan");
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================
  // CLEAR ALL HISTORY
  // ============================================
  const handleClearAllHistory = async () => {
    if (scans.length === 0) {
      toast.error("No history to clear");
      setShowClearConfirm(false);
      return;
    }

    setClearingAll(true);
    try {
      const result = await clearScanHistory();
      console.log("✅ Clear result:", result);

      toast.success(result?.message || "All scan history cleared successfully!");
      setShowClearConfirm(false);

      // Refresh the history list
      await fetchHistory();
    } catch (error) {
      console.error("❌ Clear History Error:", error);
      toast.error(error.message || "Failed to clear history");
      setShowClearConfirm(false);
    } finally {
      setClearingAll(false);
    }
  };

  // ============================================
  // FILTERED SCANS - USING SMART SEARCH
  // ============================================
  const filteredScans = (() => {
    if (!Array.isArray(scans)) return [];

    let filtered = getDateFilteredScans(scans);

    if (searchTerm.trim()) {
      filtered = filtered.filter((scan) => smartSearch(scan, searchTerm));
    }

    return filtered;
  })();

  if (loading) {
    return <LoadingSpinner text="Loading security history..." />;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header Stats */}
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

          {/* CLEAR ALL BUTTON */}
          {scans.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                marginTop: "16px",
                padding: "10px 24px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ef4444";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FaTrash size={14} />
              Clear All ({scans.length})
            </button>
          )}
        </div>

        {/* Stats Cards */}
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
            <FaChartLine style={{ fontSize: "32px", color: "#667eea", marginBottom: "12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Total Scans</div>
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
            <FaLink style={{ fontSize: "32px", color: "#3b82f6", marginBottom: "12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}>
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
            <FaEnvelope style={{ fontSize: "32px", color: "#f5576c", marginBottom: "12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}>
              {stats.message}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Message Scans</div>
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
            <FaShieldAlt style={{ fontSize: "32px", color: "#10b981", marginBottom: "12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b" }}>
              {stats.avgRisk.toFixed(1)}%
            </div>
            <div style={{ fontSize: "14px", color: "#64748b" }}>Avg Risk Score</div>
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
        {/* Type Filters */}
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
              {type === "all" ? "All Scans" : type === "url" ? "URL Scans" : "Message Scans"}
            </button>
          ))}
        </div>

        {/* Date Filter */}
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

        {/* Search - with ID hint */}
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
            placeholder="Search by ID (e.g., 5) or content..."
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
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
              <FaCalendarAlt style={{ marginRight: "8px", color: "#667eea" }} />
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
                  background: dateFilter.preset === preset.value ? "#667eea" : "#f1f5f9",
                  color: dateFilter.preset === preset.value ? "white" : "#475569",
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
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
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
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#667eea";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                />
              </div>
              <button
                onClick={handleCustomDateApply}
                style={{
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Apply Range
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#94a3b8",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Showing {filteredScans.length} scans</span>
            {dateFilter.preset !== "all" && (
              <button
                onClick={clearDateFilter}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "12px",
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
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
            <span style={{ marginLeft: "8px", fontWeight: "600", color: "#667eea" }}>
              (filtered by "{searchTerm}")
            </span>
          )}
        </span>
        {dateFilter.preset !== "all" && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <FaCalendarAlt size={12} />
            {getDateFilterLabel()}
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
                  }}
                >
                  ID
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
                  Risk Score
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
                    colSpan="6"
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
                    <p>No scans found. Start scanning to see results here.</p>
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
                filteredScans.map((scan) => {
                  const scanId = scan?.id || scan?._id;
                  const isDownloading = downloadingId === scanId;
                  const isDeleting = deletingId === scanId;

                  // Highlight matching text in content
                  const highlightText = (text, term) => {
                    if (!term || !text) return text;
                    const index = text.toLowerCase().indexOf(term.toLowerCase());
                    if (index === -1) return text;
                    const before = text.substring(0, index);
                    const match = text.substring(index, index + term.length);
                    const after = text.substring(index + term.length);
                    return (
                      <>
                        {before}
                        <span style={{ 
                          background: "#fef3c7", 
                          padding: "0 2px", 
                          borderRadius: "2px",
                          fontWeight: "bold",
                          color: "#b45309"
                        }}>
                          {match}
                        </span>
                        {after}
                      </>
                    );
                  };

                  return (
                    <tr
                      key={scanId || Math.random()}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.3s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td
                        style={{
                          padding: "16px 20px",
                          fontWeight: "600",
                          color: "#667eea",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaHashtag size={10} style={{ opacity: 0.5 }} />
                          {scanId || "N/A"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: scan?.type === "url" ? "#e3f2fd" : "#f3e5f5",
                            color: scan?.type === "url" ? "#1976d2" : "#7b1fa2",
                          }}
                        >
                          {scan?.type === "url" ? <FaLink size={12} /> : <FaEnvelope size={12} />}
                          {scan?.type === "url" ? "URL" : "Message"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", maxWidth: "400px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#475569",
                          }}
                          title={scan?.content || scan?.message || "N/A"}
                        >
                          {highlightText(
                            truncateText(scan?.content || scan?.message || "N/A", 60),
                            searchTerm
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ flex: 1, width: "100px" }}>
                            <div
                              style={{
                                width: "100%",
                                height: "6px",
                                background: "#e2e8f0",
                                borderRadius: "3px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${scan?.riskScore || 0}%`,
                                  height: "100%",
                                  background:
                                    (scan?.riskScore || 0) > 70
                                      ? "#ef4444"
                                      : (scan?.riskScore || 0) > 30
                                      ? "#f59e0b"
                                      : "#10b981",
                                }}
                              ></div>
                            </div>
                          </div>
                          <span style={{ fontWeight: "600", minWidth: "45px" }}>
                            {scan?.riskScore || 0}%
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaCalendar size={12} />
                          {formatDate(scan?.date || scan?.timestamp || Date.now())}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleViewDetails(scanId, scan?.type)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#667eea",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "8px",
                              transition: "background 0.3s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f1f5f9")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(scanId, scan?.type)}
                            disabled={isDownloading}
                            style={{
                              background: "none",
                              border: "none",
                              color: isDownloading ? "#94a3b8" : "#64748b",
                              cursor: isDownloading ? "not-allowed" : "pointer",
                              padding: "6px",
                              borderRadius: "8px",
                              transition: "all 0.3s",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onMouseEnter={(e) => {
                              if (!isDownloading) {
                                e.currentTarget.style.background = "#f1f5f9";
                                e.currentTarget.style.color = "#667eea";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDownloading) {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#64748b";
                              }
                            }}
                          >
                            {isDownloading ? (
                              <>
                                <FaSpinner className="spinning" size={14} />
                                <span style={{ fontSize: "11px" }}>...</span>
                              </>
                            ) : (
                              <FaDownload />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteScan(scanId, scan?.type)}
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
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.background = "#fee";
                                e.currentTarget.style.color = "#dc2626";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#ef4444";
                              }
                            }}
                          >
                            {isDeleting ? (
                              <>
                                <FaSpinner className="spinning" size={14} />
                                <span style={{ fontSize: "11px" }}>...</span>
                              </>
                            ) : (
                              <FaTrashAlt />
                            )}
                          </button>
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

      {/* ============================================ */}
      {/* CLEAR ALL CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showClearConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => {
            if (!clearingAll) {
              setShowClearConfirm(false);
            }
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "#fee",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <FaExclamationTriangle style={{ fontSize: "40px", color: "#ef4444" }} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>
              Clear All History?
            </h3>
            <p style={{ color: "#64748b", marginBottom: "8px" }}>
              This action cannot be undone. All {scans.length} scan records will be permanently
              deleted.
            </p>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
              This includes both URL and Message scans.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearingAll}
                style={{
                  padding: "12px 28px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "12px",
                  cursor: clearingAll ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  opacity: clearingAll ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllHistory}
                disabled={clearingAll}
                style={{
                  padding: "12px 28px",
                  background: clearingAll ? "#94a3b8" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: clearingAll ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!clearingAll) {
                    e.currentTarget.style.background = "#dc2626";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!clearingAll) {
                    e.currentTarget.style.background = "#ef4444";
                  }
                }}
              >
                {clearingAll ? (
                  <>
                    <FaSpinner className="spinning" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <FaTrash />
                    <span>Yes, Clear All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "32px" }}>
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
                  Content
                </h3>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "16px",
                    color: "#1e293b",
                    lineHeight: "1.6",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedScan?.content || selectedScan?.message || "N/A"}
                </div>
              </div>

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
                  Risk Assessment
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    background: "#f8fafc",
                    borderRadius: "16px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: "8px",
                        background: "#e2e8f0",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${selectedScan?.riskScore || 0}%`,
                          height: "100%",
                          background:
                            (selectedScan?.riskScore || 0) > 70
                              ? "#ef4444"
                              : (selectedScan?.riskScore || 0) > 30
                              ? "#f59e0b"
                              : "#10b981",
                        }}
                      ></div>
                    </div>
                  </div>
                  <span style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b" }}>
                    {selectedScan?.riskScore || 0}%
                  </span>
                </div>
              </div>

              {selectedScan?.explanation && (
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
                    AI Analysis
                  </h3>
                  <div
                    style={{
                      padding: "16px",
                      background: "#e3f2fd",
                      borderRadius: "16px",
                      color: "#1e293b",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedScan.explanation}
                  </div>
                </div>
              )}

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
                  Timestamp
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
                  <FaCalendar />
                  {formatDate(selectedScan?.date || selectedScan?.timestamp || Date.now())}
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    const scanId = selectedScan?.id || selectedScan?._id;
                    if (scanId) {
                      handleDownloadPDF(scanId, selectedScan?.type);
                    }
                  }}
                  disabled={downloadingId === (selectedScan?.id || selectedScan?._id)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background:
                      downloadingId === (selectedScan?.id || selectedScan?._id)
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor:
                      downloadingId === (selectedScan?.id || selectedScan?._id)
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {downloadingId === (selectedScan?.id || selectedScan?._id) ? (
                    <>
                      <FaSpinner className="spinning" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FaDownload />
                      <span>Download PDF Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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