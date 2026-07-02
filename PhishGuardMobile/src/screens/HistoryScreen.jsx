import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  RefreshControl, Modal, ActivityIndicator, Dimensions, Alert 
} from 'react-native';
import { getScanHistory, getScanById, downloadAndSharePDF, generatePDFReport } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import RiskBadge from '../components/RiskBadge';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const StatItem = ({ value, label, icon, color, colors }) => (
  <View style={styles.statItem}>
    <View style={[styles.statIconSmall, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.statValueSmall, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabelSmall, { color: colors.textMuted }]}>{label}</Text>
  </View>
);

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
  const [downloading, setDownloading] = useState(false);

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

  const handleDownloadPDF = async (scan) => {
    if (!scan) return;
    
    setDownloading(true);
    try {
      try {
        await downloadAndSharePDF(scan.id, scan.type);
        Alert.alert('Success', 'PDF downloaded and ready to share!');
      } catch (err) {
        const fileUri = await generatePDFReport(scan, scan.type);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'Security Report',
          });
          Alert.alert('Success', 'Report generated and ready to share!');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
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
              <Ionicons name="time-outline" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>History</Text>
              <Text style={styles.headerSubtitle}>Your scan activity</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={onRefresh}
          >
            <Ionicons name="refresh-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { 
        backgroundColor: colors.backgroundCard,
        borderColor: colors.borderLight,
      }]}>
        <StatItem 
          value={stats.total} 
          label="Total" 
          icon="scan-outline" 
          color={colors.primary[600]} 
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem 
          value={stats.url} 
          label="URLs" 
          icon="link-outline" 
          color={colors.primary[600]} 
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem 
          value={stats.message} 
          label="Messages" 
          icon="chatbubble-outline" 
          color="#f5576c" 
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <StatItem 
          value={`${stats.avgRisk.toFixed(0)}%`} 
          label="Avg Risk" 
          icon="warning-outline" 
          color={colors.warning} 
          colors={colors}
        />
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
        contentContainerStyle={styles.scrollContent}
      >
        {scans.length === 0 ? (
          <View style={[styles.emptyState, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderLight,
          }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="time-outline" size={56} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No scans yet</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Your history will appear here</Text>
          </View>
        ) : (
          scans.map((scan) => (
            <TouchableOpacity 
              key={scan.id} 
              style={[styles.scanCard, { 
                backgroundColor: colors.backgroundCard,
                borderColor: colors.borderLight,
              }]} 
              onPress={() => viewDetails(scan.id, scan.type)}
              activeOpacity={0.7}
            >
              <View style={styles.scanHeader}>
                <View style={styles.scanIdContainer}>
                  <Text style={[styles.scanId, { color: colors.primary[600] }]}>#{scan.id}</Text>
                  <View style={[styles.typeBadge, 
                    scan.type === 'url' ? styles.urlBadge : styles.messageBadge
                  ]}>
                    <Ionicons 
                      name={scan.type === 'url' ? 'link-outline' : 'chatbubble-outline'} 
                      size={12} 
                      color={scan.type === 'url' ? '#1976d2' : '#7b1fa2'} 
                    />
                    <Text style={styles.typeBadgeText}>
                      {scan.type === 'url' ? 'URL' : 'Message'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDownloadPDF(scan)}>
                  <Ionicons name="download-outline" size={20} color={colors.primary[600]} />
                </TouchableOpacity>
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
          }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Scan Details</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Content</Text>
                <View style={[styles.modalValueBox, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: colors.border,
                }]}>
                  <Text style={[styles.modalText, { color: colors.text }]}>{selectedScan?.content}</Text>
                </View>
              </View>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Risk Assessment</Text>
                <RiskBadge score={selectedScan?.riskScore} size="large" />
              </View>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Explanation</Text>
                <View style={[styles.modalValueBox, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: colors.border,
                }]}>
                  <Text style={[styles.modalText, { color: colors.text }]}>{selectedScan?.explanation}</Text>
                </View>
              </View>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Date & Time</Text>
                <Text style={[styles.modalText, { color: colors.text }]}>{formatDate(selectedScan?.date)}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.modalDownloadBtn, { backgroundColor: colors.primary[600] }]}
                onPress={() => handleDownloadPDF(selectedScan)}
                disabled={downloading}
              >
                <Text style={styles.modalDownloadBtnText}>
                  {downloading ? 'Downloading...' : 'Download PDF Report'}
                </Text>
              </TouchableOpacity>
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
  
  // Header
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
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
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconSmall: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabelSmall: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 30,
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  filterText: {
    fontWeight: '500',
    fontSize: 13,
  },
  filterTextActive: {
    color: 'white',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 50,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 30,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 4,
  },

  // Scan Cards
  scanCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scanIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanId: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  urlBadge: {
    backgroundColor: '#e3f2fd',
  },
  messageBadge: {
    backgroundColor: '#f3e5f5',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  scanDate: {
    fontSize: 11,
  },
  scanContent: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  scanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanResultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scanResultText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDetailSection: {
    marginBottom: 18,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalValueBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalDownloadBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalDownloadBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});