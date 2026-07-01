import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { scanMessage, submitFeedback } from '../services/api';
import { validateMessage } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ResultCard from '../components/ResultCard';
import { Ionicons } from '@expo/vector-icons';

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
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={32} color={star <= rating ? '#ffc107' : colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={[styles.heroBadge, { backgroundColor: '#f5576c20' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#f5576c" />
          <Text style={[styles.heroBadgeText, { color: '#f5576c' }]}>SMS & Message Security</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Scam Message Detector</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>AI-powered scam detection for SMS, WhatsApp, and instant messages</Text>
      </View>

      <View style={[styles.inputCard, { 
        backgroundColor: colors.backgroundCard,
        shadowColor: colors.shadow,
      }]}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Paste Suspicious Message</Text>
        <TextInput
          style={[styles.textArea, { 
            borderColor: colors.border,
            color: colors.text,
          }]}
          placeholder="Paste the suspicious message here..."
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={handleMessageChange}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          editable={!loading}
        />
        <View style={styles.charCount}>
          <Text style={[styles.charCountText, { color: colors.textMuted }]}>Characters: {charCount}</Text>
          <Text style={[styles.charCountText, { color: colors.textMuted }]}>Minimum 10 characters recommended</Text>
        </View>
        <TouchableOpacity 
          style={[styles.scanButton, loading && styles.scanButtonDisabled, { backgroundColor: loading ? colors.textMuted : '#f5576c' }]} 
          onPress={handleScan} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.scanButtonText}>Analyze Message</Text>}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.errorCard, { backgroundColor: colors.danger + '10', borderLeftColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {result && <ResultCard result={result} type="message" />}

      {result?.extractedUrls?.length > 0 && (
        <View style={[styles.urlsCard, { 
          backgroundColor: colors.warning + '10', 
          borderColor: colors.warning 
        }]}>
          <Text style={[styles.urlsTitle, { color: colors.warning }]}>⚠️ Suspicious URLs Detected</Text>
          {result.extractedUrls.map((url, idx) => (
            <View key={idx} style={[styles.urlItem, { backgroundColor: colors.backgroundCard }]}>
              <Text style={[styles.urlText, { color: colors.text }]}>🔗 {url}</Text>
            </View>
          ))}
        </View>
      )}

      {showFeedback && !feedbackSubmitted && result && (
        <View style={[styles.feedbackCard, { 
          backgroundColor: colors.info + '10', 
          borderColor: colors.info,
        }]}>
          <Text style={[styles.feedbackTitle, { color: colors.info }]}>Was this detection accurate?</Text>
          <View style={styles.accuracyButtons}>
            <TouchableOpacity 
              style={[styles.accuracyBtn, isAccurate && styles.accuracyBtnActive, { 
                backgroundColor: isAccurate ? colors.success + '20' : colors.backgroundInput,
                borderColor: isAccurate ? colors.success : colors.border,
              }]} 
              onPress={() => setIsAccurate(true)}
            >
              <Ionicons name="thumbs-up" size={20} color={isAccurate ? colors.success : colors.textMuted} />
              <Text style={[styles.accuracyBtnText, isAccurate && { color: colors.success }]}>Yes, accurate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.accuracyBtn, !isAccurate && styles.accuracyBtnActive, { 
                backgroundColor: !isAccurate ? colors.danger + '20' : colors.backgroundInput,
                borderColor: !isAccurate ? colors.danger : colors.border,
              }]} 
              onPress={() => setIsAccurate(false)}
            >
              <Ionicons name="thumbs-down" size={20} color={!isAccurate ? colors.danger : colors.textMuted} />
              <Text style={[styles.accuracyBtnText, !isAccurate && { color: colors.danger }]}>No, inaccurate</Text>
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
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {feedbackSubmitted && (
        <View style={[styles.thankYouCard, { 
          backgroundColor: colors.success + '20', 
          borderColor: colors.success,
        }]}>
          <Ionicons name="thumbs-up" size={48} color={colors.success} />
          <Text style={[styles.thankYouTitle, { color: colors.success }]}>Thank You for Your Feedback!</Text>
          <Text style={[styles.thankYouText, { color: colors.textSecondary }]}>Your feedback helps us improve our scam detection accuracy.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 32 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginBottom: 16 },
  heroBadgeText: { fontSize: 14, fontWeight: '600' },
  heroTitle: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  heroSubtitle: { fontSize: 16, textAlign: 'center' },
  inputCard: { 
    borderRadius: 24, 
    padding: 20, 
    marginHorizontal: 20, 
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, minHeight: 180 },
  charCount: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 },
  charCountText: { fontSize: 12 },
  scanButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  scanButtonDisabled: { opacity: 0.6 },
  scanButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  errorCard: { borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 20, borderLeftWidth: 4 },
  errorText: { fontSize: 14 },
  urlsCard: { borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 20, borderWidth: 1 },
  urlsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  urlItem: { padding: 12, borderRadius: 12, marginBottom: 8 },
  urlText: { fontFamily: 'monospace', fontSize: 12 },
  feedbackCard: { borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 20, borderWidth: 1 },
  feedbackTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  accuracyButtons: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  accuracyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  accuracyBtnActive: { borderWidth: 2 },
  accuracyBtnText: { fontWeight: '600' },
  ratingLabel: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  commentsInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top', marginBottom: 20, minHeight: 80 },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  thankYouCard: { borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1 },
  thankYouTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  thankYouText: { fontSize: 14, textAlign: 'center' },
});