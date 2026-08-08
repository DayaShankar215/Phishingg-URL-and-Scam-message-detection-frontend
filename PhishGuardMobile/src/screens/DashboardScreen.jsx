// screens/DashboardScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGuest } from '../context/GuestContext';
import { getColors } from '../constants/colors';
import { getScanHistory } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthModal from '../components/AuthModal';
import { showToast } from '../components/Toaster';
import { formatDate, truncateText, getPredictionColor } from '../utils/formatters';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { isAuthenticated, user, logout } = useAuth();
  const { getStats: getGuestStats, scans: guestScans } = useGuest();

  const [stats, setStats] = useState({
    totalScans: 0,
    phishingDetected: 0,
    scamMessages: 0,
    safeDetections: 0,
    recentScans: [],
    weeklyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchDashboardStats();
    }
  }, [isAuthenticated, isFocused]);

  // Helper function to get prediction from API response
  const getPrediction = (scan) => {
    return scan.overallPrediction || scan.prediction || "UNKNOWN";
  };

  // Helper function to detect scan type
  const getScanType = (scan) => {
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
    if (scan.message) return "message";
    if (scan.url) return "url";
    if (scan.content) {
      const content = String(scan.content);
      if (content.match(/^https?:\/\/[^\s]+/) || content.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return "url";
      }
      if (content.length > 50) return "message";
      return content.length > 20 ? "message" : "url";
    }
    return "url";
  };

  // Helper function to classify a scan based on type and prediction
  const classifyScan = (scan) => {
    const type = getScanType(scan);
    const pred = getPrediction(scan).toUpperCase();
    
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

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setAuthError(false);

      if (isAuthenticated) {
        try {
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
              date: scan.scannedAt || scan.date || new Date().toISOString(),
              prediction: getPrediction(scan),
              scannedAt: scan.scannedAt,
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
        } catch (error) {
          console.error('Error fetching history:', error);
          
          if (error.isAuthError || error.status === 401 || error.status === 403) {
            setAuthError(true);
            showToast('Session expired. Please login again.', 'error');
            await logout();
          } else {
            showToast(error.message || 'Failed to load scan history', 'error');
          }
          
          setStats({
            totalScans: 0,
            phishingDetected: 0,
            scamMessages: 0,
            safeDetections: 0,
            recentScans: [],
            weeklyData: generateEmptyWeeklyData(),
          });
        }
      } else {
        // GUEST MODE: Show 0 stats, no recent scans
        const guestStats = getGuestStats();
        
        // ⚠️ IMPORTANT: In guest mode, we DO NOT show recent scans
        // Just show empty state with "No Scans Yet"
        setStats({
          totalScans: 0,
          phishingDetected: 0,
          scamMessages: 0,
          safeDetections: 0,
          recentScans: [], // ← Empty for guests
          weeklyData: generateEmptyWeeklyData(),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (isAuthenticated) {
        showToast('Failed to load dashboard data', 'error');
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
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    if (!authError) {
      showToast('Dashboard refreshed!', 'success');
    }
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

  const StatCard = ({ title, value, icon, gradient, trend, subtitle, locked }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.backgroundCard,
          borderColor: colors.borderLight,
        },
      ]}
    >
      {locked && !isAuthenticated && (
        <View style={[styles.lockedBadge, { backgroundColor: colors.backgroundInput }]}>
          <Ionicons name="person-add-outline" size={10} color={colors.textMuted} />
          <Text style={[styles.lockedBadgeText, { color: colors.textMuted }]}>Sign in</Text>
        </View>
      )}
      <LinearGradient
        colors={gradient || ['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statIcon}
      >
        <Ionicons name={icon} size={28} color="white" />
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      {trend !== undefined && trend !== null && (
        <View style={styles.statTrend}>
          <Ionicons 
            name={trend >= 0 ? 'arrow-up-outline' : 'arrow-down-outline'} 
            size={12} 
            color={trend >= 0 ? '#10b981' : '#ef4444'} 
          />
          <Text style={{ color: trend >= 0 ? '#10b981' : '#ef4444', fontSize: 11 }}>
            {Math.abs(trend)}% from last week
          </Text>
        </View>
      )}
    </View>
  );

  const EmptyChartState = ({ icon, title, description, actionText, onAction }) => (
    <View style={styles.emptyChartState}>
      <View style={[styles.emptyChartIcon, { backgroundColor: 'rgba(102,126,234,0.08)' }]}>
        <Ionicons name={icon} size={36} color="#94a3b8" />
      </View>
      <Text style={[styles.emptyChartTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyChartDescription, { color: colors.textMuted }]}>{description}</Text>
      {onAction && (
        <TouchableOpacity 
          style={[styles.emptyChartBtn, { backgroundColor: colors.primary[600] }]} 
          onPress={onAction}
        >
          <Text style={styles.emptyChartBtnText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Helper to get prediction color
  const getPredColor = (prediction) => {
    const pred = prediction?.toUpperCase() || "";
    switch (pred) {
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

  const getTypeBadgeStyle = (type) => {
    if (type === "url") {
      return { bg: "#dbeafe", color: "#1d4ed8", icon: "link-outline", label: "URL" };
    } else if (type === "message") {
      return { bg: "#fce7f3", color: "#be185d", icon: "chatbubble-outline", label: "Message" };
    }
    return { bg: "#f1f5f9", color: "#64748b", icon: "help-outline", label: "Unknown" };
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Animated Background */}
      <View style={styles.animatedBg}>
        <View style={[styles.circle, styles.circle1, { backgroundColor: 'rgba(102,126,234,0.05)' }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: 'rgba(102,126,234,0.05)' }]} />
        <View style={[styles.circle, styles.circle3, { backgroundColor: 'rgba(102,126,234,0.05)' }]} />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              {isAuthenticated ? `Welcome back, ${user?.firstName || "User"}!` : "Welcome to SecureShield"}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textMuted }]}>
              {isAuthenticated
                ? "Your AI-Powered Security Guardian • Real-time Protection Against Cyber Threats"
                : "Start scanning URLs and messages instantly • No account required"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: colors.border, opacity: refreshing ? 0.6 : 1 }]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh-outline" 
              size={16} 
              color={colors.textMuted} 
              style={refreshing ? styles.spinning : null} 
            />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>
        {!isAuthenticated && (
          <View style={[styles.guestBadge, { backgroundColor: colors.backgroundInput }]}>
            <Text style={[styles.guestBadgeText, { color: colors.textMuted }]}>
              👋 Guest mode • Sign up to save your scan history
            </Text>
          </View>
        )}
        {authError && (
          <View style={[styles.authErrorBadge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.authErrorText}>Session expired. Please login again.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
              <Text style={styles.authErrorLink}>Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hero CTA Section */}
      <LinearGradient 
        colors={['#667eea', '#764ba2']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.heroSection}
      >
        <View style={styles.heroBackgroundDecor}>
          <View style={[styles.heroDecorCircle, { top: -80, right: -80, width: 250, height: 250 }]} />
          <View style={[styles.heroDecorCircle, { bottom: -60, left: -60, width: 180, height: 180 }]} />
        </View>
        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={styles.heroBadgeText}>🛡️ AI-POWERED THREAT DETECTION</Text>
            </View>
            <View style={[styles.heroBadge, styles.heroBadgeLive]}>
              <View style={styles.liveDot} />
              <Text style={[styles.heroBadgeText, { color: '#10b981' }]}>
                {isAuthenticated ? "PROTECTED" : "GUEST MODE"}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Check before you click or reply.</Text>
          <Text style={styles.heroDescription}>
            Scan suspicious URLs and messages in seconds with clear risk explanations.
          </Text>
        </View>
        <View style={styles.heroButtons}>
          <TouchableOpacity 
            style={[styles.heroBtnPrimary, { backgroundColor: 'white' }]} 
            onPress={() => navigation.navigate('URL Scanner')}
          >
            <Ionicons name="link-outline" size={18} color="#667eea" />
            <Text style={[styles.heroBtnPrimaryText, { color: '#667eea' }]}>Scan URL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.heroBtnSecondary, { borderColor: 'rgba(255,255,255,0.3)' }]} 
            onPress={() => navigation.navigate('Message Scanner')}
          >
            <Ionicons name="chatbubble-outline" size={18} color="white" />
            <Text style={styles.heroBtnSecondaryText}>Scan Message</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          icon="shield-outline"
          gradient={['#667eea', '#764ba2']}
          trend={hasData ? 12 : 0}
          subtitle={isAuthenticated ? "All time scans" : "Session scans"}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Phishing URLs"
          value={stats.phishingDetected}
          icon="warning-outline"
          gradient={['#f093fb', '#f5576c']}
          trend={hasData ? -5 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0}% of threats`}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Scam Messages"
          value={stats.scamMessages}
          icon="chatbubble-outline"
          gradient={['#fa709a', '#fee140']}
          trend={hasData ? 8 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0}% of threats`}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Safe Detections"
          value={stats.safeDetections}
          icon="checkmark-circle-outline"
          gradient={['#4facfe', '#00f2fe']}
          trend={hasData ? 15 : 0}
          subtitle={`${stats.totalScans > 0 ? ((stats.safeDetections / stats.totalScans) * 100).toFixed(1) : 0}% of total`}
          locked={!isAuthenticated}
        />
      </View>

      {/* Charts Row */}
      <View style={styles.chartsRow}>
        {/* Area Chart - Weekly Trends */}
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundCard, borderColor: colors.borderLight }]}>
          <View style={styles.chartHeader}>
            <Ionicons name="stats-chart-outline" size={20} color="#667eea" />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Detection Trends</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>(Last 7 days)</Text>
          </View>
          {hasWeeklyData ? (
            <View>
              <View style={styles.weeklyChart}>
                {weeklyData.map((day, index) => {
                  const maxValue = Math.max(day.phishing, day.scam, day.safe, 1);
                  const maxHeight = 80;
                  
                  return (
                    <View key={index} style={styles.weekDayContainer}>
                      <View style={styles.weekDayBars}>
                        {day.phishing > 0 && (
                          <View 
                            style={[
                              styles.weekBar, 
                              { 
                                height: Math.max((day.phishing / maxValue) * maxHeight, 4),
                                backgroundColor: '#ef4444' 
                              }
                            ]} 
                          />
                        )}
                        {day.scam > 0 && (
                          <View 
                            style={[
                              styles.weekBar, 
                              { 
                                height: Math.max((day.scam / maxValue) * maxHeight, 4),
                                backgroundColor: '#f59e0b' 
                              }
                            ]} 
                          />
                        )}
                        {day.safe > 0 && (
                          <View 
                            style={[
                              styles.weekBar, 
                              { 
                                height: Math.max((day.safe / maxValue) * maxHeight, 4),
                                backgroundColor: '#10b981' 
                              }
                            ]} 
                          />
                        )}
                      </View>
                      <Text style={[styles.weekDayLabel, { color: colors.textMuted }]}>{day.day}</Text>
                    </View>
                  );
                })}
              </View>
              {/* Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Phishing</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Scam</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Safe</Text>
                </View>
              </View>
            </View>
          ) : (
            <EmptyChartState
              icon="archive-outline"
              title="No Scan Data Available"
              description="Start scanning URLs and messages to see detection trends over time."
              actionText="Start Scanning"
              onAction={() => navigation.navigate('URL Scanner')}
            />
          )}
        </View>

        {/* Pie Chart - Threat Distribution */}
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundCard, borderColor: colors.borderLight }]}>
          <View style={styles.chartHeader}>
            <Ionicons name="pie-chart-outline" size={20} color="#667eea" />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Threat Distribution</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
              ({totalThreats} threats)
            </Text>
          </View>
          {totalThreats > 0 ? (
            <View style={styles.pieChartContainer}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.pieItem}>
                  <View style={[styles.pieColorDot, { backgroundColor: item.color }]} />
                  <View style={styles.pieItemContent}>
                    <Text style={[styles.pieItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.pieItemValue, { color: colors.textMuted }]}>
                      {item.value} ({item.percentage}%)
                    </Text>
                  </View>
                  <View style={[styles.pieBar, { backgroundColor: colors.backgroundInput }]}>
                    <View style={[styles.pieBarFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyChartState
              icon="pie-chart-outline"
              title="No Data to Display"
              description="No scans have been performed yet. Start scanning to see threat distribution."
              actionText="Start Scanning"
              onAction={() => navigation.navigate('Message Scanner')}
            />
          )}
        </View>
      </View>

      {/* Guest Mode Call to Action */}
      {!isAuthenticated && (
        <View style={[styles.guestCTA, { backgroundColor: colors.backgroundInput }]}>
          <View style={[styles.guestCTAIcon, { backgroundColor: 'rgba(102,126,234,0.12)' }]}>
            <Ionicons name="person-add-outline" size={28} color="#667eea" />
          </View>
          <Text style={[styles.guestCTATitle, { color: colors.text }]}>Want to save your scan history?</Text>
          <Text style={[styles.guestCTADescription, { color: colors.textMuted }]}>
            Create a free account to permanently save your scans, access them from any device, and unlock premium features.
          </Text>
          <TouchableOpacity 
            style={[styles.guestCTABtn, { backgroundColor: colors.primary[600] }]} 
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={styles.guestCTABtnText}>Sign Up Free</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Scans Table - Only shows for authenticated users */}
      {isAuthenticated ? (
        <View style={[styles.recentScansCard, { backgroundColor: colors.backgroundCard, borderColor: colors.borderLight }]}>
          <View style={styles.recentScansHeader}>
            <View style={styles.recentScansTitle}>
              <Ionicons name="time-outline" size={20} color="#667eea" />
              <Text style={[styles.recentScansTitleText, { color: colors.text }]}>Recent Security Scans</Text>
              <Text style={[styles.recentScansCount, { color: colors.textMuted }]}>
                ({stats.recentScans?.length || 0} total)
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.viewAllBtn, { backgroundColor: colors.primary[600] }]} 
              onPress={() => navigation.navigate('History')}
            >
              <Ionicons name="eye-outline" size={16} color="white" />
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Ionicons name="chevron-forward-outline" size={12} color="white" />
            </TouchableOpacity>
          </View>

          {stats.recentScans?.length > 0 ? (
            <View>
              {stats.recentScans.slice(0, 5).map((scan, index) => {
                const predColor = getPredColor(scan.prediction);
                const typeBadge = getTypeBadgeStyle(scan.type);
                const content = scan.content || "N/A";

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.recentScanItem, 
                      { 
                        backgroundColor: colors.backgroundSecondary, 
                        borderColor: colors.borderLight 
                      }
                    ]}
                    onPress={() => navigation.navigate('History')}
                  >
                    <View style={styles.recentScanLeft}>
                      <View style={styles.recentScanRef}>
                        <Ionicons name="pricetag-outline" size={10} color={colors.textMuted} />
                        <Text style={[styles.recentScanRefText, { color: colors.primary[600] }]}>
                          {scan.reference ? truncateText(scan.reference, 20) : "N/A"}
                        </Text>
                      </View>
                      <View style={styles.recentScanType}>
                        <View style={[styles.typeBadge, { backgroundColor: typeBadge.bg }]}>
                          <Ionicons name={typeBadge.icon} size={12} color={typeBadge.color} />
                          <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>
                            {typeBadge.label}
                          </Text>
                        </View>
                        <Text style={[styles.recentScanContent, { color: colors.text }]} numberOfLines={1}>
                          {truncateText(content, 50)}
                        </Text>
                      </View>
                      <View style={styles.recentScanFooter}>
                        <View style={[styles.recentScanPred, { backgroundColor: predColor.bg }]}>
                          <Text style={[styles.recentScanPredText, { color: predColor.color }]}>
                            {scan.prediction || "UNKNOWN"}
                          </Text>
                        </View>
                        <View style={styles.recentScanDate}>
                          <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
                          <Text style={[styles.recentScanDateText, { color: colors.textMuted }]}>
                            {formatDate(scan.date || scan.scannedAt || Date.now())}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyScans}>
              <View style={[styles.emptyScansIcon, { backgroundColor: 'rgba(102,126,234,0.08)' }]}>
                <Ionicons name="shield-outline" size={36} color="#94a3b8" />
              </View>
              <Text style={[styles.emptyScansTitle, { color: colors.text }]}>No Scans Yet</Text>
              <Text style={[styles.emptyScansDescription, { color: colors.textMuted }]}>
                Start scanning URLs or messages to see results here.
              </Text>
              <TouchableOpacity 
                style={[styles.emptyScansBtn, { backgroundColor: colors.primary[600] }]} 
                onPress={() => navigation.navigate('URL Scanner')}
              >
                <Text style={styles.emptyScansBtnText}>Start Scanning</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
        onSuccess={() => {
          setShowAuthModal(false);
          fetchDashboardStats();
        }}
      />

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
  animatedBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
  circle: { position: 'absolute', borderRadius: 999 },
  circle1: { width: 300, height: 300, top: -150, left: -150 },
  circle2: { width: 200, height: 200, bottom: -100, right: -100 },
  circle3: { width: 150, height: 150, top: '50%', left: '50%' },
  welcomeSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  welcomeSubtitle: { fontSize: 13, lineHeight: 18 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: 10 },
  spinning: { transform: [{ rotate: '360deg' }] },
  guestBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, alignSelf: 'flex-start' },
  guestBadgeText: { fontSize: 12 },
  authErrorBadge: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, flexWrap: 'wrap' },
  authErrorText: { fontSize: 12, color: '#dc2626', flex: 1 },
  authErrorLink: { fontSize: 12, fontWeight: '600', color: '#667eea' },
  heroSection: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 20, overflow: 'hidden' },
  heroBackgroundDecor: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroDecorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroContent: { position: 'relative', zIndex: 1 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 100 },
  heroBadgeLive: { backgroundColor: 'rgba(16,185,129,0.25)' },
  heroBadgeText: { fontSize: 10, fontWeight: '600', color: 'white', letterSpacing: 0.3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 4 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 6, lineHeight: 26 },
  heroDescription: { fontSize: 13, color: 'rgba(255,255,255,0.9)', maxWidth: 400, lineHeight: 20, marginBottom: 14 },
  heroButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  heroBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  heroBtnPrimaryText: { fontSize: 13, fontWeight: '600' },
  heroBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: 'white' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, minWidth: (width - 52) / 2, padding: 14, borderRadius: 16, borderWidth: 1, position: 'relative' },
  lockedBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  lockedBadgeText: { fontSize: 8, fontWeight: '600' },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 1 },
  statLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  statSubtitle: { fontSize: 10, marginTop: 2 },
  statTrend: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  chartsRow: { paddingHorizontal: 16, gap: 14, marginBottom: 20 },
  chartCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  chartTitle: { fontSize: 15, fontWeight: '700' },
  chartSubtitle: { fontSize: 11, fontWeight: '400' },
  weeklyChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100, paddingBottom: 4 },
  weekDayContainer: { alignItems: 'center', flex: 1 },
  weekDayBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 },
  weekBar: { width: 5, borderRadius: 2, minHeight: 2 },
  weekDayLabel: { fontSize: 9, marginTop: 4 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10 },
  emptyChartState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 16 },
  emptyChartIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyChartTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptyChartDescription: { fontSize: 12, textAlign: 'center', maxWidth: 260, marginBottom: 12 },
  emptyChartBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  emptyChartBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  pieChartContainer: { gap: 10, paddingVertical: 6 },
  pieItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pieColorDot: { width: 12, height: 12, borderRadius: 6 },
  pieItemContent: { flex: 1 },
  pieItemName: { fontSize: 13, fontWeight: '500' },
  pieItemValue: { fontSize: 11 },
  pieBar: { flex: 1, height: 5, borderRadius: 2.5, overflow: 'hidden', marginLeft: 4 },
  pieBarFill: { height: '100%', borderRadius: 2.5 },
  guestCTA: { marginHorizontal: 16, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  guestCTAIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  guestCTATitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  guestCTADescription: { fontSize: 13, textAlign: 'center', maxWidth: 400, marginBottom: 14, lineHeight: 18 },
  guestCTABtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  guestCTABtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  recentScansCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  recentScansHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  recentScansTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentScansTitleText: { fontSize: 15, fontWeight: '700' },
  recentScansCount: { fontSize: 12, fontWeight: '400' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewAllBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },
  recentScanItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  recentScanLeft: { flex: 1, gap: 4 },
  recentScanRef: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  recentScanRefText: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
  recentScanType: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 8, fontWeight: '600' },
  recentScanContent: { fontSize: 13, fontWeight: '500', flex: 1 },
  recentScanFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  recentScanPred: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  recentScanPredText: { fontSize: 9, fontWeight: '600' },
  recentScanDate: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recentScanDateText: { fontSize: 9 },
  emptyScans: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 16 },
  emptyScansIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyScansTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptyScansDescription: { fontSize: 12, textAlign: 'center', maxWidth: 280, marginBottom: 12 },
  emptyScansBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  emptyScansBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
});

export default DashboardScreen;