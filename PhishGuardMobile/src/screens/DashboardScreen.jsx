import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, Linking 
} from 'react-native';
import { getDashboardStats } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StatCard = ({ title, value, icon, color, trend, colors }) => (
  <View style={[styles.statCard, { 
    backgroundColor: colors.backgroundCard,
    shadowColor: colors.shadow,
  }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
    {trend && (
      <Text style={[styles.statTrend, { color: trend >= 0 ? colors.success : colors.danger }]}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
      </Text>
    )}
  </View>
);

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [stats, setStats] = useState({ 
    totalScans: 0, 
    phishingDetected: 0, 
    scamMessages: 0, 
    safeDetections: 0, 
    recentScans: [] 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Animated Background Circles */}
      <View style={styles.bgCircles}>
        <View style={[styles.circle, styles.circle1, { backgroundColor: colors.primary[600] + '08' }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: colors.primary[600] + '08' }]} />
        <View style={[styles.circle, styles.circle3, { backgroundColor: colors.primary[600] + '08' }]} />
      </View>

      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome to PhishGuard</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Your AI-Powered Security Guardian • Real-time Protection
        </Text>
      </View>

      {/* Hero CTA Section */}
      <View style={[styles.heroContainer, { backgroundColor: colors.primary[600] }]}>
        <View style={styles.heroBadges}>
          <View style={[styles.badgeAi, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.badgeAiText}>🛡️ AI-POWERED</Text>
          </View>
          <View style={[styles.badgeLive, { backgroundColor: 'rgba(16,185,129,0.25)' }]}>
            <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
            <Text style={styles.badgeLiveText}>LIVE PROTECTION</Text>
          </View>
        </View>
        
        <Text style={styles.heroTitle}>Check before you click or reply.</Text>
        <Text style={styles.heroSubtitle}>
          Scan suspicious URLs and messages in seconds with clear risk explanations.
        </Text>
        
        <View style={styles.heroButtons}>
          <TouchableOpacity 
            style={[styles.btnScanUrl, { backgroundColor: 'white' }]}
            onPress={() => navigation.navigate('URL Scanner')}
            activeOpacity={0.8}
          >
            <Ionicons name="link-outline" size={20} color={colors.primary[600]} />
            <Text style={[styles.btnScanUrlText, { color: colors.primary[600] }]}>Scan URL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.btnScanMessage, { 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderColor: 'rgba(255,255,255,0.3)' 
            }]}
            onPress={() => navigation.navigate('Message Scanner')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.btnScanMessageText}>Scan Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Scans" 
          value={stats.totalScans} 
          icon="shield-outline" 
          color={colors.primary[600]} 
          trend={12}
          colors={colors}
        />
        <StatCard 
          title="Phishing URLs" 
          value={stats.phishingDetected} 
          icon="warning-outline" 
          color={colors.danger} 
          trend={-5}
          colors={colors}
        />
        <StatCard 
          title="Scam Messages" 
          value={stats.scamMessages} 
          icon="chatbubble-outline" 
          color={colors.warning} 
          trend={8}
          colors={colors}
        />
        <StatCard 
          title="Safe Detections" 
          value={stats.safeDetections} 
          icon="checkmark-circle-outline" 
          color={colors.success} 
          trend={15}
          colors={colors}
        />
      </View>

      {/* Recent Scans Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Security Scans</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={[styles.viewAllText, { color: colors.primary[600] }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {stats.recentScans.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundCard }]}>
            <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No scans yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Start scanning URLs or messages</Text>
          </View>
        ) : (
          stats.recentScans.slice(0, 5).map((scan, index) => (
            <View key={index} style={[styles.scanItem, { 
              backgroundColor: colors.backgroundCard,
              shadowColor: colors.shadow,
            }]}>
              <View style={styles.scanHeader}>
                <Text style={[styles.typeBadge, scan.type === 'url' ? styles.urlBadge : styles.messageBadge]}>
                  {scan.type === 'url' ? '🔗 URL' : '💬 Message'}
                </Text>
                <Text style={[styles.scanDate, { color: colors.textMuted }]}>{formatDate(scan.date)}</Text>
              </View>
              <Text style={[styles.scanContent, { color: colors.text }]} numberOfLines={2}>{scan.content}</Text>
              <View style={styles.riskContainer}>
                <View style={[styles.riskBar, { backgroundColor: colors.borderLight }]}>
                  <View style={[
                    styles.riskFill, 
                    { 
                      width: `${scan.riskScore}%`, 
                      backgroundColor: scan.riskScore > 70 ? colors.danger : scan.riskScore > 30 ? colors.warning : colors.success 
                    }
                  ]} />
                </View>
                <Text style={[styles.riskScore, { color: colors.text }]}>{scan.riskScore}%</Text>
              </View>
              <View style={styles.scanStatus}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: scan.result === 'safe' ? colors.success : colors.danger }
                ]} />
                <Text style={[
                  styles.statusText, 
                  { color: scan.result === 'safe' ? colors.success : colors.danger }
                ]}>
                  {scan.result === 'safe' ? '✅ Safe' : scan.result === 'phishing' ? '⚠️ Phishing' : '⚠️ Scam'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Animated Background Circles
  bgCircles: { position: 'absolute', width: '100%', height: '100%' },
  circle: { position: 'absolute', borderRadius: 999 },
  circle1: { width: 200, height: 200, top: -50, right: -50 },
  circle2: { width: 150, height: 150, bottom: 100, left: -50 },
  circle3: { width: 120, height: 120, top: '40%', left: '30%' },

  // Welcome Section
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, lineHeight: 20 },

  // Hero CTA Section
  heroContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  badgeAi: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 100,
  },
  badgeAiText: { fontSize: 10, fontWeight: '600', color: 'white', letterSpacing: 0.5 },
  badgeLive: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 100,
  },
  pulseDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4,
  },
  badgeLiveText: { fontSize: 10, fontWeight: '600', color: 'white' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginBottom: 8, lineHeight: 28 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20, lineHeight: 20 },
  heroButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  btnScanUrl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  btnScanUrlText: { fontSize: 14, fontWeight: '600' },
  btnScanMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnScanMessageText: { fontSize: 14, fontWeight: '600', color: 'white' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  statCard: { 
    flex: 1, 
    minWidth: '45%', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '500' },
  statTrend: { fontSize: 11, marginTop: 8 },

  // Recent Scans
  recentSection: { padding: 20 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  viewAllText: { fontSize: 14, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 16 },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  emptySubText: { fontSize: 14, marginTop: 4 },
  scanItem: { 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  urlBadge: { backgroundColor: '#e3f2fd', color: '#1976d2' },
  messageBadge: { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
  scanDate: { fontSize: 12 },
  scanContent: { fontSize: 14, marginBottom: 12 },
  riskContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  riskBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  riskFill: { height: '100%', borderRadius: 3 },
  riskScore: { fontSize: 12, fontWeight: '600', minWidth: 40 },
  scanStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '500' },
});