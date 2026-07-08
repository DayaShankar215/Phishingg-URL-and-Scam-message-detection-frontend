// screens/DashboardScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, Dimensions, Alert 
} from 'react-native';
import { getDashboardStats } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, trend, colors, subtitle }) => (
  <View style={[styles.statCard, { 
    backgroundColor: colors.backgroundCard,
    borderColor: colors.borderLight,
  }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
    {subtitle && (
      <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
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
      console.error('Dashboard Error:', error);
      Alert.alert('Connection Error', error.message || 'Failed to load dashboard statistics');
      // Set default values
      setStats({ 
        totalScans: 0, 
        phishingDetected: 0, 
        scamMessages: 0, 
        safeDetections: 0, 
        recentScans: [] 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return 'N/A';
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>Welcome back!</Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.headerBadgeText}>LIVE</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Scans" 
          value={stats.totalScans || 0} 
          icon="scan-outline" 
          color={colors.primary[600]} 
          colors={colors}
          subtitle="All time"
        />
        <StatCard 
          title="Phishing URLs" 
          value={stats.phishingDetected || 0} 
          icon="warning-outline" 
          color={colors.danger} 
          colors={colors}
          subtitle="Detected"
        />
        <StatCard 
          title="Scam Messages" 
          value={stats.scamMessages || 0} 
          icon="chatbubble-outline" 
          color={colors.warning} 
          colors={colors}
          subtitle="Blocked"
        />
        <StatCard 
          title="Safe Detections" 
          value={stats.safeDetections || 0} 
          icon="checkmark-circle-outline" 
          color={colors.success} 
          colors={colors}
          subtitle="Verified"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionCard, { 
              backgroundColor: colors.backgroundCard,
              borderColor: colors.borderLight,
            }]}
            onPress={() => navigation.navigate('URL Scanner')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary[600] + '20' }]}>
              <Ionicons name="link-outline" size={28} color={colors.primary[600]} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Scan URL</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>Check suspicious links</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { 
              backgroundColor: colors.backgroundCard,
              borderColor: colors.borderLight,
            }]}
            onPress={() => navigation.navigate('Message Scanner')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f5576c20' }]}>
              <Ionicons name="chatbubble-outline" size={28} color="#f5576c" />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Scan Message</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>Detect scam texts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Scans Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={[styles.viewAllText, { color: colors.primary[600] }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {!stats.recentScans || stats.recentScans.length === 0 ? (
          <View style={[styles.emptyState, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderLight,
          }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No scans yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Start scanning URLs or messages</Text>
          </View>
        ) : (
          stats.recentScans.slice(0, 5).map((scan, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.scanItem, { 
                backgroundColor: colors.backgroundCard,
                borderColor: colors.borderLight,
              }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('History')}
            >
              <View style={styles.scanLeft}>
                <View style={[styles.scanTypeIcon, { 
                  backgroundColor: scan.type === 'url' ? colors.primary[600] + '20' : '#f5576c20' 
                }]}>
                  <Ionicons 
                    name={scan.type === 'url' ? 'link-outline' : 'chatbubble-outline'} 
                    size={16} 
                    color={scan.type === 'url' ? colors.primary[600] : '#f5576c'} 
                  />
                </View>
                <View style={styles.scanInfo}>
                  <Text style={[styles.scanContent, { color: colors.text }]} numberOfLines={1}>
                    {scan.content || 'N/A'}
                  </Text>
                  <Text style={[styles.scanDate, { color: colors.textMuted }]}>{formatDate(scan.date)}</Text>
                </View>
              </View>
              <View style={styles.scanRight}>
                <View style={[styles.scanRiskBadge, {
                  backgroundColor: (scan.riskScore || 0) > 70 ? colors.danger + '20' : 
                                  (scan.riskScore || 0) > 30 ? colors.warning + '20' : 
                                  colors.success + '20',
                }]}>
                  <Text style={[styles.scanRiskText, {
                    color: (scan.riskScore || 0) > 70 ? colors.danger : 
                           (scan.riskScore || 0) > 30 ? colors.warning : 
                           colors.success,
                  }]}>
                    {scan.riskScore || 0}%
                  </Text>
                </View>
                <View style={[styles.scanStatusDot, {
                  backgroundColor: scan.result === 'safe' ? colors.success : colors.danger,
                }]} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: -10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  recentSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIconContainer: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 4,
  },
  scanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  scanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  scanTypeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanInfo: {
    flex: 1,
  },
  scanContent: {
    fontSize: 14,
    fontWeight: '500',
  },
  scanDate: {
    fontSize: 11,
    marginTop: 2,
  },
  scanRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanRiskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scanRiskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scanStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});