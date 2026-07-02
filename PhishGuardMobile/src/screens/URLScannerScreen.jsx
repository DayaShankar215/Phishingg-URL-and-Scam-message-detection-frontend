import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Dimensions 
} from 'react-native';
import { scanURL, submitFeedback, downloadAndSharePDF, generatePDFReport } from '../services/api';
import { validateURL } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ResultCard from '../components/ResultCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    if (!result) return;
    
    setDownloading(true);
    try {
      // Try to download from backend first, fallback to generate locally
      try {
        await downloadAndSharePDF(result.id, 'url');
        Alert.alert('Success', 'PDF downloaded and ready to share!');
      } catch (err) {
        // If backend PDF fails, generate locally
        const fileUri = await generatePDFReport(result, 'url');
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
      Alert.alert('Error', 'Failed to submit feedback');
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

      {result && (
        <>
          {/* Download PDF Button */}
          <View style={[styles.pdfButtonContainer, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderLight,
          }]}>
            <TouchableOpacity 
              style={[styles.pdfButton, { 
                backgroundColor: colors.primary[600] + '15',
                borderColor: colors.primary[600] + '30',
              }]}
              onPress={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={22} color={colors.primary[600]} />
                  <Text style={[styles.pdfButtonText, { color: colors.primary[600] }]}>
                    Download PDF Report
                  </Text>
                  <Ionicons name="download-outline" size={18} color={colors.primary[600]} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <ResultCard result={result} type="url" />
        </>
      )}

      {/* Feedback Section */}
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

  // Input Card
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

  // PDF Download Button
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
  pdfButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Feedback
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

  // Thank You
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