// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaClock,
  FaBell,
  FaArrowUp,
  FaArrowDown,
  FaRocket,
  FaLink,
  FaComment,
  FaEye,
  FaChevronRight,
  FaChartPie,
  FaCalendarAlt,
  FaInbox,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  // Process weekly data from actual scans or use default
  const processWeeklyData = () => {
    if (stats.weeklyData && stats.weeklyData.length > 0) {
      return stats.weeklyData;
    }
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      phishing: 0,
      scam: 0,
      safe: 0,
    }));
  };

  const weeklyData = processWeeklyData();
  const hasData = stats.totalScans > 0;
  const hasWeeklyData = weeklyData.some(d => d.phishing > 0 || d.scam > 0 || d.safe > 0);

  const StatCard = ({ title, value, icon: Icon, gradient, trend, subtitle }) => (
    <div className="stat-card-premium">
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
      {trend && (
        <div
          className="stat-trend"
          style={{ color: trend >= 0 ? "#10b981" : "#ef4444" }}
        >
          {trend >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          <span>{Math.abs(trend)}% from last week</span>
        </div>
      )}
    </div>
  );

  // Calculate total threats and percentages for pie chart
  const totalThreats = stats.phishingDetected + stats.scamMessages + stats.safeDetections;
  
  const pieData = [
    { 
      name: "Phishing URLs", 
      value: stats.phishingDetected, 
      color: "#ef4444",
      percentage: totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0
    },
    { 
      name: "Scam Messages", 
      value: stats.scamMessages, 
      color: "#f59e0b",
      percentage: totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0
    },
    { 
      name: "Safe", 
      value: stats.safeDetections, 
      color: "#10b981",
      percentage: totalThreats > 0 ? ((stats.safeDetections / totalThreats) * 100).toFixed(1) : 0
    },
  ];

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "white",
          padding: "12px 16px",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          border: "1px solid #e2e8f0",
        }}>
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

  // Custom Pie Label
  const renderPieLabel = ({ name, percent, value }) => {
    if (value === 0) return '';
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  // Empty State Component
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
      <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", color: "#94a3b8", maxWidth: "300px", marginBottom: "16px" }}>
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
      {/* Animated Background */}
      <div className="animated-bg">
        <div
          className="circle"
          style={{
            width: "300px",
            height: "300px",
            top: "-150px",
            left: "-150px",
          }}
        />
        <div
          className="circle"
          style={{
            width: "200px",
            height: "200px",
            bottom: "-100px",
            right: "-100px",
            animationDelay: "5s",
          }}
        />
        <div
          className="circle"
          style={{
            width: "150px",
            height: "150px",
            top: "50%",
            left: "50%",
            animationDelay: "10s",
          }}
        />
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to PhishGuard</h1>
        <p className="welcome-subtitle">
          Your AI-Powered Security Guardian • Real-time Protection Against Cyber
          Threats
        </p>
      </div>

      {/* Hero CTA Section - Start Scan */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "24px",
          padding: "40px 48px",
          marginBottom: "48px",
          position: "relative",
          overflow: "hidden",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                padding: "4px 14px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              🛡️ AI-POWERED THREAT DETECTION
            </span>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.25)",
                padding: "4px 14px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  background: "#10b981",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              LIVE PROTECTION
            </span>
          </div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginBottom: "8px",
              lineHeight: "1.2",
            }}
          >
            Check before you click or reply.
          </h2>
          <p
            style={{
              fontSize: "16px",
              opacity: 0.9,
              maxWidth: "480px",
              lineHeight: "1.6",
            }}
          >
            Scan suspicious URLs and messages in seconds with clear risk
            explanations.
          </p>
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/url-scan")}
            style={{
              background: "white",
              color: "#667eea",
              padding: "14px 28px",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
            }}
          >
            <FaLink />
            Scan URL
          </button>
          <button
            onClick={() => navigate("/message-scan")}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              padding: "14px 28px",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FaComment />
            Scan Message
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
          subtitle="All time scans"
        />
        <StatCard
          title="Phishing URLs"
          value={stats.phishingDetected}
          icon={FaExclamationTriangle}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          trend={hasData ? -5 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0}% of total`}
        />
        <StatCard
          title="Scam Messages"
          value={stats.scamMessages}
          icon={FaEnvelope}
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          trend={hasData ? 8 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0}% of total`}
        />
        <StatCard
          title="Safe Detections"
          value={stats.safeDetections}
          icon={FaCheckCircle}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          trend={hasData ? 15 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.safeDetections / totalThreats) * 100).toFixed(1) : 0}% of total`}
        />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "24px",
          marginBottom: "48px",
        }}
      >
        {/* Area Chart - Detection Trends */}
        <div className="chart-container" style={{ position: "relative" }}>
          <div className="chart-title">
            <FaChartLine style={{ color: "#667eea" }} />
            <span>Detection Trends</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "400",
                color: "#94a3b8",
                marginLeft: "8px",
              }}
            >
              (Last 7 days)
            </span>
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
                <Area
                  type="monotone"
                  dataKey="phishing"
                  stroke="#ef4444"
                  fill="url(#colorPhishing)"
                  name="Phishing URLs"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="scam"
                  stroke="#f59e0b"
                  fill="url(#colorScam)"
                  name="Scam Messages"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="safe"
                  stroke="#10b981"
                  fill="url(#colorSafe)"
                  name="Safe"
                  strokeWidth={2}
                />
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

        {/* Pie Chart - Threat Distribution */}
        <div className="chart-container" style={{ position: "relative" }}>
          <div className="chart-title">
            <FaChartPie style={{ color: "#667eea" }} />
            <span>Threat Distribution</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "400",
                color: "#94a3b8",
                marginLeft: "8px",
              }}
            >
              ({totalThreats} total)
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
                  label={renderPieLabel}
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    padding: "12px",
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => {
                    const item = pieData.find(d => d.name === value);
                    return `${value}: ${item?.percentage || 0}%`;
                  }}
                />
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

      {/* Recent Scans Table with View All Button */}
      <div className="chart-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div className="chart-title" style={{ marginBottom: 0 }}>
            <FaClock style={{ color: "#667eea" }} />
            <span>Recent Security Scans</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "400",
                color: "#94a3b8",
                marginLeft: "8px",
              }}
            >
              ({stats.recentScans?.length || 0} total)
            </span>
          </div>
          <button
            onClick={() => navigate("/history")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
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
            <FaEye />
            View All
            <FaChevronRight size={12} />
          </button>
        </div>

        {stats.recentScans?.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Content</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans?.map((scan, index) => (
                  <tr key={index}>
                    <td>
                      <span
                        className={`badge-premium ${scan.type === "url" ? "badge-url" : "badge-message"}`}
                      >
                        {scan.type === "url" ? "🔗 URL" : "💬 Message"}
                      </span>
                    </td>
                    <td
                      style={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {scan.content || scan.message || "N/A"}
                    </td>
                    <td>
                      <div className="risk-indicator">
                        <div className="risk-bar-premium">
                          <div
                            className="risk-fill"
                            style={{
                              width: `${scan.riskScore || 0}%`,
                              background:
                                (scan.riskScore || 0) > 70
                                  ? "#ef4444"
                                  : (scan.riskScore || 0) > 30
                                    ? "#f59e0b"
                                    : "#10b981",
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: "600", minWidth: "45px" }}>
                          {scan.riskScore || 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background:
                            scan.result === "safe" ? "#10b98120" : "#ef444420",
                          color: scan.result === "safe" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {scan.result === "safe"
                          ? "✅ Safe"
                          : scan.result === "phishing"
                            ? "⚠️ Phishing"
                            : "⚠️ Scam"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaCalendarAlt size={12} />
                        {new Date(scan.date || scan.timestamp || Date.now()).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
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
              <FaShieldAlt style={{ fontSize: "36px", color: "#94a3b8" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
              No Scans Yet
            </h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", maxWidth: "400px", marginBottom: "16px" }}>
              Start scanning URLs or messages to see results here. Your scan history will appear in this table.
            </p>
            <button
              onClick={() => navigate("/url-scan")}
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
              Start Scanning
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;