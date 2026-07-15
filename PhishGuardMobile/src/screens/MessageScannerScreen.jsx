import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { scanMessage, submitFeedback } from '../services/api';
import { downloadPDF } from '../services/pdfGenerator';
import { validateMessage } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGuest } from '../context/GuestContext';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RiskBadge from '../components/RiskBadge';
import { showToast } from '../components/Toaster';

const { width } = Dimensions.get('window');

export default function MessageScannerScreen() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const { addScan } = useGuest();
  const colors = getColors(isDark);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAccurate, setIsAccurate] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleMessageChange = (text) => {
    setMessage(text);
    setCharCount(text.length);
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

    try {
      const response = await scanMessage(message);
      
      const prediction = response.prediction?.toUpperCase() || 'UNKNOWN';
      let riskScore = 50;
      let resultType = 'unknown';
      
      switch (prediction) {
        case 'PHISHING':
        case 'DANGEROUS':
        case 'MALICIOUS':
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
      
      const scanResult = {
        reference: response.reference,
        message: message,
        content: message,
        prediction: response.prediction,
        classification: response.prediction || 'UNKNOWN',
        riskScore: riskScore,
        confidence: 0.85,
        explanation: response.conclusion || 'Analysis completed',
        result: resultType,
        scannedAt: response.scannedAt || new Date().toISOString(),
        type: 'message',
        conclusion: response.conclusion,
        phishingReasons: response.phishingReasons || [],
        legitimateReasons: response.legitimateReasons || [],
        features: extractMessageFeatures(message),
        extractedUrls: extractUrlsFromMessage(message),
      };
      
      setResult(scanResult);
      
      if (!isAuthenticated) {
        addScan(scanResult);
      }
      
      setShowFeedback(true);
      showToast('Message analysis completed!', 'success');
    } catch (err) {
      console.error('Scan Error:', err);
      showToast(err.message || 'Failed to scan message', 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractMessageFeatures = (text) => {
    const hasURL = /https?:\/\/[^\s]+/.test(text);
    const hasPhone = /\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}/.test(text);
    const suspiciousKeywords = [
      "urgent", "immediate", "verify", "confirm", "account", "password",
      "bank", "paypal", "credit card", "ssn", "social security",
      "win", "prize", "free", "offer", "limited time",
      "click here", "verify now", "update your", "security alert"
    ];
    const matches = suspiciousKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    const specialCharCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const uppercaseRatio =
      text.length > 0 ? (text.match(/[A-Z]/g) || []).length / text.length : 0;

    return {
      length: text.length,
      hasURL,
      hasPhone,
      suspiciousKeywordCount: matches.length,
      specialCharCount,
      uppercaseRatio,
      suspiciousKeywords: matches,
    };
  };

  const extractUrlsFromMessage = (text) => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  };

  const handleDownloadPDF = async () => {
    if (!result) {
      showToast('No scan result available', 'error');
      return;
    }

    setDownloading(true);
    try {
      await downloadPDF(result, 'message');
      showToast('Report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to generate report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      showToast('Please rate the detection accuracy', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(result.reference, 'message', isAccurate, feedbackText, rating);
      setFeedbackSubmitted(true);
      showToast('Thank you for your feedback!', 'success');
      setTimeout(() => { setShowFeedback(false); setFeedbackSubmitted(false); }, 3000);
    } catch (err) {
      showToast(err.message || 'Failed to submit feedback', 'error');
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
    if (score > 70) return { label: 'High Risk', color: '#ef4444', bg: '#fee2e2', icon: '🚨', badge: 'Scam' };
    if (score > 30) return { label: 'Medium Risk', color: '#f59e0b', bg: '#fef3c7', icon: '⚠️', badge: 'Suspicious' };
    return { label: 'Low Risk', color: '#10b981', bg: '#d1fae5', icon: '✅', badge: 'Safe' };
  };

  const riskLevel = result ? getRiskLevel(result.riskScore) : null;

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
                <Text style={styles.riskLabel}>Scam Assessment</Text>
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
                <Text style={styles.progressLabel}>Safe</Text>
                <Text style={styles.progressLabel}>Suspicious</Text>
                <Text style={styles.progressLabel}>Dangerous</Text>
              </View>
            </View>

            <Text style={[styles.riskMessage, { color: riskLevel.color }]}>
              {result.riskScore > 70
                ? '🚨 HIGH RISK: This is likely a scam! Do not respond or click any links.'
                : result.riskScore > 30
                ? '⚠️ MEDIUM RISK: This message shows scam indicators. Exercise caution.'
                : '✅ LOW RISK: This message appears legitimate.'}
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
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#f5576c" />
              </View>
              <View>
                <Text style={[styles.infoTitle, { color: colors.text }]}>AI Classification</Text>
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

          {/* Red Flags Card */}
          <View style={[styles.infoCard, { 
            backgroundColor: 'white',
            borderColor: colors.border,
          }]}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIcon, { backgroundColor: '#fa709a20' }]}>
                <Ionicons name="flag-outline" size={22} color="#fa709a" />
              </View>
              <View>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Red Flags Detected</Text>
                <Text style={[styles.infoSubtitle, { color: colors.textMuted }]}>Key Scam Indicators</Text>
              </View>
            </View>
            <View style={[styles.infoContent, { backgroundColor: colors.backgroundInput }]}>
              <Text style={[styles.infoText, { color: colors.text }]}>
                {result.explanation}
              </Text>
            </View>
          </View>

          {/* Message Features */}
          {result.features && (
            <View style={[styles.featuresCard, { 
              backgroundColor: 'white',
              borderColor: colors.border,
            }]}>
              <View style={styles.featuresHeader}>
                <View style={[styles.featuresIcon, { backgroundColor: '#06b6d420' }]}>
                  <Ionicons name="stats-chart-outline" size={22} color="#06b6d4" />
                </View>
                <View>
                  <Text style={[styles.featuresTitle, { color: colors.text }]}>Message Analysis Details</Text>
                  <Text style={[styles.featuresSubtitle, { color: colors.textMuted }]}>Technical Message Features</Text>
                </View>
              </View>

              <View style={styles.featuresGrid}>
                <View style={[styles.featureItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: colors.border,
                }]}>
                  <View style={[styles.featureItemIcon, { backgroundColor: '#0ea5e920' }]}>
                    <Ionicons name="text-outline" size={18} color="#0ea5e9" />
                  </View>
                  <View style={styles.featureItemContent}>
                    <Text style={[styles.featureItemLabel, { color: colors.textMuted }]}>Message Length</Text>
                    <Text style={[styles.featureItemValue, { color: colors.text }]}>{result.features.length || 0} chars</Text>
                  </View>
                </View>

                <View style={[styles.featureItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: colors.border,
                }]}>
                  <View style={[styles.featureItemIcon, { backgroundColor: '#f59e0b20' }]}>
                    <Ionicons name="trending-up-outline" size={18} color="#f59e0b" />
                  </View>
                  <View style={styles.featureItemContent}>
                    <Text style={[styles.featureItemLabel, { color: colors.textMuted }]}>Uppercase Ratio</Text>
                    <Text style={[styles.featureItemValue, { color: colors.text }]}>
                      {((result.features.uppercaseRatio || 0) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: result.features.hasURL ? '#fca5a5' : '#6ee7b7',
                }]}>
                  <View style={[styles.featureItemIcon, { 
                    backgroundColor: result.features.hasURL ? '#ef444420' : '#10b98120' 
                  }]}>
                    <Ionicons name="link-outline" size={18} color={result.features.hasURL ? '#ef4444' : '#10b981'} />
                  </View>
                  <View style={styles.featureItemContent}>
                    <Text style={[styles.featureItemLabel, { color: colors.textMuted }]}>Contains URL</Text>
                    <Text style={[styles.featureItemValue, { 
                      color: result.features.hasURL ? '#ef4444' : '#10b981' 
                    }]}>
                      {result.features.hasURL ? '⚠️ Yes' : '✓ No'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: result.features.hasPhone ? '#fca5a5' : '#6ee7b7',
                }]}>
                  <View style={[styles.featureItemIcon, { 
                    backgroundColor: result.features.hasPhone ? '#ef444420' : '#10b98120' 
                  }]}>
                    <Ionicons name="call-outline" size={18} color={result.features.hasPhone ? '#ef4444' : '#10b981'} />
                  </View>
                  <View style={styles.featureItemContent}>
                    <Text style={[styles.featureItemLabel, { color: colors.textMuted }]}>Contains Phone</Text>
                    <Text style={[styles.featureItemValue, { 
                      color: result.features.hasPhone ? '#ef4444' : '#10b981' 
                    }]}>
                      {result.features.hasPhone ? '⚠️ Yes' : '✓ No'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: (result.features.suspiciousKeywordCount || 0) > 0 ? '#fca5a5' : '#6ee7b7',
                }]}>
                  <View style={[styles.featureItemIcon, { 
                    backgroundColor: (result.features.suspiciousKeywordCount || 0) > 0 ? '#ef444420' : '#10b98120' 
                  }]}>
                    <Ionicons name="warning-outline" size={18} color={(result.features.suspiciousKeywordCount || 0) > 0 ? '#ef4444' : '#10b981'} />
                  </View>
                  <View style={styles.featureItemContent}>
                    <Text style={[styles.featureItemLabel, { color: colors.textMuted }]}>Suspicious Keywords</Text>
                    <Text style={[styles.featureItemValue, { color: colors.text }]}>
                      {result.features.suspiciousKeywordCount || 0} found
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: colors.border,
                }]}>
                  <View style={[styles.featureItemIcon, { backgroundColor: '#8b5cf620' }]}>
                    <Ionicons name="at-outline" size={18} color="#8b5cf6" />
                  </View>
                  <View style={styles.featureItemContent}>
                    <Text style={[styles.featureItemLabel, { color: colors.textMuted }]}>Special Symbols</Text>
                    <Text style={[styles.featureItemValue, { color: colors.text }]}>
                      {result.features.specialCharCount || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Extracted URLs */}
          {result.extractedUrls && result.extractedUrls.length > 0 && (
            <View style={[styles.urlsCard, { 
              backgroundColor: 'white',
              borderColor: '#fcd34d',
            }]}>
              <View style={styles.urlsHeader}>
                <View style={[styles.urlsIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="link-outline" size={22} color="#ed6c02" />
                </View>
                <View>
                  <Text style={[styles.urlsTitle, { color: '#ed6c02' }]}>Suspicious URLs Detected</Text>
                  <Text style={[styles.urlsSubtitle, { color: colors.textMuted }]}>
                    {result.extractedUrls.length} suspicious link{result.extractedUrls.length > 1 ? 's' : ''} found
                  </Text>
                </View>
              </View>
              {result.extractedUrls.map((url, idx) => (
                <View key={idx} style={[styles.urlItem, { 
                  backgroundColor: colors.backgroundInput,
                  borderColor: colors.border,
                }]}>
                  <Ionicons name="warning" size={16} color="#ef4444" />
                  <Text style={[styles.urlText, { color: colors.text }]} numberOfLines={1}>
                    {url}
                  </Text>
                </View>
              ))}
              <Text style={[styles.urlNote, { color: '#ed6c02' }]}>
                These URLs have been automatically analyzed and contributed to the risk score.
              </Text>
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
              <Text style={[styles.thankYouTitle, { color: colors.success }]}>Thank You!</Text>
              <Text style={[styles.thankYouText, { color: colors.textSecondary }]}>
                Your feedback helps us improve our scam detection accuracy.
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
  featuresCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  featuresIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  featuresSubtitle: {
    fontSize: 12,
  },
  featuresGrid: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureItemContent: {
    flex: 1,
  },
  featureItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  featureItemValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  urlsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  urlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  urlsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  urlsSubtitle: {
    fontSize: 12,
  },
  urlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  urlText: {
    fontSize: 13,
    flex: 1,
    fontFamily: 'monospace',
  },
  urlNote: {
    fontSize: 12,
    marginTop: 8,
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