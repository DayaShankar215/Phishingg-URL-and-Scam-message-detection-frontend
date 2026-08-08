// src/screens/HistoryScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGuest } from '../context/GuestContext';
import { getColors } from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthModal from '../components/AuthModal';
import { showToast } from '../components/Toaster';
import {
  getScanHistory,
  getScanByReference,
  deleteScanByReference,
  getPrediction,
} from '../services/api';
import { downloadPDF } from '../services/pdfGenerator';
import { formatDate, truncateText } from '../utils/formatters';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const navigation = useNavigation();
  const { isAuthenticated, logout } = useAuth();
  const { scans: guestScans } = useGuest();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, url: 0, message: 0 });

  const [dateFilter, setDateFilter] = useState({ preset: 'all' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  // Helper function to detect scan type
  const getScanType = (scan) => {
    if (scan.type) {
      const type = scan.type.toLowerCase();
      if (type === 'url' || type === 'message') return type;
    }
    if (scan.scanType) {
      const type = scan.scanType.toLowerCase();
      if (type === 'url' || type === 'message') return type;
      if (type.includes('url')) return 'url';
      if (type.includes('message')) return 'message';
    }
    if (scan.message) return 'message';
    if (scan.url) return 'url';
    if (scan.content) {
      const content = String(scan.content);
      if (content.match(/^https?:\/\/[^\s]+/) || content.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return 'url';
      }
      if (content.length > 50) return 'message';
      return content.length > 20 ? 'message' : 'url';
    }
    return 'url';
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [filter, isAuthenticated]);

  useEffect(() => {
    calculateStats();
  }, [scans]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await getScanHistory();
        console.log('Scan History Response:', response);

        let scansData = [];
        if (response && response.scans && Array.isArray(response.scans)) {
          scansData = response.scans;
        } else if (Array.isArray(response)) {
          scansData = response;
        } else if (response && response.response && Array.isArray(response.response)) {
          scansData = response.response;
        }

        const formattedScans = scansData.map((scan) => {
          const type = getScanType(scan);
          return {
            reference: scan.reference,
            url: scan.url || scan.content,
            prediction: getPrediction(scan),
            conclusion: scan.conclusion,
            scannedAt: scan.scannedAt,
            type: type,
            content: scan.url || scan.message || scan.content || scan.url || '',
            scanType: scan.scanType,
            message: scan.message,
            messagePrediction: scan.messagePrediction,
            messagePhishingReasons: scan.messagePhishingReasons || [],
            messageLegitimateReasons: scan.messageLegitimateReasons || [],
            urlsFound: scan.urlsFound || [],
            urlResults: scan.urlResults || [],
            phishingReasons: scan.phishingReasons || [],
            legitimateReasons: scan.legitimateReasons || [],
            _raw: scan,
          };
        });

        setScans(formattedScans);
      } else {
        const guestFiltered =
          filter === 'all'
            ? guestScans
            : guestScans.filter((s) => s.type === filter);
        setScans(guestFiltered);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      if (isAuthenticated) {
        showToast('Failed to load scan history', 'error');
      }
      setScans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = () => {
    const total = scans.length;
    const url = scans.filter((s) => s?.type === 'url').length;
    const message = scans.filter((s) => s?.type === 'message').length;
    setStats({ total, url, message });
  };

  const getDateFilteredScans = (scansList) => {
    if (!scansList || !Array.isArray(scansList)) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return scansList.filter((scan) => {
      const scanDate = new Date(
        scan?.scannedAt || scan?.date || scan?.timestamp || scan?.createdAt || Date.now()
      );

      switch (dateFilter.preset) {
        case 'today':
          return scanDate >= today;
        case 'yesterday':
          return scanDate >= yesterday && scanDate < today;
        case 'week':
          return scanDate >= weekAgo;
        case 'month':
          return scanDate >= monthAgo;
        case 'custom':
          if (tempStartDate && tempEndDate) {
            const start = new Date(tempStartDate);
            const end = new Date(tempEndDate);
            end.setHours(23, 59, 59, 999);
            return scanDate >= start && scanDate <= end;
          }
          return true;
        case 'all':
        default:
          return true;
      }
    });
  };

  const handleDatePresetChange = (preset) => {
    setDateFilter({ preset });
    setShowDatePicker(false);
    if (preset !== 'custom') {
      setTempStartDate('');
      setTempEndDate('');
      showToast(`Filter applied: ${getDateFilterLabel(preset)}`, 'success');
    }
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      setDateFilter({ preset: 'custom' });
      setShowDatePicker(false);
      showToast('Date filter applied', 'success');
    } else {
      showToast('Please select both start and end dates', 'error');
    }
  };

  const clearDateFilter = () => {
    setDateFilter({ preset: 'all' });
    setTempStartDate('');
    setTempEndDate('');
    setShowDatePicker(false);
    showToast('Date filter cleared', 'success');
  };

  const getDateFilterLabel = (preset = null) => {
    const currentPreset = preset || dateFilter.preset;
    switch (currentPreset) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'custom':
        if (tempStartDate && tempEndDate) {
          return 'Custom Range';
        }
        return 'Custom Range';
      default:
        return 'All Time';
    }
  };

  const handleViewDetails = async (reference) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await getScanByReference(reference);
      console.log('Scan Details Response:', response);

      const isMessageScan = response.scanType === 'MESSAGE' || response.message;

      setSelectedScan({
        reference: response.reference,
        url: response.url || response.message || '',
        prediction: getPrediction(response),
        legitimateReasons: response.legitimateReasons || response.messageLegitimateReasons || [],
        phishingReasons: response.phishingReasons || response.messagePhishingReasons || [],
        conclusion: response.conclusion,
        scannedAt: response.scannedAt,
        isMessageScan: isMessageScan,
        message: response.message,
        scanType: response.scanType,
        messagePrediction: response.messagePrediction,
        messagePhishingReasons: response.messagePhishingReasons || [],
        messageLegitimateReasons: response.messageLegitimateReasons || [],
        urlsFound: response.urlsFound || [],
        urlResults: response.urlResults || [],
        overallPrediction: response.overallPrediction,
        phishingReasons: response.phishingReasons || [],
        legitimateReasons: response.legitimateReasons || [],
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching scan details:', error);
      showToast('Failed to load scan details', 'error');
    }
  };

  const handleDownloadReport = async (reference) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (downloadingId === reference) return;

    setDownloadingId(reference);
    showToast('Generating PDF report...', 'loading');

    try {
      const scanDetails = await getScanByReference(reference);
      console.log('Scan Details:', scanDetails);

      const isMessageScan = scanDetails.scanType === 'MESSAGE' || scanDetails.message;

      const pdfData = {
        reference: scanDetails.reference,
        url: isMessageScan ? '' : scanDetails.url || '',
        message: scanDetails.message || '',
        prediction: getPrediction(scanDetails),
        conclusion: scanDetails.conclusion || 'Analysis completed',
        scannedAt: scanDetails.scannedAt,
        scanType: scanDetails.scanType || (isMessageScan ? 'MESSAGE' : 'URL'),
        messagePrediction: scanDetails.messagePrediction,
        messagePhishingReasons: scanDetails.messagePhishingReasons || [],
        messageLegitimateReasons: scanDetails.messageLegitimateReasons || [],
        urlsFound: scanDetails.urlsFound || [],
        urlResults: scanDetails.urlResults || [],
        phishingReasons: scanDetails.phishingReasons || [],
        legitimateReasons: scanDetails.legitimateReasons || [],
        overallPrediction: scanDetails.overallPrediction,
      };

      await downloadPDF(pdfData, isMessageScan ? 'message' : 'url');
      showToast('PDF report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download Error:', error);
      showToast(error.message || 'Failed to download report', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteScan = async (reference) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (deletingId === reference) return;

    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan? This action cannot be undone.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(reference);
            
            try {
              console.log(`[DELETE] Attempting to delete scan with reference: ${reference}`);
              
              const response = await deleteScanByReference(reference);
              console.log('[DELETE] Response:', response);
              
              showToast(response?.message || 'Scan deleted successfully!', 'success');
              
              // Remove the scan from local state
              setScans((prevScans) => prevScans.filter((scan) => scan.reference !== reference));
              
              // Refresh history to update stats
              await fetchHistory();
              
            } catch (error) {
              console.error('[DELETE] Error:', error);
              
              if (error?.status === 401 || error?.status === 403) {
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => logout(), 1500);
              } else if (error?.status === 404) {
                showToast('Scan already deleted.', 'success');
                setScans((prevScans) => prevScans.filter((scan) => scan.reference !== reference));
                await fetchHistory();
              } else {
                showToast(error?.message || 'Failed to delete scan', 'error');
              }
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const smartSearch = (scan, term) => {
    if (!term || term.trim() === '') return true;

    const searchLower = term.toLowerCase().trim();
    const reference = (scan?.reference || '').toString().toLowerCase();
    const content = (scan?.content || scan?.url || scan?.message || '').toLowerCase();
    const type = (scan?.type || '').toLowerCase();

    return reference.includes(searchLower) ||
      content.includes(searchLower) ||
      type.includes(searchLower);
  };

  const filteredScans = (() => {
    if (!Array.isArray(scans)) return [];

    let filtered = getDateFilteredScans(scans);

    if (filter !== 'all') {
      filtered = filtered.filter((s) => s.type === filter);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter((scan) => smartSearch(scan, searchTerm));
    }

    return filtered;
  })();

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getPredictionColor = (pred) => {
    const upperPred = pred?.toUpperCase() || '';
    switch (upperPred) {
      case 'PHISHING':
      case 'DANGEROUS':
      case 'MALICIOUS':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'SCAM':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'SUSPICIOUS':
      case 'WARNING':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'SAFE':
      case 'LEGITIMATE':
        return { bg: '#d1fae5', color: '#065f46' };
      default:
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'url') {
      return { bg: '#dbeafe', color: '#1d4ed8', icon: 'link-outline', label: 'URL' };
    } else if (type === 'message') {
      return { bg: '#fce7f3', color: '#be185d', icon: 'chatbubble-outline', label: 'Message' };
    }
    return { bg: '#f1f5f9', color: '#64748b', icon: 'help-outline', label: 'Unknown' };
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView>
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
                  <Text style={styles.headerTitle}>Security History</Text>
                  <Text style={styles.headerSubtitle}>Track and analyze all your security scans</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.emptyCard, {
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderLight,
            marginHorizontal: 16,
            marginTop: 20,
            padding: 32,
            borderRadius: 24,
            borderWidth: 1,
            alignItems: 'center',
          }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="shield-outline" size={56} color={colors.primary[600]} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sign in to View History
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
              You need to be signed in to view and manage your scan history. Guest mode does not save scan history.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary[600] }]}
              onPress={() => setShowAuthModal(true)}
            >
              <Text style={styles.primaryBtnText}>Sign Up / Login</Text>
            </TouchableOpacity>
          </View>

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              navigation.navigate('Dashboard');
            }}
            initialMode="login"
            onSuccess={() => {
              setShowAuthModal(false);
              fetchHistory();
            }}
          />
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading security history..." />;
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
              <Text style={styles.headerTitle}>Security History</Text>
              <Text style={styles.headerSubtitle}>Track and analyze all your security scans</Text>
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

      {/* Stats Cards */}
      <View style={[styles.statsContainer, {
        backgroundColor: colors.backgroundCard,
        borderColor: colors.borderLight,
      }]}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary[600] + '20' }]}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.primary[600]} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Scans</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
            <Ionicons name="link-outline" size={24} color="#3b82f6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.url}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>URL Scans</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#f5576c20' }]}>
            <Ionicons name="chatbubble-outline" size={24} color="#f5576c" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.message}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Message Scans</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {['all', 'url', 'message'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                filter === type && [styles.filterTabActive, { backgroundColor: colors.primary[600] }],
                { backgroundColor: filter === type ? colors.primary[600] : colors.backgroundInput }
              ]}
              onPress={() => setFilter(type)}
            >
              <Text style={[
                styles.filterText,
                filter === type ? styles.filterTextActive : { color: colors.textMuted }
              ]}>
                {type === 'all' ? 'All Scans' : type === 'url' ? 'URL Scans' : 'Message Scans'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.dateFilterBtn, {
            backgroundColor: dateFilter.preset !== 'all' ? colors.primary[600] : colors.backgroundInput,
            borderColor: dateFilter.preset !== 'all' ? colors.primary[600] : colors.border,
          }]}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Ionicons name="calendar-outline" size={16} color={dateFilter.preset !== 'all' ? 'white' : colors.textMuted} />
          <Text style={[styles.dateFilterText, { color: dateFilter.preset !== 'all' ? 'white' : colors.textMuted }]}>
            {dateFilter.preset === 'all' ? 'All Time' : getDateFilterLabel()}
          </Text>
          {dateFilter.preset !== 'all' && (
            <TouchableOpacity onPress={clearDateFilter}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, {
        backgroundColor: colors.backgroundInput,
        borderColor: colors.border,
      }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by reference ID, content or type..."
          placeholderTextColor={colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Dropdown */}
      {showDatePicker && (
        <View style={[styles.datePickerContainer, {
          backgroundColor: colors.backgroundCard,
          borderColor: colors.border,
        }]}>
          <View style={styles.datePickerHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary[600]} />
            <Text style={[styles.datePickerTitle, { color: colors.text }]}>Filter by Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePresets}>
            {[
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: 'custom', label: 'Custom Range' },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.datePreset,
                  dateFilter.preset === preset.value && { backgroundColor: colors.primary[600] }
                ]}
                onPress={() => handleDatePresetChange(preset.value)}
              >
                <Text style={[
                  styles.datePresetText,
                  dateFilter.preset === preset.value && { color: 'white' }
                ]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {dateFilter.preset === 'custom' && (
            <View style={styles.customDateContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={[styles.dateInputLabel, { color: colors.textMuted }]}>Start</Text>
                <TextInput
                  style={[styles.dateInput, {
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                    color: colors.text,
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={tempStartDate}
                  onChangeText={setTempStartDate}
                />
              </View>
              <View style={styles.dateInputGroup}>
                <Text style={[styles.dateInputLabel, { color: colors.textMuted }]}>End</Text>
                <TextInput
                  style={[styles.dateInput, {
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                    color: colors.text,
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={tempEndDate}
                  onChangeText={setTempEndDate}
                />
              </View>
              <TouchableOpacity
                style={[styles.applyDateBtn, { backgroundColor: colors.primary[600] }]}
                onPress={handleCustomDateApply}
              >
                <Text style={styles.applyDateBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.datePickerFooter}>
            <Text style={[styles.datePickerInfo, { color: colors.textMuted }]}>
              Showing {filteredScans.length} scans
            </Text>
            {dateFilter.preset !== 'all' && (
              <TouchableOpacity onPress={clearDateFilter}>
                <Text style={[styles.clearFilterText, { color: colors.danger }]}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={[styles.resultsCountText, { color: colors.textMuted }]}>
          Showing {filteredScans.length} of {scans.length} scans
          {searchTerm && (
            <Text style={[styles.searchHighlight, { color: colors.primary[600] }]}>
              {' '}(filtered by "{searchTerm}")
            </Text>
          )}
        </Text>
        {dateFilter.preset !== 'all' && (
          <View style={styles.dateLabel}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.dateLabelText, { color: colors.textMuted }]}>
              {getDateFilterLabel()}
            </Text>
          </View>
        )}
      </View>

      {/* Scans List */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredScans.length === 0 ? (
          <View style={[styles.noScansCard, {
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderLight,
          }]}>
            <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noScansText, { color: colors.textMuted }]}>No scans found.</Text>
            {searchTerm && (
              <TouchableOpacity
                style={[styles.clearSearchBtn, { backgroundColor: colors.primary[600] }]}
                onPress={() => setSearchTerm('')}
              >
                <Text style={styles.clearSearchBtnText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredScans.map((scan, index) => {
            const reference = scan?.reference;
            const isDownloading = downloadingId === reference;
            const isDeleting = deletingId === reference;
            const isGuest = scan?.isGuest === true;
            const prediction = scan?.prediction || 'UNKNOWN';
            const predColor = getPredictionColor(prediction);
            const typeBadge = getTypeBadge(scan?.type);

            return (
              <TouchableOpacity
                key={reference || `scan_${index}`}
                style={[styles.scanCard, {
                  backgroundColor: isGuest ? colors.backgroundSecondary : colors.backgroundCard,
                  borderColor: colors.borderLight,
                }]}
                onPress={() => handleViewDetails(reference)}
                activeOpacity={0.7}
              >
                <View style={styles.scanHeader}>
                  <View style={styles.scanIdContainer}>
                    {/* ✅ S.No */}
                    <Text style={[styles.scanSNo, { color: colors.textMuted }]}>
                      #{index + 1}
                    </Text>
                    <Ionicons name="pricetag-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.scanId, { color: colors.primary[600] }]}>
                      {reference ? truncateText(reference, 20) : 'N/A'}
                    </Text>
                    {isGuest && (
                      <View style={[styles.guestBadge, { backgroundColor: colors.textMuted }]}>
                        <Text style={styles.guestBadgeText}>Guest</Text>
                      </View>
                    )}
                    <View style={[styles.typeBadge, {
                      backgroundColor: typeBadge.bg
                    }]}>
                      <Ionicons
                        name={typeBadge.icon}
                        size={12}
                        color={typeBadge.color}
                      />
                      <Text style={[styles.typeBadgeText, { color: typeBadge.color }]}>
                        {typeBadge.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleDownloadReport(reference)}
                      disabled={isDownloading || !isAuthenticated}
                      style={styles.actionBtn}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={colors.primary[600]} />
                      ) : (
                        <Ionicons name="document-text-outline" size={20} color={isAuthenticated ? colors.primary[600] : colors.textMuted} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteScan(reference)}
                      disabled={isDeleting || !isAuthenticated}
                      style={styles.actionBtn}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Ionicons name="trash-outline" size={20} color={isAuthenticated ? colors.danger : colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.scanContent, { color: colors.text }]} numberOfLines={2}>
                  {truncateText(scan?.content || scan?.url || 'N/A', 50)}
                </Text>

                <View style={styles.scanFooter}>
                  <View style={[styles.predBadge, { backgroundColor: predColor.bg }]}>
                    <Text style={[styles.predBadgeText, { color: predColor.color }]}>
                      {prediction}
                    </Text>
                  </View>
                  <View style={styles.scanDateContainer}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.scanDate, { color: colors.textMuted }]}>
                      {formatDate(scan?.scannedAt || scan?.date || scan?.timestamp || Date.now())}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Details Modal */}
      {showModal && selectedScan && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, {
              backgroundColor: colors.backgroundCard,
              borderColor: colors.border,
            }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Scan Details</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Reference */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Reference</Text>
                  <View style={[styles.modalValueBox, {
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                  }]}>
                    <Text style={[styles.modalText, { color: colors.text, fontFamily: 'monospace' }]}>
                      {selectedScan.reference}
                    </Text>
                  </View>
                </View>

                {/* Type */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Scan Type</Text>
                  <View style={[styles.modalValueBox, {
                    backgroundColor: selectedScan.scanType === 'MESSAGE' ? '#fce7f3' : '#dbeafe',
                    borderColor: selectedScan.scanType === 'MESSAGE' ? '#f9a8d4' : '#93c5fd',
                  }]}>
                    <Text style={[styles.modalText, {
                      color: selectedScan.scanType === 'MESSAGE' ? '#be185d' : '#1d4ed8',
                      fontWeight: '600',
                    }]}>
                      {selectedScan.scanType || (selectedScan.isMessageScan ? 'MESSAGE' : 'URL')}
                    </Text>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                    {selectedScan.isMessageScan ? 'Message' : 'URL'}
                  </Text>
                  <View style={[styles.modalValueBox, {
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                  }]}>
                    <Text style={[styles.modalText, { color: colors.text }]}>
                      {selectedScan.isMessageScan ? selectedScan.message || selectedScan.url : selectedScan.url}
                    </Text>
                  </View>
                </View>

                {/* Prediction */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Overall Prediction</Text>
                  <View style={[styles.modalValueBox, {
                    backgroundColor: selectedScan.prediction === 'PHISHING' ? '#fee2e2' : '#d1fae5',
                    borderColor: selectedScan.prediction === 'PHISHING' ? '#fca5a5' : '#6ee7b7',
                  }]}>
                    <Text style={[styles.modalText, {
                      color: selectedScan.prediction === 'PHISHING' ? '#dc2626' : '#065f46',
                      fontWeight: '600',
                    }]}>
                      {selectedScan.overallPrediction || selectedScan.prediction}
                    </Text>
                  </View>
                </View>

                {/* Message Prediction */}
                {selectedScan.isMessageScan && selectedScan.messagePrediction && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Message Prediction</Text>
                    <View style={[styles.modalValueBox, {
                      backgroundColor: selectedScan.messagePrediction === 'PHISHING' ? '#fee2e2' : '#d1fae5',
                      borderColor: selectedScan.messagePrediction === 'PHISHING' ? '#fca5a5' : '#6ee7b7',
                    }]}>
                      <Text style={[styles.modalText, {
                        color: selectedScan.messagePrediction === 'PHISHING' ? '#dc2626' : '#065f46',
                        fontWeight: '600',
                      }]}>
                        {selectedScan.messagePrediction}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Message Phishing Reasons */}
                {selectedScan.isMessageScan && selectedScan.messagePhishingReasons && selectedScan.messagePhishingReasons.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: '#dc2626' }]}>🚨 Message Phishing Indicators</Text>
                    <View style={[styles.modalValueBox, {
                      backgroundColor: '#fee2e2',
                      borderColor: '#fca5a5',
                    }]}>
                      {selectedScan.messagePhishingReasons.map((reason, i) => (
                        <Text key={i} style={[styles.modalListItem, { color: '#dc2626' }]}>
                          • {reason}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* URL Phishing Reasons */}
                {!selectedScan.isMessageScan && selectedScan.phishingReasons && selectedScan.phishingReasons.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: '#dc2626' }]}>🚨 Phishing Indicators</Text>
                    <View style={[styles.modalValueBox, {
                      backgroundColor: '#fee2e2',
                      borderColor: '#fca5a5',
                    }]}>
                      {selectedScan.phishingReasons.map((reason, i) => (
                        <Text key={i} style={[styles.modalListItem, { color: '#dc2626' }]}>
                          • {reason}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* URLs Found */}
                {selectedScan.isMessageScan && selectedScan.urlsFound && selectedScan.urlsFound.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: '#d97706' }]}>🔗 URLs Found in Message</Text>
                    <View style={[styles.modalValueBox, {
                      backgroundColor: '#fef3c7',
                      borderColor: '#fcd34d',
                    }]}>
                      {selectedScan.urlsFound.map((url, index) => {
                        const urlResult = selectedScan.urlResults?.[index];
                        return (
                          <View key={index} style={styles.urlResultItem}>
                            <Text style={[styles.modalText, { color: '#1e293b' }]}>{url}</Text>
                            {urlResult && (
                              <Text style={[styles.urlResultPred, {
                                color: urlResult.prediction === 'LEGITIMATE' ? '#065f46' : '#dc2626',
                              }]}>
                                {urlResult.prediction || 'UNKNOWN'}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Conclusion */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Conclusion</Text>
                  <View style={[styles.modalValueBox, {
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                  }]}>
                    <Text style={[styles.modalText, { color: colors.text, lineHeight: 24 }]}>
                      {selectedScan.conclusion}
                    </Text>
                  </View>
                </View>

                {/* Scanned At */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Scanned At</Text>
                  <View style={[styles.modalValueBox, {
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                  }]}>
                    <View style={styles.modalDateContainer}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.modalText, { color: colors.text }]}>
                        {formatDate(selectedScan.scannedAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Download Button */}
                <TouchableOpacity
                  style={[styles.modalDownloadBtn, {
                    backgroundColor: downloadingId === selectedScan.reference ? colors.textMuted : colors.primary[600],
                  }]}
                  onPress={() => handleDownloadReport(selectedScan.reference)}
                  disabled={downloadingId === selectedScan.reference}
                >
                  {downloadingId === selectedScan.reference ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.modalDownloadBtnText}>Downloading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={20} color="white" />
                      <Text style={styles.modalDownloadBtnText}>Download Full Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
        }}
        initialMode="register"
        onSuccess={() => {
          setShowAuthModal(false);
          fetchHistory();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    flex: 1,
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  filterTabs: {
    flex: 1,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
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
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  datePickerContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  datePickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  datePresets: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  datePreset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  datePresetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
  },
  applyDateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  applyDateBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  datePickerInfo: {
    fontSize: 12,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  resultsCountText: {
    fontSize: 13,
  },
  searchHighlight: {
    fontWeight: '600',
  },
  dateLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabelText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  scanSNo: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  scanId: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  guestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  guestBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
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
  predBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  predBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scanDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanDate: {
    fontSize: 11,
  },
  noScansCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  noScansText: {
    fontSize: 16,
    marginTop: 12,
  },
  clearSearchBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  clearSearchBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 24,
    width: '92%',
    maxHeight: '85%',
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
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 18,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  modalListItem: {
    fontSize: 14,
    lineHeight: 24,
  },
  urlResultItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  urlResultPred: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  modalDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  modalDownloadBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoryScreen;