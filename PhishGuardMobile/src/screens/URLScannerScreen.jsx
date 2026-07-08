// screens/URLScannerScreen.jsx - Professional Mobile Design (Fixed Icons)
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { 
  scanURL, 
  submitFeedback, 
  downloadAndSharePDF, 
  generatePDFReport 
} from '../services/api';
import { validateURL } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function URLScannerScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAccurate, setIsAccurate] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const handleScan = async () => {
    const validation = validateURL(url);
    if (!validation.isValid) {
      Alert.alert('Invalid URL', validation.error);
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    setShowFeedback(false);
    setFeedbackSubmitted(false);

    try {
      const response = await scanURL(url);
      setResult(response);
      setShowFeedback(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to scan URL');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) {
      Alert.alert('Error', 'No scan result available');
      return;
    }

    setDownloading(true);
    setDownloadProgress('Starting download...');

    try {
      console.log('📄 Starting PDF download for scan:', result.id);
      
      try {
        setDownloadProgress('Downloading from server...');
        const { fileUri, saved } = await downloadAndSharePDF(result.id, 'url');
        setDownloadProgress('✅ Download complete!');
        
        Alert.alert(
          '✅ PDF Downloaded Successfully',
          `Report saved to:\n${fileUri}\n\n${saved ? '📁 Also saved to device storage' : '📁 Saved in app directory'}`,
          [
            { text: 'OK', style: 'cancel' },
            { 
              text: '📤 Share', 
              onPress: async () => {
                try {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Security Report',
                  });
                } catch (shareError) {
                  Alert.alert('Error', 'Failed to share PDF');
                }
              }
            }
          ]
        );
        setDownloading(false);
        return;
      } catch (apiError) {
        console.log('⚠️ Backend PDF failed, trying local:', apiError.message);
        setDownloadProgress('Backend failed, generating local...');
      }
      
      try {
        setDownloadProgress('Generating local report...');
        const fileUri = await generatePDFReport(result, 'url');
        setDownloadProgress('✅ Local report generated!');
        
        Alert.alert(
          '✅ Local Report Generated',
          `Report saved to:\n${fileUri}`,
          [
            { text: 'OK', style: 'cancel' },
            { 
              text: '📤 Share', 
              onPress: async () => {
                try {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/html',
                    dialogTitle: 'Security Report',
                  });
                } catch (shareError) {
                  Alert.alert('Error', 'Failed to share report');
                }
              }
            }
          ]
        );
        setDownloading(false);
        return;
      } catch (localError) {
        console.log('⚠️ Local PDF failed:', localError.message);
      }
      
      const reportText = generateSimpleReport(result);
      Alert.alert('Security Report', reportText, [{ text: 'OK', style: 'cancel' }]);
      
    } catch (error) {
      console.error('❌ PDF error:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  const generateSimpleReport = (scan) => {
    const safeScan = scan || {};
    return `
===========================================
        PHISHING DETECTION REPORT
===========================================

Scan ID: ${safeScan.id || 'N/A'}
Type: URL Scan
Date: ${safeScan.date ? new Date(safeScan.date).toLocaleString() : 'N/A'}
Content: ${safeScan.content || safeScan.url || 'N/A'}

Risk Score: ${safeScan.riskScore || 0}%
Classification: ${safeScan.classification || safeScan.result || 'Unknown'}
Confidence: ${safeScan.confidence ? (safeScan.confidence * 100).toFixed(1) + '%' : 'N/A'}

Explanation:
${safeScan.explanation || 'No explanation available'}

===========================================
    `.trim();
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please rate the detection accuracy');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(result.id, 'url', isAccurate, feedbackText, rating);
      setFeedbackSubmitted(true);
      Alert.alert('Thank You!', 'Your feedback has been submitted.');
      setTimeout(() => { setShowFeedback(false); setFeedbackSubmitted(false); }, 3000);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons 
            name={star <= rating ? 'star' : 'star-outline'} 
            size={32} 
            color={star <= rating ? '#ffc107' : colors.textMuted} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const getRiskLevel = (score) => {
    if (score > 70) return { 
      label: 'High Risk', 
      color: '#ef4444', 
      bg: '#fee2e2', 
      icon: '🚨',
      badge: 'Dangerous',
      gradient: ['#ef4444', '#dc2626']
    };
    if (score > 30) return { 
      label: 'Medium Risk', 
      color: '#f59e0b', 
      bg: '#fef3c7', 
      icon: '⚠️',
      badge: 'Suspicious',
      gradient: ['#f59e0b', '#d97706']
    };
    return { 
      label: 'Low Risk', 
      color: '#10b981', 
      bg: '#d1fae5', 
      icon: '✅',
      badge: 'Safe',
      gradient: ['#10b981', '#059669']
    };
  };

  const riskLevel = result ? getRiskLevel(result.riskScore) : null;

  // Render Risk Score Card - Professional Design
  const renderRiskScoreCard = () => {
    if (!result || !riskLevel) return null;
    
    return (
      <View style={[styles.riskCard, { 
        backgroundColor: 'white',
        borderColor: riskLevel.color + '40',
      }]}>
        <LinearGradient
          colors={[riskLevel.color + '10', 'transparent']}
          style={styles.riskGradient}
        />
        
        <View style={styles.riskHeader}>
          <View style={styles.riskHeaderLeft}>
            <Text style={styles.riskEmoji}>{riskLevel.icon}</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskLevel.bg }]}>
              <Text style={[styles.riskBadgeText, { color: riskLevel.color }]}>
                {riskLevel.badge}
              </Text>
            </View>
            <Text style={styles.riskLabel}>Risk Assessment</Text>
          </View>
        </View>

        <View style={styles.riskScoreRow}>
          <Text style={[styles.riskScoreValue, { color: riskLevel.color }]}>
            {Math.round(result.riskScore)}%
          </Text>
          <Text style={[styles.riskScoreLabel, { color: riskLevel.color }]}>
            {riskLevel.label}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { 
              width: `${Math.min(result.riskScore, 100)}%`,
              backgroundColor: riskLevel.color,
            }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0% Safe</Text>
            <Text style={styles.progressLabel}>50%</Text>
            <Text style={styles.progressLabel}>100% Dangerous</Text>
          </View>
        </View>

        <Text style={[styles.riskMessage, { color: riskLevel.color }]}>
          {result.riskScore > 70
            ? '⚠️ HIGH RISK: This website appears to be a phishing site! Do not proceed.'
            : result.riskScore > 30
            ? '⚠️ MEDIUM RISK: This website shows suspicious characteristics. Exercise caution.'
            : '✅ LOW RISK: This website appears to be safe.'}
        </Text>

        <TouchableOpacity 
          style={[styles.downloadButton, { backgroundColor: riskLevel.color }]}
          onPress={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={styles.downloadButtonText}>Download Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render Analysis Cards
  const renderAnalysisCards = () => {
    if (!result) return null;

    return (
      <View style={styles.analysisGrid}>
        {/* Classification Card */}
        <View style={[styles.analysisCard, { 
          backgroundColor: 'white',
          borderColor: colors.border,
        }]}>
          <View style={styles.analysisCardHeader}>
            <View style={[styles.analysisIcon, { backgroundColor: '#667eea20' }]}>
              <Ionicons name="information-circle-outline" size={22} color="#667eea" />
            </View>
            <View>
              <Text style={[styles.analysisTitle, { color: colors.text }]}>Classification</Text>
              <Text style={[styles.analysisSubtitle, { color: colors.textMuted }]}>AI-Powered Prediction</Text>
            </View>
          </View>
          <View style={[styles.analysisContent, { backgroundColor: colors.backgroundInput }]}>
            <Text style={[styles.analysisText, { color: colors.text }]}>
              {result.classification}
            </Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Ionicons name="checkmark-circle" size={16} color={riskLevel.color} />
            <Text style={[styles.confidenceText, { color: riskLevel.color }]}>
              Confidence: {((result.confidence || 0.5) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Explanation Card */}
        <View style={[styles.analysisCard, { 
          backgroundColor: 'white',
          borderColor: colors.border,
        }]}>
          <View style={styles.analysisCardHeader}>
            <View style={[styles.analysisIcon, { backgroundColor: '#f093fb20' }]}>
              <Ionicons name="warning-outline" size={22} color="#f5576c" />
            </View>
            <View>
              <Text style={[styles.analysisTitle, { color: colors.text }]}>Why It Was Flagged</Text>
              <Text style={[styles.analysisSubtitle, { color: colors.textMuted }]}>Key Indicators</Text>
            </View>
          </View>
          <View style={[styles.analysisContent, { backgroundColor: colors.backgroundInput }]}>
            <Text style={[styles.analysisText, { color: colors.text }]}>
              {result.explanation}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Technical Analysis
  const renderTechnicalAnalysis = () => {
    if (!result || !result.features) return null;

    const features = [
      { 
        label: 'URL Length', 
        value: result.features.urlLength || 'N/A',
        icon: 'link-outline',
        color: '#0ea5e9'
      },
      { 
        label: 'HTTPS Usage', 
        value: result.features.hasHTTPS ? 'Secure' : 'Not Secure',
        icon: result.features.hasHTTPS ? 'lock-closed-outline' : 'lock-open-outline',
        color: result.features.hasHTTPS ? '#10b981' : '#ef4444',
        isSecure: result.features.hasHTTPS
      },
      { 
        label: 'Special Characters', 
        value: result.features.specialChars || 0,
        icon: 'code-outline',
        color: '#f59e0b'
      },
      { 
        label: 'IP Address', 
        value: result.features.hasIP ? 'Detected' : 'Not Detected',
        icon: 'server-outline',
        color: result.features.hasIP ? '#ef4444' : '#10b981',
        isSecure: !result.features.hasIP
      },
      { 
        label: 'Suspicious Keywords', 
        value: result.features.hasSuspiciousKeywords ? 'Found' : 'Not Found',
        icon: 'people-outline',
        color: result.features.hasSuspiciousKeywords ? '#ef4444' : '#10b981',
        isSecure: !result.features.hasSuspiciousKeywords
      },
    ];

    return (
      <View style={[styles.technicalCard, { 
        backgroundColor: 'white',
        borderColor: colors.border,
      }]}>
        <View style={styles.technicalHeader}>
          <View style={[styles.technicalIcon, { backgroundColor: '#06b6d420' }]}>
            <Ionicons name="analytics-outline" size={22} color="#06b6d4" />
          </View>
          <View>
            <Text style={[styles.technicalTitle, { color: colors.text }]}>Technical Analysis</Text>
            <Text style={[styles.technicalSubtitle, { color: colors.textMuted }]}>Detailed URL Features</Text>
          </View>
        </View>

        <View style={styles.technicalGrid}>
          {features.map((item, index) => (
            <View key={index} style={[styles.technicalItem, { 
              backgroundColor: colors.backgroundInput,
              borderColor: item.isSecure !== undefined ? (item.isSecure ? '#6ee7b7' : '#fca5a5') : colors.border,
            }]}>
              <View style={[styles.technicalItemIcon, { 
                backgroundColor: item.color + '20',
              }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.technicalItemContent}>
                <Text style={[styles.technicalItemLabel, { color: colors.textMuted }]}>
                  {item.label}
                </Text>
                <Text style={[styles.technicalItemValue, { 
                  color: item.isSecure !== undefined ? (item.isSecure ? '#10b981' : '#ef4444') : colors.text 
                }]}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render Recommendation
  const renderRecommendation = () => {
    if (!result || !riskLevel) return null;

    return (
      <View style={[styles.recommendationCard, { 
        backgroundColor: riskLevel.bg,
        borderColor: riskLevel.color,
      }]}>
        <View style={styles.recommendationHeader}>
          <View style={[styles.recommendationIcon, { backgroundColor: riskLevel.color + '20' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color={riskLevel.color} />
          </View>
          <View>
            <Text style={[styles.recommendationTitle, { color: riskLevel.color }]}>
              Security Recommendation
            </Text>
            <Text style={[styles.recommendationSubtitle, { color: colors.textMuted }]}>
              What you should do next
            </Text>
          </View>
        </View>
        <Text style={[styles.recommendationText, { color: colors.text }]}>
          {result.riskScore > 70
            ? '🚫 DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.'
            : result.riskScore > 30
            ? '⚠️ Exercise extreme caution. Verify the website\'s authenticity through official channels before entering any personal information or credentials.'
            : '✅ You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.'}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
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
              <Ionicons name="link-outline" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>URL Scanner</Text>
              <Text style={styles.headerSubtitle}>Check suspicious links</Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.headerBadgeText}>AI-POWERED</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Input Card */}
      <View style={[styles.inputCard, { 
        backgroundColor: colors.backgroundCard,
        borderColor: colors.borderLight,
      }]}>
        <View style={styles.inputLabelContainer}>
          <Ionicons name="link-outline" size={18} color={colors.primary[600]} />
          <Text style={[styles.inputLabel, { color: colors.text }]}>Enter Website URL</Text>
        </View>
        
        <View style={[styles.inputContainer, { 
          borderColor: colors.border,
          backgroundColor: colors.backgroundInput,
        }]}>
          <Ionicons name="globe-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput 
            style={[styles.input, { color: colors.text }]} 
            placeholder="https://example.com" 
            placeholderTextColor={colors.textMuted} 
            value={url} 
            onChangeText={setUrl} 
            editable={!loading} 
            autoCapitalize="none"
            autoCorrect={false}
          />
          {url.length > 0 && (
            <TouchableOpacity onPress={() => setUrl('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.scanButton, loading && styles.scanButtonDisabled, { 
            backgroundColor: loading ? colors.textMuted : colors.primary[600],
          }]} 
          onPress={handleScan} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="white" />
              <Text style={styles.scanButtonText}>Scan URL</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.inputHint, { color: colors.textMuted }]}>
          Supports HTTP, HTTPS, and all standard URL formats
        </Text>
      </View>

      {error && (
        <View style={[styles.errorCard, { 
          backgroundColor: colors.danger + '15', 
          borderColor: colors.danger + '30',
        }]}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultsContainer}>
          {renderRiskScoreCard()}
          {renderAnalysisCards()}
          {renderTechnicalAnalysis()}
          {renderRecommendation()}

          {/* Feedback Section */}
          {showFeedback && !feedbackSubmitted && (
            <View style={[styles.feedbackCard, { 
              backgroundColor: colors.backgroundCard,
              borderColor: colors.border,
            }]}>
              <View style={styles.feedbackHeader}>
                <View style={[styles.feedbackIcon, { backgroundColor: colors.info + '20' }]}>
                  <Ionicons name="chatbubble" size={24} color={colors.info} />
                </View>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>Was this detection accurate?</Text>
              </View>
              
              <View style={styles.accuracyButtons}>
                <TouchableOpacity 
                  style={[styles.accuracyBtn, isAccurate && styles.accuracyBtnActive, { 
                    backgroundColor: isAccurate ? colors.success + '20' : colors.backgroundInput,
                    borderColor: isAccurate ? colors.success : colors.border,
                  }]} 
                  onPress={() => setIsAccurate(true)}
                >
                  <Ionicons name="thumbs-up" size={20} color={isAccurate ? colors.success : colors.textMuted} />
                  <Text style={[styles.accuracyBtnText, isAccurate && { color: colors.success }]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.accuracyBtn, !isAccurate && styles.accuracyBtnActive, { 
                    backgroundColor: !isAccurate ? colors.danger + '20' : colors.backgroundInput,
                    borderColor: !isAccurate ? colors.danger : colors.border,
                  }]} 
                  onPress={() => setIsAccurate(false)}
                >
                  <Ionicons name="thumbs-down" size={20} color={!isAccurate ? colors.danger : colors.textMuted} />
                  <Text style={[styles.accuracyBtnText, !isAccurate && { color: colors.danger }]}>No</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.ratingLabel, { color: colors.textMuted }]}>Rate the detection quality</Text>
              {renderStars()}
              
              <TextInput 
                style={[styles.commentsInput, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.backgroundInput,
                }]} 
                placeholder="Additional comments (optional)" 
                placeholderTextColor={colors.textMuted} 
                value={feedbackText} 
                onChangeText={setFeedbackText} 
                multiline 
                numberOfLines={3} 
              />
              
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: colors.primary[600] }]} 
                onPress={handleSubmitFeedback} 
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {feedbackSubmitted && (
            <View style={[styles.thankYouCard, { 
              backgroundColor: colors.success + '20', 
              borderColor: colors.success,
            }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.thankYouTitle, { color: colors.success }]}>Thank You!</Text>
              <Text style={[styles.thankYouText, { color: colors.textSecondary }]}>
                Your feedback helps us improve our detection accuracy.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 30 },

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
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },

  // Input
  inputCard: {
    marginHorizontal: 16,
    marginTop: -8,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  clearBtn: {
    paddingRight: 14,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },

  // Results
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Risk Score Card
  riskCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  riskGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riskEmoji: {
    fontSize: 28,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  riskScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    marginBottom: 16,
  },
  riskScoreValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  riskScoreLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  riskMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Analysis Cards
  analysisGrid: {
    gap: 16,
    marginBottom: 16,
  },
  analysisCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  analysisIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  analysisSubtitle: {
    fontSize: 12,
  },
  analysisContent: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Technical Analysis
  technicalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  technicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  technicalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  technicalSubtitle: {
    fontSize: 12,
  },
  technicalGrid: {
    gap: 10,
  },
  technicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  technicalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicalItemContent: {
    flex: 1,
  },
  technicalItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  technicalItemValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Recommendation
  recommendationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendationSubtitle: {
    fontSize: 12,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Feedback
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  feedbackIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  accuracyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  accuracyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  accuracyBtnActive: {
    borderWidth: 2,
  },
  accuracyBtnText: {
    fontWeight: '600',
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  commentsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 70,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Thank You
  thankYouCard: {
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  thankYouText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});