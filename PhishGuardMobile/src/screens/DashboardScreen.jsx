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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGuest } from '../context/GuestContext';
import { getColors } from '../constants/colors';
import { getScanHistory } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthModal from '../components/AuthModal';
import { showToast } from '../components/Toaster';
import { formatDate, truncateText } from '../utils/formatters';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
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

  useEffect(() => {
    fetchDashboardStats();
  }, [isAuthenticated]);

  const getResultFromPrediction = (prediction) => {
    switch (prediction?.toUpperCase()) {
      case 'PHISHING':
      case 'DANGEROUS':
      case 'MALICIOUS':
        return 'phishing';
      case 'SCAM':
      case 'SUSPICIOUS':
      case 'WARNING':
        return 'suspicious';
      case 'SAFE':
      case 'LEGITIMATE':
        return 'safe';
      default:
        return 'unknown';
    }
  };

  const generateWeeklyDataFromScans = (scans) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayMap = {};

    days.forEach((day, index) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - index));
      const dateStr = d.toISOString().split('T')[0];
      dayMap[dateStr] = { day, phishing: 0, scam: 0, safe: 0, date: dateStr };
    });

    scans.forEach((scan) => {
      if (!scan.scannedAt) return;
      const scanDate = new Date(scan.scannedAt);
      const dateStr = scanDate.toISOString().split('T')[0];

      if (dayMap[dateStr]) {
        const prediction = scan.prediction?.toUpperCase() || '';
        if (
          prediction === 'PHISHING' ||
          prediction === 'DANGEROUS' ||
          prediction === 'MALICIOUS'
        ) {
          dayMap[dateStr].phishing += 1;
        } else if (
          prediction === 'SCAM' ||
          prediction === 'SUSPICIOUS' ||
          prediction === 'WARNING'
        ) {
          dayMap[dateStr].scam += 1;
        } else if (prediction === 'SAFE' || prediction === 'LEGITIMATE') {
          dayMap[dateStr].safe += 1;
        }
      }
    });

    const result = Object.values(dayMap);
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  };

  const generateEmptyWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
        const phishingDetected = allScans.filter(
          (s) =>
            s.prediction?.toUpperCase() === 'PHISHING' ||
            s.prediction?.toUpperCase() === 'DANGEROUS' ||
            s.prediction?.toUpperCase() === 'MALICIOUS'
        ).length;

        const scamMessages = allScans.filter(
          (s) =>
            s.prediction?.toUpperCase() === 'SCAM' ||
            s.prediction?.toUpperCase() === 'SUSPICIOUS'
        ).length;

        const safeDetections = allScans.filter(
          (s) =>
            s.prediction?.toUpperCase() === 'SAFE' ||
            s.prediction?.toUpperCase() === 'LEGITIMATE'
        ).length;

        const recentScans = allScans.slice(0, 5).map((scan) => ({
          reference: scan.reference,
          content: scan.url,
          type: 'url',
          result: getResultFromPrediction(scan.prediction),
          date: scan.scannedAt,
          prediction: scan.prediction || 'UNKNOWN',
        }));

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
        console.log('👤 Guest mode - showing empty stats');
        setStats({
          totalScans: 0,
          phishingDetected: 0,
          scamMessages: 0,
          safeDetections: 0,
          recentScans: [],
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
    showToast('Dashboard refreshed!', 'success');
  };

  const weeklyData = stats.weeklyData.length > 0 ? stats.weeklyData : generateEmptyWeeklyData();
  const hasData = stats.totalScans > 0;
  const hasWeeklyData = weeklyData.some((d) => d.phishing > 0 || d.scam > 0 || d.safe > 0);
  
  // ✅ FIX: Total threats should NOT include safe detections
  const totalThreats = stats.phishingDetected + stats.scamMessages;

  const pieData = [
    {
      name: 'Phishing URLs',
      value: stats.phishingDetected,
      color: '#ef4444',
      percentage: totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0,
    },
    {
      name: 'Scam Messages',
      value: stats.scamMessages,
      color: '#f59e0b',
      percentage: totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0,
    },
    {
      name: 'Safe',
      value: stats.safeDetections,
      color: '#10b981',
      percentage: stats.totalScans > 0 ? ((stats.safeDetections / stats.totalScans) * 100).toFixed(1) : 0,
    },
  ];

  // ✅ FIX: Use LinearGradient for stat icons
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
        <View style={styles.lockedBadge}>
          <Ionicons name="person-add-outline" size={10} color="#64748b" />
          <Text style={styles.lockedBadgeText}>Sign in</Text>
        </View>
      )}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.statIcon, { borderRadius: 14 }]}
      >
        <Ionicons name={icon} size={28} color="white" />
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      {trend !== undefined && trend !== null && (
        <View style={[styles.statTrend, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
          <Ionicons name={trend >= 0 ? 'arrow-up-outline' : 'arrow-down-outline'} size={12} color={trend >= 0 ? '#10b981' : '#ef4444'} />
          <Text style={{ color: trend >= 0 ? '#10b981' : '#ef4444', fontSize: 12 }}>
            {Math.abs(trend)}% from last week
          </Text>
        </View>
      )}
    </View>
  );

  const EmptyChartState = ({ icon, title, description, actionText, onAction }) => (
    <View style={styles.emptyChartState}>
      <View style={styles.emptyChartIcon}>
        <Ionicons name={icon} size={36} color="#94a3b8" />
      </View>
      <Text style={[styles.emptyChartTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyChartDescription, { color: colors.textMuted }]}>{description}</Text>
      {onAction && (
        <TouchableOpacity style={[styles.emptyChartBtn, { backgroundColor: colors.primary[600] }]} onPress={onAction}>
          <Text style={styles.emptyChartBtnText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getPredictionColor = (prediction) => {
    switch (prediction?.toUpperCase()) {
      case 'PHISHING': return { bg: '#fee2e2', color: '#dc2626' };
      case 'SCAM': return { bg: '#fef3c7', color: '#d97706' };
      case 'SUSPICIOUS': return { bg: '#fef3c7', color: '#d97706' };
      case 'SAFE': return { bg: '#d1fae5', color: '#065f46' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
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
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              {isAuthenticated ? `Welcome back, ${user?.firstName || 'User'}!` : 'Welcome to SecureShield'}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textMuted }]}>
              {isAuthenticated
                ? 'Your AI-Powered Security Guardian • Real-time Protection Against Cyber Threats'
                : 'Start scanning URLs and messages instantly • No account required'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: colors.border, opacity: refreshing ? 0.6 : 1 }]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.textMuted} style={refreshing ? styles.spinning : null} />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
        {!isAuthenticated && (
          <View style={[styles.guestBadge, { backgroundColor: colors.backgroundInput }]}>
            <Text style={[styles.guestBadgeText, { color: colors.textMuted }]}>
              👋 Guest mode • Sign up to save your scan history
            </Text>
          </View>
        )}
      </View>

      {/* Hero CTA Section */}
      <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🛡️ AI-POWERED THREAT DETECTION</Text>
            </View>
            <View style={[styles.heroBadge, styles.heroBadgeLive]}>
              <View style={styles.liveDot} />
              <Text style={[styles.heroBadgeText, { color: '#10b981' }]}>
                {isAuthenticated ? 'PROTECTED' : 'GUEST MODE'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Check before you click or reply.</Text>
          <Text style={styles.heroDescription}>
            Scan suspicious URLs and messages in seconds with clear risk explanations.
          </Text>
        </View>
        <View style={styles.heroButtons}>
          <TouchableOpacity style={[styles.heroBtnPrimary, { backgroundColor: 'white' }]} onPress={() => navigation.navigate('URL Scanner')}>
            <Ionicons name="link-outline" size={18} color="#667eea" />
            <Text style={[styles.heroBtnPrimaryText, { color: '#667eea' }]}>Scan URL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.heroBtnSecondary, { borderColor: 'rgba(255,255,255,0.3)' }]} onPress={() => navigation.navigate('Message Scanner')}>
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
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          trend={hasData ? 12 : 0}
          subtitle={isAuthenticated ? 'All time scans' : 'Session scans'}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Phishing URLs"
          value={stats.phishingDetected}
          icon="warning-outline"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          trend={hasData ? -5 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.phishingDetected / totalThreats) * 100).toFixed(1) : 0}% of threats`}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Scam Messages"
          value={stats.scamMessages}
          icon="chatbubble-outline"
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          trend={hasData ? 8 : 0}
          subtitle={`${totalThreats > 0 ? ((stats.scamMessages / totalThreats) * 100).toFixed(1) : 0}% of threats`}
          locked={!isAuthenticated}
        />
        <StatCard
          title="Safe Detections"
          value={stats.safeDetections}
          icon="checkmark-circle-outline"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          trend={hasData ? 15 : 0}
          subtitle={`${stats.totalScans > 0 ? ((stats.safeDetections / stats.totalScans) * 100).toFixed(1) : 0}% of total`}
          locked={!isAuthenticated}
        />
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Weekly Trends Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.chartHeader}>
            <Ionicons name="stats-chart-outline" size={20} color="#667eea" />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Detection Trends</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>(Last 7 days)</Text>
          </View>
          {hasWeeklyData ? (
            <View style={styles.weeklyChart}>
              {weeklyData.map((day, index) => (
                <View key={index} style={styles.weekDayContainer}>
                  <View style={styles.weekDayBars}>
                    {day.phishing > 0 && <View style={[styles.weekBar, { height: Math.min(day.phishing * 20, 80), backgroundColor: '#ef4444' }]} />}
                    {day.scam > 0 && <View style={[styles.weekBar, { height: Math.min(day.scam * 20, 80), backgroundColor: '#f59e0b' }]} />}
                    {day.safe > 0 && <View style={[styles.weekBar, { height: Math.min(day.safe * 20, 80), backgroundColor: '#10b981' }]} />}
                  </View>
                  <Text style={[styles.weekDayLabel, { color: colors.textMuted }]}>{day.day}</Text>
                </View>
              ))}
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

        {/* Threat Distribution */}
        <View style={[styles.chartCard, { backgroundColor: colors.backgroundCard }]}>
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
      {!isAuthenticated && hasData && (
        <View style={[styles.guestCTA, { backgroundColor: colors.backgroundInput }]}>
          <View style={styles.guestCTAIcon}>
            <Ionicons name="person-add-outline" size={28} color="#667eea" />
          </View>
          <Text style={[styles.guestCTATitle, { color: colors.text }]}>Want to save your scan history?</Text>
          <Text style={[styles.guestCTADescription, { color: colors.textMuted }]}>
            Create a free account to permanently save your scans, access them from any device.
          </Text>
          <TouchableOpacity style={[styles.guestCTABtn, { backgroundColor: colors.primary[600] }]} onPress={() => setShowAuthModal(true)}>
            <Text style={styles.guestCTABtnText}>Sign Up Free</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Scans Table */}
      <View style={[styles.recentScansCard, { backgroundColor: colors.backgroundCard }]}>
        <View style={styles.recentScansHeader}>
          <View style={styles.recentScansTitle}>
            <Ionicons name="time-outline" size={20} color="#667eea" />
            <Text style={[styles.recentScansTitleText, { color: colors.text }]}>Recent Security Scans</Text>
            <Text style={[styles.recentScansCount, { color: colors.textMuted }]}>
              ({stats.recentScans?.length || 0} total)
            </Text>
          </View>
          <TouchableOpacity style={[styles.viewAllBtn, { backgroundColor: colors.primary[600] }]} onPress={() => navigation.navigate('History')}>
            <Ionicons name="eye-outline" size={16} color="white" />
            <Text style={styles.viewAllBtnText}>View All</Text>
            <Ionicons name="chevron-forward-outline" size={12} color="white" />
          </TouchableOpacity>
        </View>

        {stats.recentScans?.length > 0 ? (
          <View>
            {stats.recentScans.slice(0, 5).map((scan, index) => {
              const predColor = getPredictionColor(scan.prediction);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.recentScanItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                  onPress={() => navigation.navigate('History')}
                >
                  <View style={styles.recentScanLeft}>
                    <View style={styles.recentScanRef}>
                      <Ionicons name="pricetag-outline" size={10} color={colors.textMuted} />
                      <Text style={[styles.recentScanRefText, { color: colors.primary[600] }]}>
                        {scan.reference ? truncateText(scan.reference, 20) : 'N/A'}
                      </Text>
                    </View>
                    <Text style={[styles.recentScanContent, { color: colors.text }]} numberOfLines={1}>
                      {scan.content || 'N/A'}
                    </Text>
                    <View style={styles.recentScanFooter}>
                      <View style={[styles.recentScanPred, { backgroundColor: predColor.bg }]}>
                        <Text style={[styles.recentScanPredText, { color: predColor.color }]}>
                          {scan.prediction || 'UNKNOWN'}
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
            <View style={styles.emptyScansIcon}>
              <Ionicons name="shield-outline" size={36} color="#94a3b8" />
            </View>
            <Text style={[styles.emptyScansTitle, { color: colors.text }]}>No Scans Yet</Text>
            <Text style={[styles.emptyScansDescription, { color: colors.textMuted }]}>
              Start scanning URLs or messages to see results here.
            </Text>
            <TouchableOpacity style={[styles.emptyScansBtn, { backgroundColor: colors.primary[600] }]} onPress={() => navigation.navigate('URL Scanner')}>
              <Text style={styles.emptyScansBtnText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(102,126,234,0.05)' },
  circle1: { width: 300, height: 300, top: -150, left: -150 },
  circle2: { width: 200, height: 200, bottom: -100, right: -100 },
  circle3: { width: 150, height: 150, top: '50%', left: '50%' },
  welcomeSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, lineHeight: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: 12 },
  spinning: { transform: [{ rotate: '360deg' }] },
  guestBadge: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, alignSelf: 'flex-start' },
  guestBadgeText: { fontSize: 13 },
  heroSection: { marginHorizontal: 16, borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' },
  heroContent: { position: 'relative', zIndex: 1 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 100 },
  heroBadgeLive: { backgroundColor: 'rgba(16,185,129,0.25)' },
  heroBadgeText: { fontSize: 11, fontWeight: '600', color: 'white', letterSpacing: 0.5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 4 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 8, lineHeight: 30 },
  heroDescription: { fontSize: 15, color: 'rgba(255,255,255,0.9)', maxWidth: 400, lineHeight: 22, marginBottom: 16 },
  heroButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  heroBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  heroBtnPrimaryText: { fontSize: 15, fontWeight: '600' },
  heroBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: 'white' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: (width - 56) / 2, padding: 16, borderRadius: 20, borderWidth: 1, position: 'relative' },
  lockedBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedBadgeText: { fontSize: 9, fontWeight: '600', color: '#64748b' },
  statIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  statSubtitle: { fontSize: 11, marginTop: 2 },
  statTrend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  chartsContainer: { paddingHorizontal: 16, gap: 16, marginBottom: 24 },
  chartCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chartTitle: { fontSize: 16, fontWeight: '700' },
  chartSubtitle: { fontSize: 12, fontWeight: '400' },
  weeklyChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, paddingBottom: 4 },
  weekDayContainer: { alignItems: 'center', flex: 1 },
  weekDayBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 90 },
  weekBar: { width: 6, borderRadius: 3, minHeight: 2 },
  weekDayLabel: { fontSize: 10, marginTop: 4 },
  emptyChartState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyChartIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(102,126,234,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyChartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptyChartDescription: { fontSize: 13, textAlign: 'center', maxWidth: 280, marginBottom: 16 },
  emptyChartBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyChartBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  pieChartContainer: { gap: 12, paddingVertical: 8 },
  pieItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pieColorDot: { width: 14, height: 14, borderRadius: 7 },
  pieItemContent: { flex: 1 },
  pieItemName: { fontSize: 14, fontWeight: '500' },
  pieItemValue: { fontSize: 12 },
  pieBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginLeft: 4 },
  pieBarFill: { height: '100%', borderRadius: 3 },
  guestCTA: { marginHorizontal: 16, padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 24 },
  guestCTAIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(102,126,234,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  guestCTATitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  guestCTADescription: { fontSize: 14, textAlign: 'center', maxWidth: 400, marginBottom: 16, lineHeight: 20 },
  guestCTABtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  guestCTABtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  recentScansCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  recentScansHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  recentScansTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentScansTitleText: { fontSize: 16, fontWeight: '700' },
  recentScansCount: { fontSize: 13, fontWeight: '400' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  viewAllBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  recentScanItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  recentScanLeft: { flex: 1, gap: 6 },
  recentScanRef: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentScanRefText: { fontSize: 12, fontWeight: '600', fontFamily: 'monospace' },
  recentScanContent: { fontSize: 14, fontWeight: '500' },
  recentScanFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  recentScanPred: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  recentScanPredText: { fontSize: 10, fontWeight: '600' },
  recentScanDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentScanDateText: { fontSize: 10 },
  emptyScans: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyScansIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(102,126,234,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyScansTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptyScansDescription: { fontSize: 13, textAlign: 'center', maxWidth: 320, marginBottom: 16 },
  emptyScansBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyScansBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
});

export default DashboardScreen;