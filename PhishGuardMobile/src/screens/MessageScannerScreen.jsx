// screens/MessageScannerScreen.jsx
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Dimensions, Platform 
} from 'react-native';
import { 
  scanMessage, 
  submitFeedback, 
  downloadAndSharePDF, 
  generatePDFReport 
} from '../services/api';
import { validateMessage } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ResultCard from '../components/ResultCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function MessageScannerScreen() {
  const { isDark } = useTheme();
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
  const [downloadProgress, setDownloadProgress] = useState('');

  const handleMessageChange = (text) => {
    setMessage(text);
    setCharCount(text.length);
  };

  const handleScan = async () => {
    const validation = validateMessage(message);
    if (!validation.isValid) {
      Alert.alert('Invalid Message', validation.error);
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    setShowFeedback(false);
    setFeedbackSubmitted(false);

    try {
      const response = await scanMessage(message);
      setResult(response);
      setShowFeedback(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to scan message');
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
      
      // Try to download from backend
      try {
        setDownloadProgress('Downloading from server...');
        const { fileUri, saved } = await downloadAndSharePDF(result.id, 'message');
        
        setDownloadProgress('✅ Download complete!');
        
        // Show success message with file location
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
      
      // Fallback: Generate local PDF
      try {
        setDownloadProgress('Generating local report...');
        const fileUri = await generatePDFReport(result, 'message');
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
      
      // Last resort: Show report in dialog
      const reportText = generateSimpleReport(result);
      Alert.alert(
        'Security Report',
        reportText,
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: '📋 Copy', 
            onPress: () => {
              Alert.alert('Info', 'Report text ready');
            }
          }
        ]
      );
      
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
Type: Message Scan
Date: ${safeScan.date ? new Date(safeScan.date).toLocaleString() : 'N/A'}
Content: ${safeScan.message || safeScan.content || 'N/A'}

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
      await submitFeedback(result.id, 'message', isAccurate, feedbackText, rating);
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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
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

      {error && (
        <View style={[styles.errorCard, { 
          backgroundColor: colors.danger + '15', 
          borderColor: colors.danger + '30',
        }]}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {result && (
        <>
          <View style={[styles.pdfButtonContainer, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderLight,
          }]}>
            <TouchableOpacity 
              style={[styles.pdfButton, downloading && styles.pdfButtonDisabled, { 
                backgroundColor: downloading ? colors.textMuted + '30' : '#f5576c15',
                borderColor: downloading ? colors.textMuted : '#f5576c30',
              }]}
              onPress={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <ActivityIndicator size="small" color="#f5576c" />
                  <Text style={[styles.pdfButtonText, { color: '#f5576c' }]}>
                    {downloadProgress || 'Downloading...'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={22} color="#f5576c" />
                  <Text style={[styles.pdfButtonText, { color: '#f5576c' }]}>
                    Download PDF Report
                  </Text>
                  <Ionicons name="download-outline" size={18} color="#f5576c" />
                </>
              )}
            </TouchableOpacity>
            
            <Text style={[styles.pdfHint, { color: colors.textMuted }]}>
              {Platform.OS === 'android' ? 'PDF will be saved to your device storage' : 'PDF will be saved and shared'}
            </Text>
          </View>

          <ResultCard result={result} type="message" />
        </>
      )}

      {result?.extractedUrls?.length > 0 && (
        <View style={[styles.urlsCard, { 
          backgroundColor: colors.warning + '15', 
          borderColor: colors.warning + '30',
        }]}>
          <View style={styles.urlsHeader}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={[styles.urlsTitle, { color: colors.warning }]}>Suspicious URLs Detected</Text>
          </View>
          {result.extractedUrls.map((url, idx) => (
            <View key={idx} style={[styles.urlItem, { 
              backgroundColor: colors.backgroundCard,
              borderColor: colors.border,
            }]}>
              <Ionicons name="link-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.urlText, { color: colors.text }]}>{url}</Text>
            </View>
          ))}
        </View>
      )}

      {showFeedback && !feedbackSubmitted && result && (
        <View style={[styles.feedbackCard, { 
          backgroundColor: colors.info + '10', 
          borderColor: colors.info,
        }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="chatbubble" size={24} color={colors.info} />
            <Text style={[styles.feedbackTitle, { color: colors.info }]}>Was this detection accurate?</Text>
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

          <Text style={[styles.ratingLabel, { color: colors.info }]}>Rate the detection quality</Text>
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
  pdfButtonContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pdfButtonDisabled: {
    opacity: 0.6,
  },
  pdfButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pdfHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  urlsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  urlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  urlsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  urlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  urlText: {
    fontSize: 12,
    flex: 1,
    fontFamily: 'monospace',
  },
  feedbackCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    marginHorizontal: 16,
    marginTop: 20,
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