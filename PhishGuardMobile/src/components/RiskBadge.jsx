import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const RiskBadge = ({ score, size = 'medium' }) => {
  const getRiskLevel = () => {
    if (score > 70) return { label: 'High Risk', color: Colors.danger, icon: '⚠️' };
    if (score > 30) return { label: 'Medium Risk', color: Colors.warning, icon: '⚡' };
    return { label: 'Low Risk', color: Colors.success, icon: '✅' };
  };

  const { label, color, icon } = getRiskLevel();

  const sizeStyles = {
    small: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 },
    medium: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
    large: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 16 },
  };

  return (
    <View style={[styles.container, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color, fontSize: sizeStyles[size].fontSize }]}>{label}</Text>
      <Text style={[styles.score, { color, fontSize: sizeStyles[size].fontSize }]}>{Math.round(score)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 14 },
  label: { fontWeight: '600' },
  score: { fontWeight: 'bold' },
});

export default RiskBadge;