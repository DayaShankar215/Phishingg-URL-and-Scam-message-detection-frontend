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
import RiskBadge from '../components/RiskBadge';
import AuthModal from '../components/AuthModal';
import { showToast } from '../components/Toaster';
import {
  getScanHistory,
  getScanByReference,
  deleteScanByReference,
} from '../services/api';
import { downloadPDF } from '../services/pdfGenerator';
import { formatDate, truncateText } from '../utils/formatters';

const { width } = Dimensions.get('window');

const HistoryScreen = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
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

  useEffect(() => {
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

        const formattedScans = scansData.map((scan) => ({
          reference: scan.reference,
          url: scan.url,
          prediction: scan.prediction,
          conclusion: scan.conclusion,
          scannedAt: scan.scannedAt,
          type: 'url',
          content: scan.url,
          _raw: scan,
        }));

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
        scan?.scannedAt || scan?.date || scan?.timestamp || scan?.createdAt
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

      setSelectedScan({
        reference: response.reference,
        url: response.url,
        prediction: response.prediction,
        legitimateReasons: response.legitimateReasons || [],
        phishingReasons: response.phishingReasons || [],
        conclusion: response.conclusion,
        scannedAt: response.scannedAt,
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

      const pdfData = {
        reference: scanDetails.reference,
        url: scanDetails.url,
        prediction: scanDetails.prediction,
        conclusion: scanDetails.conclusion,
        scannedAt: scanDetails.scannedAt,
        phishingReasons: scanDetails.phishingReasons || [],
        legitimateReasons: scanDetails.legitimateReasons || [],
      };

      await downloadPDF(pdfData, 'url');
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(reference);
            try {
              const response = await deleteScanByReference(reference);
              showToast(response?.message || 'Scan deleted successfully!', 'success');
              setScans((prev) => prev.filter((scan) => scan.reference !== reference));
              await fetchHistory();
            } catch (error) {
              console.error('Delete Error:', error);
              if (error.status === 401) {
                showToast('Please login again to delete scans', 'error');
                setTimeout(() => logout(), 1500);
              } else {
                showToast(error.message || 'Failed to delete scan', 'error');
              }
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const smartSearch = (scan, term) => {
    if (!term || term.trim() === '') return true;

    const searchLower = term.toLowerCase().trim();
    const reference = (scan?.reference || '').toString().toLowerCase();
    const content = (scan?.content || scan?.url || scan?.message || '').toLowerCase();

    return reference.includes(searchLower) || content.includes(searchLower);
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
    switch (pred?.toUpperCase()) {
      case 'PHISHING':
      case 'DANGEROUS':
      case 'MALICIOUS':
        return { bg: '#fee2e2', color: '#dc2626' };
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

  if (loading) {
    return <LoadingSpinner text="Loading security history..." />;
  }

  if (!isAuthenticated && scans.length === 0) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
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
          }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="shield-outline" size={56} color={colors.primary[600]} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Scans Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
              You haven't performed any scans yet. Start scanning URLs and messages to see results here.
            </Text>
            <Text style={[styles.emptySubDescription, { color: colors.textMuted }]}>
              Sign up to save your scan history permanently and access it from any device.
            </Text>
            <View style={styles.emptyButtons}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary[600] }]}
                onPress={() => navigation.navigate('URL Scanner')}
              >
                <Text style={styles.primaryBtnText}>Start Scanning</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.primary[600] }]}
                onPress={() => setShowAuthModal(true)}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.primary[600]} />
                <Text style={[styles.secondaryBtnText, { color: colors.primary[600] }]}>Sign Up to Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="register"
          onSuccess={() => {
            setShowAuthModal(false);
            fetchHistory();
          }}
        />
      </ScrollView>
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

        {!isAuthenticated && scans.length > 0 && (
          <View style={[styles.guestBanner, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
            <Ionicons name="information-circle-outline" size={18} color="#d97706" />
            <Text style={styles.guestBannerText}>Guest Mode • History is temporary</Text>
            <TouchableOpacity
              style={[styles.guestBannerBtn, { backgroundColor: colors.primary[600] }]}
              onPress={() => setShowAuthModal(true)}
            >
              <Text style={styles.guestBannerBtnText}>Sign Up to Save</Text>
            </TouchableOpacity>
          </View>
        )}
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
          placeholder="Search by reference ID or content..."
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
          filteredScans.map((scan) => {
            const reference = scan?.reference;
            const isDownloading = downloadingId === reference;
            const isDeleting = deletingId === reference;
            const isGuest = scan?.isGuest === true;
            const prediction = scan?.prediction || 'UNKNOWN';
            const predColor = getPredictionColor(prediction);

            return (
              <TouchableOpacity
                key={reference || Math.random()}
                style={[styles.scanCard, { 
                  backgroundColor: isGuest ? colors.backgroundSecondary : colors.backgroundCard,
                  borderColor: colors.borderLight,
                }]}
                onPress={() => handleViewDetails(reference)}
                activeOpacity={0.7}
              >
                <View style={styles.scanHeader}>
                  <View style={styles.scanIdContainer}>
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
                      backgroundColor: scan.type === 'url' ? '#e3f2fd' : '#f3e5f5' 
                    }]}>
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

                {/* URL */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>URL</Text>
                  <View style={[styles.modalValueBox, { 
                    backgroundColor: colors.backgroundInput,
                    borderColor: colors.border,
                  }]}>
                    <Text style={[styles.modalText, { color: colors.text }]}>
                      {selectedScan.url}
                    </Text>
                  </View>
                </View>

                {/* Prediction */}
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Prediction</Text>
                  <View style={[styles.modalValueBox, { 
                    backgroundColor: selectedScan.prediction === 'PHISHING' ? '#fee2e2' : '#d1fae5',
                    borderColor: selectedScan.prediction === 'PHISHING' ? '#fca5a5' : '#6ee7b7',
                  }]}>
                    <Text style={[styles.modalText, { 
                      color: selectedScan.prediction === 'PHISHING' ? '#dc2626' : '#065f46',
                      fontWeight: '600',
                    }]}>
                      {selectedScan.prediction}
                    </Text>
                  </View>
                </View>

                {/* Phishing Reasons */}
                {selectedScan.phishingReasons && selectedScan.phishingReasons.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>🚨 Phishing Indicators</Text>
                    <View style={[styles.modalValueBox, { 
                      backgroundColor: '#fee2e2',
                      borderColor: '#fca5a5',
                    }]}>
                      {Array.isArray(selectedScan.phishingReasons) ? (
                        selectedScan.phishingReasons.map((reason, i) => (
                          <Text key={i} style={[styles.modalListItem, { color: '#dc2626' }]}>
                            • {reason}
                          </Text>
                        ))
                      ) : (
                        <Text style={[styles.modalText, { color: '#dc2626' }]}>
                          {selectedScan.phishingReasons}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Legitimate Reasons */}
                {selectedScan.legitimateReasons && selectedScan.legitimateReasons.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalLabel, { color: colors.textMuted }]}>✅ Legitimate Indicators</Text>
                    <View style={[styles.modalValueBox, { 
                      backgroundColor: '#d1fae5',
                      borderColor: '#6ee7b7',
                    }]}>
                      {Array.isArray(selectedScan.legitimateReasons) ? (
                        selectedScan.legitimateReasons.map((reason, i) => (
                          <Text key={i} style={[styles.modalListItem, { color: '#065f46' }]}>
                            • {reason}
                          </Text>
                        ))
                      ) : (
                        <Text style={[styles.modalText, { color: '#065f46' }]}>
                          {selectedScan.legitimateReasons}
                        </Text>
                      )}
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
        onClose={() => setShowAuthModal(false)}
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

  // Guest Banner
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  guestBannerText: {
    fontSize: 13,
    color: '#92400e',
    flex: 1,
  },
  guestBannerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guestBannerBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats
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

  // Filters
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

  // Search
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

  // Date Picker
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

  // Results Count
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

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Scan Card
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
    color: '#64748b',
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

  // No Scans
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

  // Empty State
  emptyContainer: {
    flex: 1,
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
    marginBottom: 8,
  },
  emptySubDescription: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  secondaryBtnText: {
    fontSize: 15,
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