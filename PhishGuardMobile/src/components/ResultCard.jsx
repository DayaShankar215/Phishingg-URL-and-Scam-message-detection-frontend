// components/ResultCard.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';

const ResultCard = ({ result, type }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  if (!result) return null;

  const getRiskColor = (score) => {
    if (score > 70) return colors.danger;
    if (score > 30) return colors.warning;
    return colors.success;
  };

  const riskColor = getRiskColor(result.riskScore);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Risk Score Card */}
      <View style={[styles.riskCard, { backgroundColor: riskColor + '15', borderColor: riskColor }]}>
        <Text style={[styles.riskTitle, { color: colors.textMuted }]}>{type === 'url' ? 'Risk Assessment' : 'Scam Risk Score'}</Text>
        <Text style={[styles.riskScore, { color: riskColor }]}>{Math.round(result.riskScore || 0)}%</Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${Math.min(result.riskScore || 0, 100)}%`, backgroundColor: riskColor }]} />
        </View>
        <Text style={[styles.riskMessage, { color: riskColor }]}>
          {type === 'url'
            ? (result.riskScore || 0) > 70
              ? '⚠️ HIGH RISK: This website appears to be a phishing site! Do not proceed.'
              : (result.riskScore || 0) > 30
              ? '⚠️ MEDIUM RISK: This website shows suspicious characteristics. Exercise caution.'
              : '✅ LOW RISK: This website appears to be safe.'
            : (result.riskScore || 0) > 70
            ? '🚨 HIGH RISK: This is likely a scam! Do not respond or click any links.'
            : (result.riskScore || 0) > 30
            ? '⚠️ MEDIUM RISK: This message shows scam indicators. Exercise caution.'
            : '✅ LOW RISK: This message appears legitimate.'}
        </Text>
      </View>

      {/* Classification Card */}
      <View style={[styles.infoCard, { 
        backgroundColor: colors.backgroundCard,
        shadowColor: colors.shadow,
      }]}>
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: type === 'url' ? colors.primary[600] + '20' : '#f5576c20' }]}>
            <Text style={{ fontSize: 20 }}>ℹ️</Text>
          </View>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{type === 'url' ? 'Classification' : 'AI Classification'}</Text>
        </View>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{result.classification || 'N/A'}</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.confidenceText, { color: riskColor }]}>
            Confidence: {((result.confidence || 0.5) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Explanation Card */}
      <View style={[styles.infoCard, { 
        backgroundColor: colors.backgroundCard,
        shadowColor: colors.shadow,
      }]}>
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
            <Text style={{ fontSize: 20 }}>⚠️</Text>
          </View>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{type === 'url' ? 'Why It Was Flagged' : 'Red Flags Detected'}</Text>
        </View>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{result.explanation || 'No explanation available'}</Text>
      </View>

      {/* Features Section */}
      {result.features && (
        <View style={[styles.infoCard, { 
          backgroundColor: colors.backgroundCard,
          shadowColor: colors.shadow,
        }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{type === 'url' ? 'Technical Analysis' : 'Message Analysis Details'}</Text>
          {type === 'url' ? (
            <>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>URL Length:</Text><Text style={[styles.featureValue, { color: colors.text }]}>{result.features.urlLength || 'N/A'}</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>HTTPS Usage:</Text><Text style={[styles.featureValue, { color: result.features.hasHTTPS ? colors.success : colors.danger }]}>{result.features.hasHTTPS ? '✓ Secure' : '✗ Not Secure'}</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Special Characters:</Text><Text style={[styles.featureValue, { color: colors.text }]}>{result.features.specialChars || 0}</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>IP Address:</Text><Text style={[styles.featureValue, { color: result.features.hasIP ? colors.danger : colors.success }]}>{result.features.hasIP ? 'Detected' : 'Not Detected'}</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Suspicious Keywords:</Text><Text style={[styles.featureValue, { color: result.features.hasSuspiciousKeywords ? colors.danger : colors.success }]}>{result.features.hasSuspiciousKeywords ? 'Found' : 'Not Found'}</Text></View>
            </>
          ) : (
            <>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Message Length:</Text><Text style={[styles.featureValue, { color: colors.text }]}>{result.features.length || 0} chars</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Uppercase Ratio:</Text><Text style={[styles.featureValue, { color: colors.text }]}>{(result.features.uppercaseRatio || 0 * 100).toFixed(1)}%</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Contains URL:</Text><Text style={[styles.featureValue, { color: result.features.hasURL ? colors.danger : colors.success }]}>{result.features.hasURL ? '⚠️ Yes' : '✓ No'}</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Contains Phone:</Text><Text style={[styles.featureValue, { color: result.features.hasPhone ? colors.danger : colors.success }]}>{result.features.hasPhone ? '⚠️ Yes' : '✓ No'}</Text></View>
              <View style={[styles.featureRow, { borderBottomColor: colors.border }]}><Text style={[styles.featureLabel, { color: colors.textMuted }]}>Suspicious Keywords:</Text><Text style={[styles.featureValue, { color: colors.text }]}>{result.features.suspiciousKeywordCount || 0} found</Text></View>
            </>
          )}
        </View>
      )}

      {/* Message Content */}
      {type === 'message' && (result.message || result.content) && (
        <View style={[styles.messageCard, { 
          backgroundColor: colors.backgroundCard,
          shadowColor: colors.shadow,
        }]}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>Analyzed Message</Text>
          <View style={[styles.messageBox, { 
            backgroundColor: colors.backgroundInput,
            borderLeftColor: riskColor,
          }]}>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>"{result.message || result.content}"</Text>
          </View>
        </View>
      )}

      {/* Recommendation */}
      <View style={[styles.recommendationCard, { 
        backgroundColor: riskColor + '10', 
        borderColor: riskColor,
      }]}>
        <Text style={[styles.recommendationTitle, { color: riskColor }]}>Security Recommendation</Text>
        <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
          {type === 'url'
            ? (result.riskScore || 0) > 70
              ? '🚫 DO NOT proceed to this website. Report this URL to security authorities immediately.'
              : (result.riskScore || 0) > 30
              ? '⚠️ Exercise extreme caution. Verify the website\'s authenticity before entering any credentials.'
              : '✓ You can safely proceed. Always verify the URL matches the official website.'
            : (result.riskScore || 0) > 70
            ? '🚫 DO NOT engage with this message. Block the sender immediately. Never click links or reply.'
            : (result.riskScore || 0) > 30
            ? '⚠️ Be cautious. Do not share personal information or click suspicious links.'
            : '✓ This message appears safe. Always verify unexpected requests.'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  riskCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  riskTitle: { fontSize: 14, marginBottom: 8 },
  riskScore: { fontSize: 48, fontWeight: '800', marginBottom: 16 },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 5 },
  riskMessage: { fontSize: 14, fontWeight: '500' },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  infoText: { lineHeight: 22 },
  confidenceBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  confidenceText: { fontSize: 12, fontWeight: '600' },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  featureLabel: { fontSize: 13 },
  featureValue: { fontSize: 13, fontWeight: '500' },
  messageCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  messageTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  messageBox: { padding: 20, borderRadius: 16, borderLeftWidth: 4 },
  messageText: { fontStyle: 'italic', lineHeight: 22 },
  recommendationCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  recommendationTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  recommendationText: { lineHeight: 22 },
});

export default ResultCard;