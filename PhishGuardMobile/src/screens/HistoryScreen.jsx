// screens/HistoryScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  RefreshControl, Modal, ActivityIndicator, Dimensions, Alert, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { getScanHistory, getScanById, downloadAndSharePDF, generatePDFReport } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import RiskBadge from '../components/RiskBadge';

const { width } = Dimensions.get('window');

const StatItem = ({ value = 0, label = '', icon = 'scan-outline', color = '#667eea', colors = {} }) => {
  const textColor = colors?.text || '#1e293b';
  const textMutedColor = colors?.textMuted || '#64748b';
  
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconSmall, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValueSmall, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabelSmall, { color: textMutedColor }]}>{label}</Text>
    </View>
  );
};

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

  const safeColors = {
    background: colors?.background || '#f8fafc',
    backgroundCard: colors?.backgroundCard || '#ffffff',
    backgroundInput: colors?.backgroundInput || '#f1f5f9',
    border: colors?.border || '#e2e8f0',
    borderLight: colors?.borderLight || '#e2e8f0',
    text: colors?.text || '#1e293b',
    textMuted: colors?.textMuted || '#64748b',
    primary: colors?.primary?.[600] || '#667eea',
    warning: colors?.warning || '#f59e0b',
    danger: colors?.danger || '#dc2626',
    success: colors?.success || '#16a34a',
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      try {
        const response = await getScanHistory(filter === 'all' ? null : filter);
        if (response) {
          if (Array.isArray(response)) {
            data = response;
          } else if (response.data && Array.isArray(response.data)) {
            data = response.data;
          } else if (response.scans && Array.isArray(response.scans)) {
            data = response.scans;
          } else if (response.results && Array.isArray(response.results)) {
            data = response.results;
          } else if (response.history && Array.isArray(response.history)) {
            data = response.history;
          } else {
            // Try to find any array in the response
            for (const key in response) {
              if (Array.isArray(response[key])) {
                data = response[key];
                break;
              }
            }
          }
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        Alert.alert('Connection Error', apiError.message || 'Failed to fetch history');
      }
      
      setScans(Array.isArray(data) ? data : []);
      calculateStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fatal error:', error);
      setScans([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const calculateStats = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setStats({ total: 0, url: 0, message: 0, avgRisk: 0 });
      return;
    }
    
    const total = data.length;
    const url = data.filter(s => s?.type === 'url' || s?.scanType === 'url').length;
    const message = data.filter(s => s?.type === 'message' || s?.scanType === 'message').length;
    const avgRisk = total > 0 
      ? data.reduce((sum, s) => sum + (s?.riskScore || s?.riskScore || 0), 0) / total 
      : 0;
    setStats({ total, url, message, avgRisk });
  };

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = () => { setRefreshing(true); fetchHistory(); };

  const viewDetails = async (id, type) => {
    if (!id || !type) {
      Alert.alert('Error', 'Invalid scan details');
      return;
    }
    
    try {
      let scan = null;
      try {
        scan = await getScanById(id, type);
      } catch (apiError) {
        console.warn('API fetch error, using local data:', apiError);
        scan = scans.find(s => s.id === id) || null;
      }
      
      if (scan) {
        setSelectedScan(scan);
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to load scan details');
      }
    } catch (error) { 
      console.error('Error viewing details:', error);
      Alert.alert('Error', 'Failed to load scan details');
    }
  };

  const handleDownloadPDF = async (scan) => {
    if (!scan || !scan.id) {
      Alert.alert('Error', 'No scan data available to download');
      return;
    }
    
    setDownloading(true);
    try {
      try {
        await downloadAndSharePDF(scan.id, scan.type);
        Alert.alert('Success', 'PDF downloaded successfully!');
        setDownloading(false);
        return;
      } catch (apiError) {
        console.log('API download failed:', apiError);
      }
      
      try {
        const fileUri = await generatePDFReport(scan, scan.type);
        if (fileUri && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'Security Report',
          });
          Alert.alert('Success', 'Report generated successfully!');
          setDownloading(false);
          return;
        }
      } catch (genError) {
        console.log('PDF generation failed:', genError);
      }
      
      if (Platform.OS === 'web') {
        const reportText = generateSimpleReport(scan);
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${scan.id}_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Alert.alert('Success', 'Report downloaded successfully!');
        setDownloading(false);
        return;
      }
      
      try {
        const reportText = generateSimpleReport(scan);
        const fileName = `report_${scan.id}_${Date.now()}.txt`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, reportText, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Security Report',
          });
          Alert.alert('Success', 'Report generated and shared!');
        }
      } catch (nativeError) {
        console.error('Native download failed:', nativeError);
        const reportText = generateSimpleReport(scan);
        Alert.alert(
          'Security Report',
          reportText.substring(0, 500) + '...',
          [{ text: 'OK', style: 'cancel' }]
        );
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const generateSimpleReport = (scan) => {
    const safeScan = scan || {};
    return `
===========================================
        PHISHING DETECTION REPORT
===========================================

Scan ID: ${safeScan.id || 'N/A'}
Type: ${safeScan.type || safeScan.scanType || 'N/A'}
Date: ${safeScan.date ? new Date(safeScan.date).toLocaleString() : 'N/A'}
Content: ${safeScan.content || safeScan.message || 'N/A'}

Risk Score: ${safeScan.riskScore || safeScan.riskScore || 0}%
Risk Level: ${getRiskLevel(safeScan.riskScore || safeScan.riskScore || 0)}
Classification: ${safeScan.classification || safeScan.result || 'Unknown'}
Confidence: ${safeScan.confidence ? (safeScan.confidence * 100).toFixed(1) + '%' : 'N/A'}

Explanation:
${safeScan.explanation || 'No explanation available'}

===========================================
Report generated on: ${new Date().toLocaleString()}
Powered by PhishGuard Security System
===========================================
    `.trim();
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return 'High Risk';
    if (score >= 50) return 'Medium Risk';
    return 'Low Risk';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  const getSafeValue = (obj, keys, defaultValue = 'N/A') => {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null) {
        return obj[key];
      }
    }
    return defaultValue;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: safeColors.background }]}>
        <ActivityIndicator size="large" color={safeColors.primary} />
        <Text style={[styles.loadingText, { color: safeColors.textMuted }]}>
          Loading history...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: safeColors.background }]}>
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
            disabled={refreshing}
          >
            <Ionicons name="refresh-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { 
        backgroundColor: safeColors.backgroundCard,
        borderColor: safeColors.borderLight,
      }]}>
        <StatItem 
          value={stats.total} 
          label="Total" 
          icon="scan-outline" 
          color={safeColors.primary}
          colors={safeColors}
        />
        <View style={[styles.statDivider, { backgroundColor: safeColors.border }]} />
        <StatItem 
          value={stats.url} 
          label="URLs" 
          icon="link-outline" 
          color={safeColors.primary}
          colors={safeColors}
        />
        <View style={[styles.statDivider, { backgroundColor: safeColors.border }]} />
        <StatItem 
          value={stats.message} 
          label="Messages" 
          icon="chatbubble-outline" 
          color="#f5576c"
          colors={safeColors}
        />
        <View style={[styles.statDivider, { backgroundColor: safeColors.border }]} />
        <StatItem 
          value={`${stats.avgRisk.toFixed(0)}%`} 
          label="Avg Risk" 
          icon="warning-outline" 
          color={safeColors.warning}
          colors={safeColors}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'url', 'message'].map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[
              styles.filterTab, 
              filter === f && [styles.filterTabActive, { backgroundColor: safeColors.primary }],
              { backgroundColor: filter === f ? safeColors.primary : safeColors.backgroundInput }
            ]} 
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText, 
              filter === f && styles.filterTextActive,
              { color: filter === f ? 'white' : safeColors.textMuted }
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
        {!scans || scans.length === 0 ? (
          <View style={[styles.emptyState, { 
            backgroundColor: safeColors.backgroundCard,
            borderColor: safeColors.borderLight,
          }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="time-outline" size={56} color={safeColors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: safeColors.textMuted }]}>No scans yet</Text>
            <Text style={[styles.emptySubText, { color: safeColors.textMuted }]}>
              Your history will appear here
            </Text>
            <TouchableOpacity 
              style={[styles.retryBtn, { backgroundColor: safeColors.primary }]}
              onPress={fetchHistory}
            >
              <Text style={styles.retryBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          scans.map((scan, index) => {
            const scanId = getSafeValue(scan, ['id', '_id', 'scanId']);
            const scanType = getSafeValue(scan, ['type', 'scanType']);
            const scanContent = getSafeValue(scan, ['content', 'message', 'text', 'input']);
            const scanRiskScore = getSafeValue(scan, ['riskScore', 'riskScore', 'score'], 0);
            const scanDate = getSafeValue(scan, ['date', 'createdAt', 'timestamp', 'created'], null);
            const scanResult = getSafeValue(scan, ['result', 'classification', 'status']);
            
            const key = scanId !== 'N/A' ? scanId : `temp_${index}`;
            
            return (
              <TouchableOpacity 
                key={key} 
                style={[styles.scanCard, { 
                  backgroundColor: safeColors.backgroundCard,
                  borderColor: safeColors.borderLight,
                }]} 
                onPress={() => viewDetails(scanId, scanType)}
                activeOpacity={0.7}
              >
                <View style={styles.scanHeader}>
                  <View style={styles.scanIdContainer}>
                    <Text style={[styles.scanId, { color: safeColors.primary }]}>
                      #{typeof scanId === 'string' ? scanId.substring(0, 8) : scanId}
                    </Text>
                    <View style={[styles.typeBadge, 
                      scanType === 'url' ? styles.urlBadge : styles.messageBadge
                    ]}>
                      <Ionicons 
                        name={scanType === 'url' ? 'link-outline' : 'chatbubble-outline'} 
                        size={12} 
                        color={scanType === 'url' ? '#1976d2' : '#7b1fa2'} 
                      />
                      <Text style={styles.typeBadgeText}>
                        {scanType === 'url' ? 'URL' : 'Message'}
                      </Text>
                    </View>
                    {scanResult && scanResult !== 'N/A' && (
                      <View style={[styles.resultBadge, {
                        backgroundColor: (scanResult || '').toLowerCase().includes('safe') || (scanResult || '').toLowerCase().includes('legitimate') ? '#dcfce7' : 
                                       (scanResult || '').toLowerCase().includes('phish') ? '#fee2e2' : '#fef3c7'
                      }]}>
                        <Text style={[styles.resultText, {
                          color: (scanResult || '').toLowerCase().includes('safe') || (scanResult || '').toLowerCase().includes('legitimate') ? '#16a34a' : 
                                 (scanResult || '').toLowerCase().includes('phish') ? '#dc2626' : '#d97706'
                        }]}>
                          {scanResult}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleDownloadPDF(scan)}
                    disabled={downloading}
                    style={styles.downloadBtn}
                  >
                    <Ionicons name="download-outline" size={20} color={safeColors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.scanContent, { color: safeColors.text }]} numberOfLines={2}>
                  {scanContent}
                </Text>
                <View style={styles.scanFooter}>
                  <RiskBadge score={typeof scanRiskScore === 'number' ? scanRiskScore : 0} size="small" colors={safeColors} />
                  <Text style={[styles.scanDate, { color: safeColors.textMuted }]}>
                    {formatDate(scanDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Details Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={modalVisible} 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalContent, { 
            backgroundColor: safeColors.backgroundCard,
            borderColor: safeColors.border,
          }]}>
            <View style={[styles.modalHeader, { borderBottomColor: safeColors.border }]}>
              <Text style={[styles.modalTitle, { color: safeColors.text }]}>Scan Details</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={safeColors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: safeColors.textMuted }]}>Content</Text>
                <View style={[styles.modalValueBox, { 
                  backgroundColor: safeColors.backgroundInput,
                  borderColor: safeColors.border,
                }]}>
                  <Text style={[styles.modalText, { color: safeColors.text }]}>
                    {getSafeValue(selectedScan, ['content', 'message', 'text'])}
                  </Text>
                </View>
              </View>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: safeColors.textMuted }]}>Risk Assessment</Text>
                <RiskBadge score={getSafeValue(selectedScan, ['riskScore', 'riskScore'], 0)} size="large" colors={safeColors} />
              </View>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: safeColors.textMuted }]}>Explanation</Text>
                <View style={[styles.modalValueBox, { 
                  backgroundColor: safeColors.backgroundInput,
                  borderColor: safeColors.border,
                }]}>
                  <Text style={[styles.modalText, { color: safeColors.text }]}>
                    {getSafeValue(selectedScan, ['explanation', 'description', 'reason'])}
                  </Text>
                </View>
              </View>
              <View style={styles.modalDetailSection}>
                <Text style={[styles.modalLabel, { color: safeColors.textMuted }]}>Date & Time</Text>
                <Text style={[styles.modalText, { color: safeColors.text }]}>
                  {formatDate(getSafeValue(selectedScan, ['date', 'createdAt', 'timestamp'], null))}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.modalDownloadBtn, { backgroundColor: safeColors.primary }]}
                onPress={() => handleDownloadPDF(selectedScan)}
                disabled={downloading}
              >
                <Ionicons name="download-outline" size={20} color="white" style={styles.btnIcon} />
                <Text style={styles.modalDownloadBtnText}>
                  {downloading ? 'Downloading...' : 'Download Report'}
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
  loadingText: { marginTop: 12, fontSize: 14 },
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
  filterTabActive: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    fontWeight: '500',
    fontSize: 13,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
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
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  retryBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  scanCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
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
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 9,
    fontWeight: '700',
  },
  downloadBtn: {
    padding: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalDownloadBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 4,
  },
});