// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { getScanHistory } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGuest } from "../context/GuestContext";
import {
  FaShieldAlt,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaLink,
  FaComment,
  FaEye,
  FaChevronRight,
  FaChartPie,
  FaCalendarAlt,
  FaInbox,
  FaUserPlus,
  FaSync,
  FaHashtag,
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import AuthModal from "../components/common/AuthModal";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalScans: 0,
    phishingDetected: 0,
    scamMessages: 0,
    safeDetections: 0,
    recentScans: [],
    weeklyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getStats: getGuestStats, scans: guestScans } = useGuest();

  useEffect(() => {
    fetchDashboardStats();
  }, [isAuthenticated]);

  // Helper function to get prediction from API response
  const getPrediction = (scan) => {
    return scan.overallPrediction || scan.prediction || "UNKNOWN";
  };

  // Helper function to detect scan type
  const getScanType = (scan) => {
    // Check if type is explicitly set
    if (scan.type) {
      const type = scan.type.toLowerCase();
      if (type === "url" || type === "message") return type;
    }
    if (scan.scanType) {
      const type = scan.scanType.toLowerCase();
      if (type === "url" || type === "message") return type;
      if (type.includes("url")) return "url";
      if (type.includes("message")) return "message";
    }
    // Check if it's a message scan by looking for message field
    if (scan.message) return "message";
    // Check if it's a URL scan by looking for url field
    if (scan.url) return "url";
    // Check content field
    if (scan.content) {
      const content = String(scan.content);
      if (content.match(/^https?:\/\/[^\s]+/) || content.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return "url";
      }
      if (content.length > 50) return "message";
      return content.length > 20 ? "message" : "url";
    }
    // Default to URL
    return "url";
  };

  // Helper function to classify a scan based on type and prediction
  const classifyScan = (scan) => {
    const type = getScanType(scan);
    const pred = getPrediction(scan).toUpperCase();
    
    // Determine if it's a threat (phishing or scam)
    const isThreat = pred === "PHISHING" || pred === "DANGEROUS" || pred === "MALICIOUS" || pred === "SCAM" || pred === "SUSPICIOUS" || pred === "WARNING";
    
    // For URL scans
    if (type === "url") {
      if (pred === "PHISHING" || pred === "DANGEROUS" || pred === "MALICIOUS") {
        return "phishing";
      } else if (pred === "SUSPICIOUS" || pred === "WARNING") {
        return "suspicious_url";
      } else if (pred === "SAFE" || pred === "LEGITIMATE") {
        return "safe";
      }
      return "unknown";
    }
    
    // For Message scans
    if (type === "message") {
      if (pred === "PHISHING" || pred === "DANGEROUS" || pred === "MALICIOUS" || pred === "SCAM") {
        return "scam";
      } else if (pred === "SUSPICIOUS" || pred === "WARNING") {
        return "suspicious_message";
      } else if (pred === "SAFE" || pred === "LEGITIMATE") {
        return "safe";
      }
      return "unknown";
    }
    
    return "unknown";
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const historyResponse = await getScanHistory();

        let allScans = [];
        if (historyResponse && historyResponse.scans && Array.isArray(historyResponse.scans)) {
          allScans = historyResponse.scans;
        } else if (Array.isArray(historyResponse)) {
          allScans = historyResponse;
        } else if (historyResponse && historyResponse.response && Array.isArray(historyResponse.response)) {
          allScans = historyResponse.response;
        }

        const totalScans = allScans.length;
        
        // Count using classifyScan function
        let phishingDetected = 0;
        let scamMessages = 0;
        let safeDetections = 0;

        allScans.forEach((scan) => {
          const classification = classifyScan(scan);
          if (classification === "phishing") {
            phishingDetected++;
          } else if (classification === "scam") {
            scamMessages++;
          } else if (classification === "safe") {
            safeDetections++;
          }
        });

        const recentScans = allScans.slice(0, 5).map((scan) => {
          const type = getScanType(scan);
          const content = scan.url || scan.message || scan.content || "";
          return {
            reference: scan.reference,
            content: content,
            type: type,
            result: getResultFromPrediction(getPrediction(scan)),
            date: scan.scannedAt,
            prediction: getPrediction(scan),
          };
        });

        const weeklyData = generateWeeklyDataFromScans(allScans);

        setStats({
          totalScans,
          phishingDetected,
          scamMessages,
          safeDetections,
          recentScans,
          weeklyData,
        });
      } else {
        const guestStats = getGuestStats();
        const guestRecentScans = guestScans.slice(0, 5).map((scan) => ({
          reference: scan.id || scan.reference || `guest_${Date.now()}`,
          content: scan.content || scan.url || scan.message || "",
          type: scan.type || "url",
          result: scan.result || "unknown",
          date: scan.date || new Date().toISOString(),
          prediction: scan.prediction || "UNKNOWN",
        }));

        setStats({
          totalScans: guestStats.total,
          phishingDetected: guestStats.phishing,
          scamMessages: guestStats.scam,
          safeDetections: guestStats.safe,
          recentScans: guestRecentScans,
          weeklyData: generateWeeklyDataFromScans(guestScans),
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      if (isAuthenticated) {
        toast.error("Failed to load dashboard data");
      }
      setStats({
        totalScans: 0,
        phishingDetected: 0,
        scamMessages: 0,
        safeDetections: 0,
        recentScans: [],
        weeklyData: generateEmptyWeeklyData(),
      });
    } finally {
      setLoading(false);
    }
  };

  const getResultFromPrediction = (prediction) => {
    const pred = prediction?.toUpperCase() || "";
    switch (pred) {
      case "PHISHING":
      case "DANGEROUS":
      case "MALICIOUS":
        return "phishing";
      case "SCAM":
      case "SUSPICIOUS":
      case "WARNING":
        return "suspicious";
      case "SAFE":
      case "LEGITIMATE":
        return "safe";
      default:
        return "unknown";
    }
  };

  const generateWeeklyDataFromScans = (scans) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const dayMap = {};

    days.forEach((day, index) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - index));
      const dateStr = d.toISOString().split("T")[0];
      dayMap[dateStr] = { day, phishing: 0, scam: 0, safe: 0, date: dateStr };
    });

    scans.forEach((scan) => {
      if (!scan.scannedAt) return;
      const scanDate = new Date(scan.scannedAt);
      const dateStr = scanDate.toISOString().split("T")[0];

      if (dayMap[dateStr]) {
        const classification = classifyScan(scan);
        if (classification === "phishing") {
          dayMap[dateStr].phishing += 1;
        } else if (classification === "scam") {
          dayMap[dateStr].scam += 1;
        } else if (classification === "safe") {
          dayMap[dateStr].safe += 1;
        }
      }
    });

    const result = Object.values(dayMap);
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  };

  const generateEmptyWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      phishing: 0,
      scam: 0,
      safe: 0,
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  const weeklyData = stats.weeklyData.length > 0 ? stats.weeklyData : generateEmptyWeeklyData();
  const hasData = stats.totalScans > 0;
  const hasWeeklyData = weeklyData.some((d) => d.phishing > 0 || d.scam > 0 || d.safe > 0);

  const totalThreats = stats.phishingDetected + stats.scamMessages;

  const pieData = [
    {
      name: "Phishing URLs",
      value: stats.phishingDetected,
      color: "#ef4444",
      percentage: totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0,
    },
    {
      name: "Scam Messages",
      value: stats.scamMessages,
      color: "#f59e0b",
      percentage: totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0,
    },
    {
      name: "Safe",
      value: stats.safeDetections,
      color: "#10b981",
      percentage: stats.totalScans > 0 ? ((stats.safeDetections / stats.totalScans) * 100).toFixed(1) : 0,
    },
  ];

  const StatCard = ({ title, value, icon: Icon, gradient, trend, subtitle, locked }) => (
    <div
      className="stat-card-premium"
      style={{
        position: "relative",
        cursor: "default",
        transition: "all 0.3s ease",
      }}
    >
      {locked && !isAuthenticated && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "#f1f5f9",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "10px",
            fontWeight: "600",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FaUserPlus size={10} />
          <span>Sign in</span>
        </div>
      )}
      <div className="stat-icon" style={{ background: gradient }}>
        <Icon style={{ color: "white", fontSize: "28px" }} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {subtitle && (
        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
          {subtitle}
        </div>
      )}
      {trend !== undefined && trend !== null && (
        <div className="stat-trend" style={{ color: trend >= 0 ? "#10b981" : "#ef4444" }}>
          {trend >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          <span>{Math.abs(trend)}% from last week</span>
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "white",
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontSize: "14px", margin: "4px 0" }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const EmptyChartState = ({ icon: Icon, title, description, actionText, onAction }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "320px",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Icon style={{ fontSize: "36px", color: "#94a3b8" }} />
      </div>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#1e293b",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "#94a3b8",
          maxWidth: "300px",
          marginBottom: "16px",
        }}
      >
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 8px 25px rgba(102,126,234,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-premium">
        <div className="loading-spinner-premium"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="animated-bg">
        <div className="circle" style={{ width: "300px", height: "300px", top: "-150px", left: "-150px" }} />
        <div className="circle" style={{ width: "200px", height: "200px", bottom: "-100px", right: "-100px", animationDelay: "5s" }} />
        <div className="circle" style={{ width: "150px", height: "150px", top: "50%", left: "50%", animationDelay: "10s" }} />
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="welcome-title">
              {isAuthenticated ? `Welcome back, ${user?.firstName || "User"}!` : "Welcome to SecureShield"}
            </h1>
            <p className="welcome-subtitle">
              {isAuthenticated
                ? "Your AI-Powered Security Guardian • Real-time Protection Against Cyber Threats"
                : "Start scanning URLs and messages instantly • No account required"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              cursor: refreshing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#64748b",
              transition: "all 0.3s ease",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <FaSync className={refreshing ? "spinning" : ""} size={14} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
        {!isAuthenticated && (
          <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "8px", background: "#f1f5f9", padding: "8px 20px", borderRadius: "100px", display: "inline-block" }}>
            👋 Guest mode • Sign up to save your scan history
          </p>
        )}
      </div>

      {/* Hero CTA Section */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "24px", padding: "40px 48px", marginBottom: "48px", position: "relative", overflow: "hidden", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.15)", padding: "4px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "600", letterSpacing: "0.5px" }}>
              🛡️ AI-POWERED THREAT DETECTION
            </span>
            <span style={{ background: "rgba(16, 185, 129, 0.25)", padding: "4px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", animation: "pulse 2s infinite" }} />
              {isAuthenticated ? "PROTECTED" : "GUEST MODE"}
            </span>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", lineHeight: "1.2" }}>Check before you click or reply.</h2>
          <p style={{ fontSize: "16px", opacity: 0.9, maxWidth: "480px", lineHeight: "1.6" }}>Scan suspicious URLs and messages in seconds with clear risk explanations.</p>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/url-scan")} style={{ background: "white", color: "#667eea", padding: "14px 28px", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <FaLink /> Scan URL
          </button>
          <button onClick={() => navigate("/message-scan")} style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "14px 28px", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px", transition: "all 0.3s ease", backdropFilter: "blur(10px)" }}>
            <FaComment /> Scan Message
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          icon={FaShieldAlt}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          trend={hasData ? 12 : 0}
          subtitle={isAuthenticated ? "All time scans" : "Session scans"}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Phishing URLs"
          value={stats.phishingDetected}
          icon={FaExclamationTriangle}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          trend={hasData ? -5 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0}% of threats`}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Scam Messages"
          value={stats.scamMessages}
          icon={FaEnvelope}
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          trend={hasData ? 8 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0}% of threats`}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Safe Detections"
          value={stats.safeDetections}
          icon={FaCheckCircle}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          trend={hasData ? 15 : 0}
          subtitle={`${stats.totalScans > 0 ? ((stats.safeDetections / stats.totalScans) * 100).toFixed(1) : 0}% of total`}
          locked={!isAuthenticated}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        {/* Area Chart */}
        <div className="chart-container" style={{ position: "relative" }}>
          <div className="chart-title">
            <FaChartLine style={{ color: "#667eea" }} />
            <span>Detection Trends</span>
            <span style={{ fontSize: "12px", fontWeight: "400", color: "#94a3b8", marginLeft: "8px" }}>(Last 7 days)</span>
          </div>
          {hasWeeklyData ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorPhishing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="phishing" stroke="#ef4444" fill="url(#colorPhishing)" name="Phishing URLs" strokeWidth={2} />
                <Area type="monotone" dataKey="scam" stroke="#f59e0b" fill="url(#colorScam)" name="Scam Messages" strokeWidth={2} />
                <Area type="monotone" dataKey="safe" stroke="#10b981" fill="url(#colorSafe)" name="Safe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={FaInbox}
              title="No Scan Data Available"
              description="Start scanning URLs and messages to see detection trends over time."
              actionText="Start Scanning"
              onAction={() => navigate("/url-scan")}
            />
          )}
        </div>

        {/* Pie Chart */}
        <div className="chart-container" style={{ position: "relative" }}>
          <div className="chart-title">
            <FaChartPie style={{ color: "#667eea" }} />
            <span>Threat Distribution</span>
            <span style={{ fontSize: "12px", fontWeight: "400", color: "#94a3b8", marginLeft: "8px" }}>
              ({totalThreats} threats)
            </span>
          </div>
          {totalThreats > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent, value }) => value > 0 ? `${name}: ${(percent * 100).toFixed(1)}%` : ""}
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "none", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", padding: "12px" }} />
                <Legend verticalAlign="bottom" height={36} formatter={(value, entry) => {
                  const item = pieData.find((d) => d.name === value);
                  return `${value}: ${item?.percentage || 0}%`;
                }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={FaChartPie}
              title="No Data to Display"
              description="No scans have been performed yet. Start scanning to see threat distribution."
              actionText="Start Scanning"
              onAction={() => navigate("/message-scan")}
            />
          )}
        </div>
      </div>

      {/* Guest Mode Call to Action */}
      {!isAuthenticated && hasData && (
        <div style={{ background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", borderRadius: "24px", padding: "32px 40px", marginBottom: "48px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FaUserPlus style={{ fontSize: "28px", color: "#667eea" }} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
            Want to save your scan history?
          </h3>
          <p style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto 20px" }}>
            Create a free account to permanently save your scans, access them from any device, and unlock premium features.
          </p>
          <button onClick={() => setShowAuthModal(true)} style={{ padding: "12px 32px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(102,126,234,0.4)" }}>
            Sign Up Free
          </button>
        </div>
      )}

      {/* Recent Scans Table */}
      <div className="chart-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div className="chart-title" style={{ marginBottom: 0 }}>
            <FaClock style={{ color: "#667eea" }} />
            <span>Recent Security Scans</span>
            <span style={{ fontSize: "14px", fontWeight: "400", color: "#94a3b8", marginLeft: "8px" }}>
              ({stats.recentScans?.length || 0} total)
            </span>
          </div>
          <button onClick={() => navigate("/history")} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease" }}>
            <FaEye /> View All <FaChevronRight size={12} />
          </button>
        </div>

        {stats.recentScans?.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Content</th>
                  <th>Prediction</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans?.slice(0, 5).map((scan, index) => {
                  const getPredictionColor = (prediction) => {
                    const pred = prediction?.toUpperCase() || "";
                    switch (pred) {
                      case "PHISHING": return { bg: "#fee2e2", color: "#dc2626" };
                      case "SCAM": return { bg: "#fef3c7", color: "#d97706" };
                      case "SUSPICIOUS": return { bg: "#fef3c7", color: "#d97706" };
                      case "WARNING": return { bg: "#fef3c7", color: "#d97706" };
                      case "SAFE": return { bg: "#d1fae5", color: "#065f46" };
                      case "LEGITIMATE": return { bg: "#d1fae5", color: "#065f46" };
                      default: return { bg: "#f1f5f9", color: "#64748b" };
                    }
                  };
                  
                  const getTypeBadge = (type) => {
                    if (type === "url") {
                      return { bg: "#dbeafe", color: "#1d4ed8", icon: <FaLink size={12} />, label: "URL" };
                    } else if (type === "message") {
                      return { bg: "#fce7f3", color: "#be185d", icon: <FaComment size={12} />, label: "Message" };
                    }
                    return { bg: "#f1f5f9", color: "#64748b", icon: null, label: "Unknown" };
                  };

                  const predColor = getPredictionColor(scan.prediction);
                  const typeBadge = getTypeBadge(scan.type);
                  const content = scan.content || "N/A";

                  return (
                    <tr key={index}>
                      <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#667eea" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaHashtag size={10} style={{ opacity: 0.5 }} />
                          {scan.reference ? truncateText(scan.reference, 20) : "N/A"}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "6px",
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "12px", 
                          fontWeight: "600", 
                          background: typeBadge.bg, 
                          color: typeBadge.color 
                        }}>
                          {typeBadge.icon}
                          {typeBadge.label}
                        </span>
                      </td>
                      <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {truncateText(content, 50)}
                      </td>
                      <td>
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: predColor.bg, color: predColor.color }}>
                          {scan.prediction || "UNKNOWN"}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaCalendarAlt size={12} />
                          {formatDate(scan.date || scan.scannedAt || Date.now())}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <FaShieldAlt style={{ fontSize: "36px", color: "#94a3b8" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>No Scans Yet</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", maxWidth: "400px", marginBottom: "16px" }}>Start scanning URLs or messages to see results here.</p>
            <button onClick={() => navigate("/url-scan")} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease" }}>
              Start Scanning
            </button>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="register" onSuccess={() => { setShowAuthModal(false); fetchDashboardStats(); }} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const truncateText = (text, maxLength = 100) => {
  if (!text) return "N/A";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export default Dashboard;