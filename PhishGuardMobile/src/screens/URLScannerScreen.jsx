import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { scanURL, submitFeedback } from '../services/api';
import { validateURL } from '../utils/validators';
import Colors from '../constants/colors';
import ResultCard from '../components/ResultCard';
import { Ionicons } from '@expo/vector-icons';

export default function URLScannerScreen() {
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
          <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={32} color={star <= rating ? '#ffc107' : '#cbd5e1'} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="shield-outline" size={16} color={Colors.primary[600]} />
          <Text style={styles.heroBadgeText}>AI-Powered Security Scanner</Text>
        </View>
        <Text style={styles.heroTitle}>URL Security Scanner</Text>
        <Text style={styles.heroSubtitle}>Instantly detect phishing URLs using advanced machine learning</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Enter Website URL</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="link-outline" size={20} color={Colors.gray} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="https://example.com" placeholderTextColor={Colors.gray} value={url} onChangeText={setUrl} editable={!loading} />
        </View>
        <TouchableOpacity style={[styles.scanButton, loading && styles.scanButtonDisabled]} onPress={handleScan} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.scanButtonText}>Scan URL</Text>}
        </TouchableOpacity>
        <Text style={styles.inputHint}>Supports HTTP, HTTPS, and all standard URL formats</Text>
      </View>

      {error && <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View>}

      {result && <ResultCard result={result} type="url" />}

      {showFeedback && !feedbackSubmitted && result && (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Was this detection accurate?</Text>
          <View style={styles.accuracyButtons}>
            <TouchableOpacity style={[styles.accuracyBtn, isAccurate && styles.accuracyBtnActive]} onPress={() => setIsAccurate(true)}>
              <Ionicons name="thumbs-up" size={20} color={isAccurate ? Colors.success : Colors.gray} /><Text style={[styles.accuracyBtnText, isAccurate && { color: Colors.success }]}>Yes, accurate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.accuracyBtn, !isAccurate && styles.accuracyBtnActive]} onPress={() => setIsAccurate(false)}>
              <Ionicons name="thumbs-down" size={20} color={!isAccurate ? Colors.danger : Colors.gray} /><Text style={[styles.accuracyBtnText, !isAccurate && { color: Colors.danger }]}>No, inaccurate</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.ratingLabel}>Rate the detection quality</Text>
          {renderStars()}
          <TextInput style={styles.commentsInput} placeholder="Additional comments (optional)" placeholderTextColor={Colors.gray} value={feedbackText} onChangeText={setFeedbackText} multiline numberOfLines={3} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitFeedback} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {feedbackSubmitted && (
        <View style={styles.thankYouCard}>
          <Ionicons name="thumbs-up" size={48} color={Colors.success} />
          <Text style={styles.thankYouTitle}>Thank You for Your Feedback!</Text>
          <Text style={styles.thankYouText}>Your feedback helps us improve our detection accuracy.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 32 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary[600] + '20',    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, marginBottom: 16 },
  heroBadgeText: { fontSize: 14, fontWeight: '600', color: Colors.primary[600] },
  heroTitle: { fontSize: 32, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginBottom: 12 },
  heroSubtitle: { fontSize: 16, color: Colors.gray, textAlign: 'center' },
  inputCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.dark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 16, marginBottom: 16 },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, paddingVertical: 16, paddingRight: 16, fontSize: 16, color: Colors.dark },
  scanButton: { backgroundColor: Colors.primary[600], borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  scanButtonDisabled: { backgroundColor: Colors.gray },
  scanButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  inputHint: { fontSize: 12, color: Colors.gray, textAlign: 'center' },
  errorCard: { backgroundColor: '#fee', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.danger },
  errorText: { color: '#dc2626' },
  feedbackCard: { backgroundColor: '#f0f9ff', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#bae6fd' },
  feedbackTitle: { fontSize: 18, fontWeight: '700', color: '#0369a1', marginBottom: 16 },
  accuracyButtons: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  accuracyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: Colors.lightGray },
  accuracyBtnActive: { backgroundColor: '#e8f5e9', borderColor: Colors.success },
  accuracyBtnText: { fontWeight: '600', color: Colors.gray },
  ratingLabel: { fontSize: 14, fontWeight: '500', color: '#0369a1', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  commentsInput: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.dark, textAlignVertical: 'top', marginBottom: 20, minHeight: 80, backgroundColor: 'white' },
  submitBtn: { backgroundColor: Colors.primary[600], borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  thankYouCard: { backgroundColor: '#e8f5e9', borderRadius: 20, padding: 24, marginHorizontal: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#4caf50' },
  thankYouTitle: { fontSize: 18, fontWeight: '700', color: '#2e7d32', marginTop: 12, marginBottom: 8 },
  thankYouText: { color: Colors.gray, textAlign: 'center' },
});

// export default URLScannerScreen;