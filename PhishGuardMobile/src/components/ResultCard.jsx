import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/colors';
import RiskBadge from './RiskBadge';

const ResultCard = ({ result, type }) => {
  if (!result) return null;

  const getRiskColor = (score) => {
    if (score > 70) return Colors.danger;
    if (score > 30) return Colors.warning;
    return Colors.success;
  };

  const riskColor = getRiskColor(result.riskScore);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Risk Score Card */}
      <View style={[styles.riskCard, { backgroundColor: riskColor + '10', borderColor: riskColor }]}>
        <Text style={styles.riskTitle}>{type === 'url' ? 'Risk Assessment' : 'Scam Risk Score'}</Text>
        <Text style={[styles.riskScore, { color: riskColor }]}>{Math.round(result.riskScore)}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${result.riskScore}%`, backgroundColor: riskColor }]} />
        </View>
        <Text style={[styles.riskMessage, { color: riskColor }]}>
          {type === 'url'
            ? result.riskScore > 70
              ? '⚠️ HIGH RISK: This website appears to be a phishing site! Do not proceed.'
              : result.riskScore > 30
              ? '⚠️ MEDIUM RISK: This website shows suspicious characteristics. Exercise caution.'
              : '✅ LOW RISK: This website appears to be safe.'
            : result.riskScore > 70
            ? '🚨 HIGH RISK: This is likely a scam! Do not respond or click any links.'
            : result.riskScore > 30
            ? '⚠️ MEDIUM RISK: This message shows scam indicators. Exercise caution.'
            : '✅ LOW RISK: This message appears legitimate.'}
        </Text>
      </View>

      {/* Classification Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: type === 'url' ? Colors.primary[600] + '20' : '#f5576c20' }]}>
            <Text style={{ fontSize: 20 }}>ℹ️</Text>
          </View>
          <Text style={styles.infoTitle}>{type === 'url' ? 'Classification' : 'AI Classification'}</Text>
        </View>
        <Text style={styles.infoText}>{result.classification}</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.confidenceText, { color: riskColor }]}>
            Confidence: {((result.confidence || 0.5) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Explanation Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
            <Text style={{ fontSize: 20 }}>⚠️</Text>
          </View>
          <Text style={styles.infoTitle}>{type === 'url' ? 'Why It Was Flagged' : 'Red Flags Detected'}</Text>
        </View>
        <Text style={styles.infoText}>{result.explanation}</Text>
      </View>

      {/* Features Section */}
      {result.features && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{type === 'url' ? 'Technical Analysis' : 'Message Analysis Details'}</Text>
          {type === 'url' ? (
            <>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>URL Length:</Text><Text style={styles.featureValue}>{result.features.urlLength}</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>HTTPS Usage:</Text><Text style={[styles.featureValue, { color: result.features.hasHTTPS ? Colors.success : Colors.danger }]}>{result.features.hasHTTPS ? '✓ Secure' : '✗ Not Secure'}</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Special Characters:</Text><Text style={styles.featureValue}>{result.features.specialChars}</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>IP Address:</Text><Text style={[styles.featureValue, { color: result.features.hasIP ? Colors.danger : Colors.success }]}>{result.features.hasIP ? 'Detected' : 'Not Detected'}</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Suspicious Keywords:</Text><Text style={[styles.featureValue, { color: result.features.hasSuspiciousKeywords ? Colors.danger : Colors.success }]}>{result.features.hasSuspiciousKeywords ? 'Found' : 'Not Found'}</Text></View>
            </>
          ) : (
            <>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Message Length:</Text><Text style={styles.featureValue}>{result.features.length} chars</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Uppercase Ratio:</Text><Text style={styles.featureValue}>{(result.features.uppercaseRatio * 100).toFixed(1)}%</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Contains URL:</Text><Text style={[styles.featureValue, { color: result.features.hasURL ? Colors.danger : Colors.success }]}>{result.features.hasURL ? '⚠️ Yes' : '✓ No'}</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Contains Phone:</Text><Text style={[styles.featureValue, { color: result.features.hasPhone ? Colors.danger : Colors.success }]}>{result.features.hasPhone ? '⚠️ Yes' : '✓ No'}</Text></View>
              <View style={styles.featureRow}><Text style={styles.featureLabel}>Suspicious Keywords:</Text><Text style={styles.featureValue}>{result.features.suspiciousKeywordCount} found</Text></View>
            </>
          )}
        </View>
      )}

      {/* Message Content (for message type) */}
      {type === 'message' && result.message && (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Analyzed Message</Text>
          <View style={[styles.messageBox, { borderLeftColor: riskColor }]}>
            <Text style={styles.messageText}>"{result.message || result.content}"</Text>
          </View>
        </View>
      )}

      {/* Detected URLs (for message type) */}
      {type === 'message' && result.extractedUrls && result.extractedUrls.length > 0 && (
        <View style={styles.urlsCard}>
          <Text style={styles.urlsTitle}>⚠️ Suspicious URLs Detected</Text>
          {result.extractedUrls.map((url, index) => (
            <View key={index} style={styles.urlItem}><Text style={styles.urlText}>🔗 {url}</Text></View>
          ))}
        </View>
      )}

      {/* Recommendation */}
      <View style={[styles.recommendationCard, { backgroundColor: riskColor + '10', borderColor: riskColor }]}>
        <Text style={[styles.recommendationTitle, { color: riskColor }]}>Security Recommendation</Text>
        <Text style={styles.recommendationText}>
          {type === 'url'
            ? result.riskScore > 70
              ? '🚫 DO NOT proceed to this website. Report this URL to security authorities immediately.'
              : result.riskScore > 30
              ? '⚠️ Exercise extreme caution. Verify the website\'s authenticity before entering any credentials.'
              : '✓ You can safely proceed. Always verify the URL matches the official website.'
            : result.riskScore > 70
            ? '🚫 DO NOT engage with this message. Block the sender immediately. Never click links or reply.'
            : result.riskScore > 30
            ? '⚠️ Be cautious. Do not share personal information or click suspicious links.'
            : '✓ This message appears safe. Always verify unexpected requests.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  riskCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  riskTitle: { fontSize: 14, color: Colors.gray, marginBottom: 8 },
  riskScore: { fontSize: 48, fontWeight: '800', marginBottom: 16 },
  progressBar: { height: 10, backgroundColor: Colors.lightGray, borderRadius: 5, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 5 },
  riskMessage: { fontSize: 14, fontWeight: '500' },
  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark, marginBottom: 12 },
  infoText: { color: Colors.gray, lineHeight: 22 },
  confidenceBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  confidenceText: { fontSize: 12, fontWeight: '600' },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  featureLabel: { color: Colors.gray },
  featureValue: { fontWeight: '500', color: Colors.dark },
  messageCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  messageTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  messageBox: { backgroundColor: Colors.light, padding: 20, borderRadius: 16, borderLeftWidth: 4 },
  messageText: { fontStyle: 'italic', color: Colors.gray, lineHeight: 22 },
  urlsCard: { backgroundColor: '#fff3e0', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ffe0b2' },
  urlsTitle: { fontSize: 16, fontWeight: '700', color: '#ed6c02', marginBottom: 12 },
  urlItem: { padding: 12, backgroundColor: 'white', borderRadius: 12, marginBottom: 8 },
  urlText: { fontFamily: 'monospace', fontSize: 12 },
  recommendationCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  recommendationTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  recommendationText: { color: Colors.gray, lineHeight: 22 },
});

export default ResultCard;