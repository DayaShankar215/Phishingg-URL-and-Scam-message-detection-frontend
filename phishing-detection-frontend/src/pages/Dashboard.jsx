import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { 
  FaShieldAlt, 
  FaEnvelope, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaChartLine,
  FaClock,
  FaBell,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalScans: 0,
    phishingDetected: 0,
    scamMessages: 0,
    safeDetections: 0,
    recentScans: [],
    weeklyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, trend, color }) => (
    <div className="stat-card-premium">
      <div className="stat-icon" style={{ background: gradient }}>
        <Icon style={{ color: 'white', fontSize: '28px' }} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {trend && (
        <div className="stat-trend" style={{ color: trend >= 0 ? '#10b981' : '#ef4444' }}>
          {trend >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          <span>{Math.abs(trend)}% from last week</span>
        </div>
      )}
    </div>
  );

  const pieData = [
    { name: 'Phishing URLs', value: stats.phishingDetected, color: '#ef4444' },
    { name: 'Scam Messages', value: stats.scamMessages, color: '#f59e0b' },
    { name: 'Safe', value: stats.safeDetections, color: '#10b981' }
  ];

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
        <div className="circle" style={{ width: '300px', height: '300px', top: '-150px', left: '-150px' }}></div>
        <div className="circle" style={{ width: '200px', height: '200px', bottom: '-100px', right: '-100px', animationDelay: '5s' }}></div>
        <div className="circle" style={{ width: '150px', height: '150px', top: '50%', left: '50%', animationDelay: '10s' }}></div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome to PhishGuard
        </h1>
        <p className="welcome-subtitle">
          Your AI-Powered Security Guardian • Real-time Protection Against Cyber Threats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          title="Total Scans" 
          value={stats.totalScans} 
          icon={FaShieldAlt}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          trend={12}
        />
        <StatCard 
          title="Phishing URLs" 
          value={stats.phishingDetected} 
          icon={FaExclamationTriangle}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          trend={-5}
        />
        <StatCard 
          title="Scam Messages" 
          value={stats.scamMessages} 
          icon={FaEnvelope}
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          trend={8}
        />
        <StatCard 
          title="Safe Detections" 
          value={stats.safeDetections} 
          icon={FaCheckCircle}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          trend={15}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {/* Area Chart */}
        <div className="chart-container">
          <div className="chart-title">
            <FaChartLine style={{ color: '#667eea' }} />
            <span>Detection Trends</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.weeklyData}>
              <defs>
                <linearGradient id="colorPhishing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
              />
              <Area type="monotone" dataKey="phishing" stroke="#ef4444" fill="url(#colorPhishing)" name="Phishing URLs" />
              <Area type="monotone" dataKey="scam" stroke="#f59e0b" fill="url(#colorScam)" name="Scam Messages" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-container">
          <div className="chart-title">
            <FaBell style={{ color: '#667eea' }} />
            <span>Threat Distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="chart-container">
        <div className="chart-title">
          <FaClock style={{ color: '#667eea' }} />
          <span>Recent Security Scans</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
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
              {stats.recentScans.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <FaShieldAlt style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                    <p>No scans yet. Start scanning URLs or messages to see results here.</p>
                  </td>
                </tr>
              ) : (
                stats.recentScans.map((scan, index) => (
                  <tr key={index}>
                    <td>
                      <span className={`badge-premium ${scan.type === 'url' ? 'badge-url' : 'badge-message'}`}>
                        {scan.type === 'url' ? '🔗 URL' : '💬 Message'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scan.content}
                    </td>
                    <td>
                      <div className="risk-indicator">
                        <div className="risk-bar-premium">
                          <div 
                            className="risk-fill"
                            style={{ 
                              width: `${scan.riskScore}%`,
                              background: scan.riskScore > 70 ? '#ef4444' : scan.riskScore > 30 ? '#f59e0b' : '#10b981'
                            }}
                          ></div>
                        </div>
                        <span style={{ fontWeight: '600', minWidth: '45px' }}>{scan.riskScore}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: scan.result === 'safe' ? '#10b98120' : '#ef444420',
                        color: scan.result === 'safe' ? '#10b981' : '#ef4444'
                      }}>
                        {scan.result === 'safe' ? '✅ Safe' : scan.result === 'phishing' ? '⚠️ Phishing' : '⚠️ Scam'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '14px' }}>
                      {new Date(scan.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;