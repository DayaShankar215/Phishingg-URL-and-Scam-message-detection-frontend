// src/screens/MessageScannerScreen.jsx
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
import { scanMessage, submitFeedbackMessage, submitAccuracy, getPrediction } from '../services/api';
import { downloadPDF } from '../services/pdfGenerator';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthModal from '../components/AuthModal';
import { showToast } from '../components/Toaster';
import { validateMessage } from '../utils/validators';

const { width } = Dimensions.get('window');

export default function MessageScannerScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { isAuthenticated } = useAuth();
  const { addScan } = useGuest();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackReply, setFeedbackReply] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // ✅ Accuracy feedback state
  const [scanId, setScanId] = useState('');
  const [accuracy, setAccuracy] = useState({ isAccurate: null });
  const [accuracySubmitted, setAccuracySubmitted] = useState(false);

  const handleMessageChange = (text) => {
    setMessage(text);
    setCharCount(text.length);
  };

  const processScanResponse = (response, scannedMessage) => {
    const rawPrediction = getPrediction(response);
    const prediction = rawPrediction;
    
    let riskScore = 50;
    let resultType = 'unknown';

    const upperPrediction = prediction.toUpperCase().trim();
    
    switch (upperPrediction) {
      case 'PHISHING':
      case 'DANGEROUS':
      case 'MALICIOUS':
        riskScore = 85;
        resultType = 'phishing';
        break;
      case 'SCAM':
        riskScore = 85;
        resultType = 'scam';
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

    return {
      reference: response.reference,
      message: scannedMessage || response.message || '',
      content: scannedMessage || response.message || '',
      prediction: prediction,
      classification: prediction || 'UNKNOWN',
      riskScore: riskScore,
      explanation: response.conclusion || 'Analysis completed',
      result: resultType,
      scannedAt: response.scannedAt || new Date().toISOString(),
      type: 'message',
      conclusion: response.conclusion,
      phishingReasons: response.phishingReasons || [],
      legitimateReasons: response.legitimateReasons || [],
      _raw: response,
    };
  };

  const handleScan = async () => {
    const validation = validateMessage(message);
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
    setAccuracySubmitted(false);
    setScanId('');
    setAccuracy({ isAccurate: null });

    try {
      const response = await scanMessage(message);
      console.log('API Response:', response);

      const scanResult = processScanResponse(response, message);
      console.log('Processed Result:', scanResult);
      setResult(scanResult);

      if (!isAuthenticated) {
        addScan(scanResult);
      }

      const reference = response.reference || '';
      setScanId(reference);

      setShowFeedback(true);
      setFeedbackMessage('');
      showToast('Message analysis completed!', 'success');
    } catch (err) {
      console.error('Scan Error:', err);
      showToast(err.message || 'Failed to scan message', 'error');
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
      const pdfData = {
        reference: result.reference,
        scanType: result._raw?.scanType || "MESSAGE",
        message: result.message || result.content,
        prediction: result.prediction,
        riskScore: result.riskScore,
        conclusion: result.conclusion || result.explanation,
        scannedAt: result.scannedAt,
        phishingReasons: result._raw?.messagePhishingReasons || result.phishingReasons || [],
        legitimateReasons: result._raw?.messageLegitimateReasons || result.legitimateReasons || [],
        urlsFound: result._raw?.urlsFound || [],
        urlResults: result._raw?.urlResults || [],
        messagePhishingReasons: result._raw?.messagePhishingReasons || [],
        messageLegitimateReasons: result._raw?.messageLegitimateReasons || [],
        overallPrediction: result.prediction,
        messagePrediction: result._raw?.messagePrediction || result.prediction,
      };
      
      await downloadPDF(pdfData, 'message');
      showToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to generate report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // ✅ FIXED: Accuracy feedback with toggle support
  const handleAccuracySelect = async (isAccurate) => {
    console.log('Scan ID:', scanId);
    
    if (!scanId || scanId.trim() === '') {
      showToast('Scan ID not found. Please try scanning again.', 'error');
      console.error('Scan ID is null or empty:', scanId);
      return;
    }

    // ✅ If user clicks the same option, deselect it (toggle off)
    if (accuracy.isAccurate === isAccurate) {
      setAccuracy({ isAccurate: null });
      setAccuracySubmitted(false);
      return;
    }

    setAccuracy({ isAccurate });
    
    try {
      console.log('Submitting accuracy with:', {
        reference: scanId,
        accurate: isAccurate
      });
      
      const response = await submitAccuracy({
        reference: scanId,
        accurate: isAccurate
      });
      
      console.log('Accuracy Response:', response);
      setAccuracySubmitted(true);
      
      if (response?.reply) {
        showToast(response.reply, 'success');
      } else {
        showToast('Thank you for your feedback!', 'success');
      }
    } catch (error) {
      console.error('Accuracy Submit Error:', error);
      
      if (error.status === 403 || error.isAuthError) {
        showToast('Please log in to submit accuracy feedback.', 'warning');
        setShowAuthModal(true);
      } else {
        showToast(error.message || 'Failed to submit accuracy', 'error');
      }
      setAccuracy({ isAccurate: null });
      setAccuracySubmitted(false);
    }
  };

  // ✅ FIXED: Feedback message submission with better error handling
  const handleSubmitFeedback = async () => {
    if (!feedbackMessage || feedbackMessage.trim() === '') {
      showToast('Please provide your feedback', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitFeedbackMessage(feedbackMessage);
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
      console.error('Feedback Submit Error:', err);
      
      if (err.status === 403 || err.isAuthError) {
        showToast('Please log in to submit feedback.', 'warning');
        setShowAuthModal(true);
      } else {
        showToast(err.message || 'Failed to submit feedback', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score > 70) return { label: 'High Risk', color: '#ef4444', bg: '#fee2e2', icon: '🚨', badge: 'Scam' };
    if (score > 30) return { label: 'Medium Risk', color: '#f59e0b', bg: '#fef3c7', icon: '⚠️', badge: 'Suspicious' };
    return { label: 'Low Risk', color: '#10b981', bg: '#d1fae5', icon: '✅', badge: 'Safe' };
  };

  const riskLevel = result ? getRiskLevel(result.riskScore) : null;

  if (loading) {
    return <LoadingSpinner text="Analyzing message..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#f093fb', '#f5576c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Message Scanner</Text>
              <Text style={styles.headerSubtitle}>Detect scam messages</Text>
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
          <Ionicons name="chatbubble-outline" size={18} color="#f5576c" />
          <Text style={[styles.inputLabel, { color: colors.text }]}>Paste Suspicious Message</Text>
        </View>

        <View style={[styles.textAreaContainer, {
          borderColor: colors.border,
          backgroundColor: colors.backgroundInput,
        }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            placeholder="Paste the suspicious message here..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={handleMessageChange}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            editable={!loading}
          />
          <View style={styles.charCountContainer}>
            <Text style={[styles.charCountText, { color: colors.textMuted }]}>
              {charCount} characters
            </Text>
            <Text style={[styles.charCountText, { color: colors.textMuted }]}>
              Min 10 recommended
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled, {
            backgroundColor: loading ? colors.textMuted : '#f5576c',
          }]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="white" />
              <Text style={styles.scanButtonText}>Analyze Message</Text>
            </>
          )}
        </TouchableOpacity>
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
                {result.reference && (
                  <Text style={[styles.riskRef, { color: colors.textMuted }]}>
                    Ref: {result.reference}
                  </Text>
                )}
              </View>
            </View>

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

          {/* Message Content */}
          <View style={[styles.messageCard, {
            backgroundColor: 'white',
            borderColor: colors.border,
          }]}>
            <View style={styles.messageHeader}>
              <View style={[styles.messageIcon, { backgroundColor: '#f093fb20' }]}>
                <Ionicons name="chatbubble-outline" size={22} color="#f5576c" />
              </View>
              <View>
                <Text style={[styles.messageTitle, { color: colors.text }]}>Analyzed Message</Text>
                <Text style={[styles.messageSubtitle, { color: colors.textMuted }]}>Content that was scanned</Text>
              </View>
            </View>
            <View style={[styles.messageContent, {
              backgroundColor: colors.backgroundInput,
              borderLeftColor: riskLevel.color,
            }]}>
              <Text style={[styles.messageText, { color: colors.text }]}>
                "{result.message || result.content}"
              </Text>
            </View>
          </View>

          {/* Classification Card */}
          <View style={[styles.infoCard, {
            backgroundColor: 'white',
            borderColor: colors.border,
          }]}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIcon, { backgroundColor: '#f093fb20' }]}>
                <Ionicons name="information-circle-outline" size={22} color="#f5576c" />
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
          </View>

          {/* Analysis Details */}
          <View style={[styles.infoCard, {
            backgroundColor: 'white',
            borderColor: colors.border,
          }]}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIcon, { backgroundColor: '#fa709a20' }]}>
                <Ionicons name="flag-outline" size={22} color="#fa709a" />
              </View>
              <View>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Analysis Details</Text>
                <Text style={[styles.infoSubtitle, { color: colors.textMuted }]}>Key Scam Indicators</Text>
              </View>
            </View>
            <View style={[styles.infoContent, { backgroundColor: colors.backgroundInput }]}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                {result.explanation}
              </Text>
            </View>
          </View>

          {/* Message Phishing Reasons */}
          {result._raw?.messagePhishingReasons && result._raw.messagePhishingReasons.length > 0 && (
            <View style={[styles.warningCard, {
              backgroundColor: '#fee2e2',
              borderColor: '#fca5a5',
            }]}>
              <Text style={[styles.warningTitle, { color: '#dc2626' }]}>
                🚨 Message Phishing Indicators
              </Text>
              {result._raw.messagePhishingReasons.map((reason, index) => (
                <Text key={index} style={[styles.warningText, { color: '#475569' }]}>
                  • {reason}
                </Text>
              ))}
            </View>
          )}

          {/* URLs Found */}
          {result._raw?.urlsFound && result._raw.urlsFound.length > 0 && (
            <View style={[styles.urlsCard, {
              backgroundColor: '#fef3c7',
              borderColor: '#fcd34d',
            }]}>
              <Text style={[styles.urlsTitle, { color: '#d97706' }]}>
                🔗 URLs Found in Message
              </Text>
              {result._raw.urlsFound.map((url, index) => {
                const urlResult = result._raw.urlResults?.[index];
                return (
                  <View key={index} style={[styles.urlItem, {
                    backgroundColor: 'white',
                    borderColor: '#e2e8f0',
                  }]}>
                    <Text style={[styles.urlText, { color: '#1e293b' }]} numberOfLines={1}>
                      {url}
                    </Text>
                    {urlResult && (
                      <View style={[styles.urlPredBadge, {
                        backgroundColor: urlResult.prediction === 'LEGITIMATE' ? '#d1fae5' : '#fee2e2',
                      }]}>
                        <Text style={[styles.urlPredText, {
                          color: urlResult.prediction === 'LEGITIMATE' ? '#065f46' : '#dc2626',
                        }]}>
                          {urlResult.prediction || 'UNKNOWN'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

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
                ? '🚫 DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier.'
                : result.riskScore > 30
                  ? '⚠️ Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels.'
                  : '✓ This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers.'}
            </Text>
          </View>

          {/* ✅ Feedback Section with Toggle Support */}
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

              {/* Scan ID */}
              <Text style={[styles.scanIdText, { color: colors.textMuted }]}>
                Scan ID: {scanId || 'Not set'}
              </Text>

              {/* ✅ Accuracy Buttons with Toggle */}
              <View style={styles.accuracyButtons}>
                <TouchableOpacity
                  style={[
                    styles.accuracyBtn,
                    accuracy.isAccurate === true && styles.accuracyBtnActive,
                    {
                      backgroundColor: accuracy.isAccurate === true ? colors.success + '20' : colors.backgroundInput,
                      borderColor: accuracy.isAccurate === true ? colors.success : colors.border,
                    }
                  ]}
                  onPress={() => handleAccuracySelect(true)}
                >
                  <Ionicons 
                    name="thumbs-up" 
                    size={20} 
                    color={accuracy.isAccurate === true ? colors.success : colors.textMuted} 
                  />
                  <Text style={[
                    styles.accuracyBtnText, 
                    accuracy.isAccurate === true && { color: colors.success }
                  ]}>
                    Yes, accurate
                  </Text>
                  {accuracy.isAccurate === true && (
                    <Text style={[styles.checkmark, { color: colors.success }]}>✓</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.accuracyBtn,
                    accuracy.isAccurate === false && styles.accuracyBtnActive,
                    {
                      backgroundColor: accuracy.isAccurate === false ? colors.danger + '20' : colors.backgroundInput,
                      borderColor: accuracy.isAccurate === false ? colors.danger : colors.border,
                    }
                  ]}
                  onPress={() => handleAccuracySelect(false)}
                >
                  <Ionicons 
                    name="thumbs-down" 
                    size={20} 
                    color={accuracy.isAccurate === false ? colors.danger : colors.textMuted} 
                  />
                  <Text style={[
                    styles.accuracyBtnText, 
                    accuracy.isAccurate === false && { color: colors.danger }
                  ]}>
                    No, inaccurate
                  </Text>
                  {accuracy.isAccurate === false && (
                    <Text style={[styles.checkmark, { color: colors.danger }]}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>

              {accuracySubmitted && accuracy.isAccurate !== null && (
                <Text style={[styles.accuracySubmittedText, { color: colors.success }]}>
                  ✓ Accuracy feedback submitted successfully
                </Text>
              )}

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
                style={[styles.submitBtn, { backgroundColor: '#f5576c' }]}
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
                Your feedback helps us improve our scam detection accuracy.
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
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 16,
  },
  textArea: {
    fontSize: 15,
    minHeight: 120,
    paddingVertical: 0,
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  charCountText: {
    fontSize: 11,
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
  riskRef: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'monospace',
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
  messageCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  messageSubtitle: {
    fontSize: 12,
  },
  messageContent: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
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
  warningCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  urlsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  urlsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  urlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  urlText: {
    fontSize: 13,
    flex: 1,
    fontFamily: 'monospace',
  },
  urlPredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  urlPredText: {
    fontSize: 10,
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
  scanIdText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  accuracyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  accuracySubmittedText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
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

//export default MessageScannerScreen;