// src/screens/URLScannerScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGuest } from '../context/GuestContext';
import { getColors } from '../constants/colors';
import { scanURL, submitFeedback, getPrediction } from '../services/api';
import { downloadPDF } from '../services/pdfGenerator';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthModal from '../components/AuthModal';
import { showToast } from '../components/Toaster';
import { validateURL } from '../utils/validators';

const { width } = Dimensions.get('window');

export default function URLScannerScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { isAuthenticated } = useAuth();
  const { addScan } = useGuest();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackReply, setFeedbackReply] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Commented out - will be used in future
  // const [isAccurate, setIsAccurate] = useState(true);
  // const [rating, setRating] = useState(0);

  const handleScan = async () => {
    const validation = validateURL(url);
    if (!validation.isValid) {
      showToast(validation.error, 'error');
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    setShowFeedback(false);
    setFeedbackSubmitted(false);
    setFeedbackReply('');

    try {
      const response = await scanURL(url);
      console.log('API Response:', response);

      const prediction = getPrediction(response);
      const upperPrediction = prediction.toUpperCase();

      let riskScore = 50;
      let resultType = 'unknown';

      switch (upperPrediction) {
        case 'PHISHING':
        case 'DANGEROUS':
        case 'MALICIOUS':
          riskScore = 85;
          resultType = 'phishing';
          break;
        case 'SUSPICIOUS':
        case 'WARNING':
          riskScore = 55;
          resultType = 'suspicious';
          break;
        case 'SAFE':
        case 'LEGITIMATE':
          riskScore = 15;
          resultType = 'safe';
          break;
        default:
          riskScore = 50;
          resultType = 'unknown';
      }

      const scanResult = {
        reference: response.reference,
        url: url,
        prediction: prediction,
        classification: prediction || 'UNKNOWN',
        riskScore: riskScore,
        confidence: 0.85,
        explanation: response.conclusion || 'Analysis completed',
        result: resultType,
        scannedAt: response.scannedAt || new Date().toISOString(),
        type: 'url',
        content: url,
        conclusion: response.conclusion,
        phishingReasons: response.phishingReasons || [],
        legitimateReasons: response.legitimateReasons || [],
      };

      setResult(scanResult);

      if (!isAuthenticated) {
        addScan(scanResult);
      }

      setShowFeedback(true);
      setFeedbackMessage('');
      showToast('Scan completed successfully!', 'success');
    } catch (err) {
      console.error('Scan Error:', err);
      showToast(err.message || 'Failed to scan URL', 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to download reports', 'warning');
      setShowAuthModal(true);
      return;
    }

    if (!result) {
      showToast('No scan result available', 'error');
      return;
    }

    setDownloading(true);
    try {
      await downloadPDF(result, 'url');
      showToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to generate report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage || feedbackMessage.trim() === '') {
      showToast('Please provide your feedback', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitFeedback(feedbackMessage);
      console.log('Feedback Response:', response);
      
      if (response && response.reply) {
        setFeedbackReply(response.reply);
      }
      
      setFeedbackSubmitted(true);
      showToast('Thank you for your feedback! 🎉', 'success');
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackReply('');
      }, 5000);
    } catch (err) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Commented out - will be used in future
  // const renderStars = () => (
  //   <View style={styles.starsContainer}>
  //     {[1, 2, 3, 4, 5].map((star) => (
  //       <TouchableOpacity key={star} onPress={() => setRating(star)}>
  //         <Ionicons
  //           name={star <= rating ? 'star' : 'star-outline'}
  //           size={32}
  //           color={star <= rating ? '#ffc107' : colors.textMuted}
  //         />
  //       </TouchableOpacity>
  //     ))}
  //   </View>
  // );

  const getRiskLevel = (score) => {
    if (score > 70) return { label: 'High Risk', color: '#ef4444', bg: '#fee2e2', icon: '🚨', badge: 'Phishing' };
    if (score > 30) return { label: 'Medium Risk', color: '#f59e0b', bg: '#fef3c7', icon: '⚠️', badge: 'Suspicious' };
    return { label: 'Low Risk', color: '#10b981', bg: '#d1fae5', icon: '✅', badge: 'Safe' };
  };

  const riskLevel = result ? getRiskLevel(result.riskScore) : null;

  if (loading) {
    return <LoadingSpinner text="Scanning URL..." />;
  }

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

      {/* Error Display */}
      {error && (
        <View style={[styles.errorCard, {
          backgroundColor: colors.danger + '20',
          borderColor: colors.danger,
        }]}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultsContainer}>
          {/* Risk Score Card */}
          <View style={[styles.riskCard, {
            backgroundColor: 'white',
            borderColor: riskLevel.color + '40',
          }]}>
            <View style={styles.riskHeader}>
              <View style={styles.riskHeaderLeft}>
                <Text style={styles.riskEmoji}>{riskLevel.icon}</Text>
                <View style={[styles.riskBadge, { backgroundColor: riskLevel.bg }]}>
                  <Text style={[styles.riskBadgeText, { color: riskLevel.color }]}>
                    {riskLevel.badge}
                  </Text>
                </View>
                <Text style={styles.riskLabel}>Risk Assessment</Text>
                {result.reference && (
                  <Text style={[styles.riskRef, { color: colors.textMuted }]}>
                    Ref: {result.reference}
                  </Text>
                )}
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
                <Text style={styles.progressLabel}>Low Risk (0%)</Text>
                <Text style={styles.progressLabel}>Medium (50%)</Text>
                <Text style={styles.progressLabel}>High Risk (100%)</Text>
              </View>
            </View>

            <Text style={[styles.riskMessage, { color: riskLevel.color }]}>
              {result.riskScore > 70
                ? '🚫 HIGH RISK: This website appears to be a phishing site! Do not proceed.'
                : result.riskScore > 30
                  ? '⚠️ MEDIUM RISK: This website shows suspicious characteristics. Exercise caution.'
                  : '✅ LOW RISK: This website appears to be safe.'}
            </Text>

            <TouchableOpacity
              style={[styles.downloadButton, {
                backgroundColor: isAuthenticated ? riskLevel.color : colors.textMuted
              }]}
              onPress={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.downloadButtonText}>
                    {isAuthenticated ? 'Download Report' : 'Sign in to Download'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Classification Card */}
          <View style={[styles.infoCard, {
            backgroundColor: 'white',
            borderColor: colors.border,
          }]}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIcon, { backgroundColor: '#667eea20' }]}>
                <Ionicons name="information-circle-outline" size={22} color="#667eea" />
              </View>
              <View>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Classification</Text>
                <Text style={[styles.infoSubtitle, { color: colors.textMuted }]}>AI-Powered Prediction</Text>
              </View>
            </View>
            <View style={[styles.infoContent, { backgroundColor: colors.backgroundInput }]}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                {result.prediction || result.classification}
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
          <View style={[styles.infoCard, {
            backgroundColor: 'white',
            borderColor: colors.border,
          }]}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIcon, { backgroundColor: '#f093fb20' }]}>
                <Ionicons name="warning-outline" size={22} color="#f5576c" />
              </View>
              <View>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Why It Was Flagged</Text>
                <Text style={[styles.infoSubtitle, { color: colors.textMuted }]}>Key Indicators</Text>
              </View>
            </View>
            <View style={[styles.infoContent, { backgroundColor: colors.backgroundInput }]}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                {result.explanation}
              </Text>
            </View>
          </View>

          {/* Recommendation */}
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
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>Share Your Feedback</Text>
                <Text style={[styles.feedbackSubtitle, { color: colors.textMuted }]}>
                  Your feedback helps us improve our AI models
                </Text>
              </View>

              {/* Commented out - Will be used in future */}
              {/* <View style={styles.accuracyButtons}>
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
              </View> */}

              {/* Commented out - Will be used in future */}
              {/* <Text style={[styles.ratingLabel, { color: colors.textMuted }]}>Rate the detection quality</Text>
              {renderStars()} */}

              <View style={styles.feedbackInputContainer}>
                <Text style={[styles.feedbackLabel, { color: colors.text }]}>Your Feedback *</Text>
                <TextInput
                  style={[styles.commentsInput, {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.backgroundInput,
                  }]}
                  placeholder="Tell us about your experience... What could we improve?"
                  placeholderTextColor={colors.textMuted}
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {feedbackMessage.length}/500 characters
                </Text>
              </View>

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
              <Text style={[styles.thankYouTitle, { color: colors.success }]}>Thank You for Your Feedback!</Text>
              {feedbackReply && (
                <View style={styles.replyContainer}>
                  <Text style={[styles.replyText, { color: colors.text }]}>
                    💬 "{feedbackReply}"
                  </Text>
                </View>
              )}
              <Text style={[styles.thankYouText, { color: colors.textSecondary }]}>
                Your feedback helps us improve our detection accuracy.
              </Text>
            </View>
          )}
        </View>
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
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 30 },
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
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  riskCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
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
    flexWrap: 'wrap',
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
  riskRef: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'monospace',
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
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoSubtitle: {
    fontSize: 12,
  },
  infoContent: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoText: {
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
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  feedbackInputContainer: {
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  commentsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 4,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
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
    textAlign: 'center',
  },
  thankYouText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  replyContainer: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginTop: 12,
    maxWidth: '100%',
    width: '100%',
  },
  replyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

// export default URLScannerScreen;