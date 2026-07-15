import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';

const RiskBadge = ({ score = 0, size = 'medium', showIcon = true, showPercentage = true, style = {} }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  
  const safeScore = typeof score === 'number' ? score : 0;
  const roundedScore = Math.round(safeScore);
  
  const getRiskLevel = () => {
    if (safeScore > 70) {
      return { 
        label: 'High Risk', 
        color: colors.danger,
        bgColor: colors.dangerBg || '#fee2e2',
        icon: '⚠️'
      };
    }
    if (safeScore > 30) {
      return { 
        label: 'Medium Risk', 
        color: colors.warning,
        bgColor: colors.warningBg || '#fef3c7',
        icon: '⚡'
      };
    }
    return { 
      label: 'Low Risk', 
      color: colors.success,
      bgColor: colors.successBg || '#dcfce7',
      icon: '✅'
    };
  };

  const risk = getRiskLevel();

  const sizeConfigs = {
    small: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 11, iconSize: 12, borderRadius: 12, gap: 4 },
    medium: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13, iconSize: 14, borderRadius: 16, gap: 6 },
    large: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, iconSize: 16, borderRadius: 20, gap: 8 },
  };

  const sizeConfig = sizeConfigs[size] || sizeConfigs.medium;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: risk.bgColor,
        borderColor: risk.color,
        paddingVertical: sizeConfig.paddingVertical,
        paddingHorizontal: sizeConfig.paddingHorizontal,
        borderRadius: sizeConfig.borderRadius,
        gap: sizeConfig.gap,
      },
      style
    ]}>
      {showIcon && (
        <Text style={[styles.icon, { fontSize: sizeConfig.iconSize }]}>
          {risk.icon}
        </Text>
      )}
      <Text style={[styles.label, { color: risk.color, fontSize: sizeConfig.fontSize }]}>
        {risk.label}
      </Text>
      {showPercentage && (
        <Text style={[styles.score, { color: risk.color, fontSize: sizeConfig.fontSize }]}>
          {roundedScore}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { lineHeight: 16 },
  label: { fontWeight: '600', letterSpacing: 0.3 },
  score: { fontWeight: 'bold', letterSpacing: 0.3 },
});

export default React.memo(RiskBadge);