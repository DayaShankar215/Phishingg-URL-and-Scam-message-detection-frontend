import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getDashboardStats } from '../services/api';
import Colors from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

const StatCard = ({ title, value, icon, color, trend }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
    {trend && <Text style={[styles.statTrend, { color: trend >= 0 ? Colors.success : Colors.danger }]}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week</Text>}
  </View>
);

export default function DashboardScreen() {
  const [stats, setStats] = useState({ totalScans: 0, phishingDetected: 0, scamMessages: 0, safeDetections: 0, recentScans: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSubtitle}>Your security dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Scans" value={stats.totalScans} icon="shield-outline" color={Colors.primary[600]} trend={12} />
        <StatCard title="Phishing URLs" value={stats.phishingDetected} icon="warning-outline" color={Colors.danger} trend={-5} />
        <StatCard title="Scam Messages" value={stats.scamMessages} icon="chatbubble-outline" color={Colors.warning} trend={8} />
        <StatCard title="Safe Detections" value={stats.safeDetections} icon="checkmark-circle-outline" color={Colors.success} trend={15} />
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {stats.recentScans.length === 0 ? (
          <View style={styles.emptyState}><Ionicons name="scan-outline" size={48} color="#cbd5e1" /><Text style={styles.emptyText}>No scans yet</Text></View>
        ) : (
          stats.recentScans.map((scan, index) => (
            <View key={index} style={styles.scanItem}>
              <View style={styles.scanHeader}>
                <Text style={[styles.typeBadge, scan.type === 'url' ? styles.urlBadge : styles.messageBadge]}>{scan.type === 'url' ? 'URL' : 'Message'}</Text>
                <Text style={styles.scanDate}>{formatDate(scan.date)}</Text>
              </View>
              <Text style={styles.scanContent} numberOfLines={2}>{scan.content}</Text>
              <View style={styles.riskContainer}>
                <View style={styles.riskBar}><View style={[styles.riskFill, { width: `${scan.riskScore}%`, backgroundColor: scan.riskScore > 70 ? Colors.danger : scan.riskScore > 30 ? Colors.warning : Colors.success }]} /></View>
                <Text style={styles.riskScore}>{scan.riskScore}%</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light },
  header: { padding: 20, paddingTop: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  welcomeSubtitle: { fontSize: 16, color: Colors.gray },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  statLabel: { fontSize: 12, color: Colors.gray, textTransform: 'uppercase', fontWeight: '500' },
  statTrend: { fontSize: 11, marginTop: 8 },
  recentSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark, marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 16 },
  emptyText: { color: '#94a3b8', marginTop: 12 },
  scanItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  urlBadge: { backgroundColor: '#e3f2fd', color: '#1976d2' },
  messageBadge: { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
  scanDate: { fontSize: 12, color: Colors.gray },
  scanContent: { fontSize: 14, color: Colors.dark, marginBottom: 12 },
  riskContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riskBar: { flex: 1, height: 6, backgroundColor: Colors.lightGray, borderRadius: 3, overflow: 'hidden' },
  riskFill: { height: '100%', borderRadius: 3 },
  riskScore: { fontSize: 12, fontWeight: '600', minWidth: 40 },
});