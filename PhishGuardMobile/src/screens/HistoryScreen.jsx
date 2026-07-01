import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { getScanHistory, getScanById } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import RiskBadge from '../components/RiskBadge';

export default function HistoryScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedScan, setSelectedScan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, url: 0, message: 0, avgRisk: 0 });

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getScanHistory(filter === 'all' ? null : filter);
      setScans(data);
      calculateStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const calculateStats = (data) => {
    const total = data.length;
    const url = data.filter(s => s.type === 'url').length;
    const message = data.filter(s => s.type === 'message').length;
    const avgRisk = total > 0 ? data.reduce((sum, s) => sum + s.riskScore, 0) / total : 0;
    setStats({ total, url, message, avgRisk });
  };

  const onRefresh = () => { setRefreshing(true); fetchHistory(); };

  const viewDetails = async (id, type) => {
    try {
      const scan = await getScanById(id, type);
      setSelectedScan(scan);
      setModalVisible(true);
    } catch (error) { console.error(error); }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats Bar */}
      <View style={[styles.statsBar, { 
        backgroundColor: colors.backgroundCard,
        shadowColor: colors.shadow,
      }]}>
        <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text></View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.text }]}>{stats.url}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>URLs</Text></View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.text }]}>{stats.message}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>Messages</Text></View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.text }]}>{stats.avgRisk.toFixed(0)}%</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Risk</Text></View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'url', 'message'].map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[
              styles.filterTab, 
              filter === f && [styles.filterTabActive, { backgroundColor: colors.primary[600] }],
              { backgroundColor: filter === f ? colors.primary[600] : colors.backgroundInput }
            ]} 
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText, 
              filter === f && styles.filterTextActive,
              { color: filter === f ? 'white' : colors.textMuted }
            ]}>
              {f === 'all' ? 'All' : f === 'url' ? 'URLs' : 'Messages'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scans List */}
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} 
        showsVerticalScrollIndicator={false}
      >
        {scans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No scans yet</Text>
          </View>
        ) : (
          scans.map((scan) => (
            <TouchableOpacity 
              key={scan.id} 
              style={[styles.scanCard, { 
                backgroundColor: colors.backgroundCard,
                shadowColor: colors.shadow,
              }]} 
              onPress={() => viewDetails(scan.id, scan.type)}
            >
              <View style={styles.scanHeader}>
                <Text style={[styles.scanId, { color: colors.primary[600] }]}>#{scan.id}</Text>
                <Text style={[styles.typeBadge, scan.type === 'url' ? styles.urlBadge : styles.messageBadge]}>
                  {scan.type === 'url' ? 'URL' : 'Message'}
                </Text>
              </View>
              <Text style={[styles.scanContent, { color: colors.text }]} numberOfLines={2}>{scan.content}</Text>
              <View style={styles.scanFooter}>
                <RiskBadge score={scan.riskScore} size="small" />
                <Text style={[styles.scanDate, { color: colors.textMuted }]}>{formatDate(scan.date)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Details Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
          }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Scan Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Content</Text>
              <Text style={[styles.modalText, { color: colors.text }]}>{selectedScan?.content}</Text>
              <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Result</Text>
              <RiskBadge score={selectedScan?.riskScore} size="medium" />
              <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 16 }]}>Explanation</Text>
              <Text style={[styles.modalText, { color: colors.text }]}>{selectedScan?.explanation}</Text>
              <Text style={[styles.modalLabel, { color: colors.textMuted, marginTop: 16 }]}>Date & Time</Text>
              <Text style={[styles.modalText, { color: colors.text }]}>{formatDate(selectedScan?.date)}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12 },
  statsBar: { 
    flexDirection: 'row', 
    paddingVertical: 16, 
    marginHorizontal: 16, 
    marginTop: 16, 
    borderRadius: 16, 
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 30 },
  filterTabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 12 },
  filterTab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 10,
  },
  filterText: { fontWeight: '500' },
  filterTextActive: { color: 'white' },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { marginTop: 16, fontSize: 16 },
  scanCard: { 
    borderRadius: 16, 
    padding: 16, 
    marginHorizontal: 16, 
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scanId: { fontSize: 14, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  urlBadge: { backgroundColor: '#e3f2fd', color: '#1976d2' },
  messageBadge: { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
  scanContent: { fontSize: 14, marginBottom: 12 },
  scanFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanDate: { fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    borderRadius: 24, 
    width: '90%', 
    maxHeight: '80%',
    borderWidth: 1,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalText: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
});