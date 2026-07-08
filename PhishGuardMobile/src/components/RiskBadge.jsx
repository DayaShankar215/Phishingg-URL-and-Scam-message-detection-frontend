import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Import your theme/colors
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';

const RiskBadge = ({ 
  score = 0, 
  size = 'medium', 
  showIcon = true,
  showPercentage = true,
  style = {},
  colors = null // Allow custom colors override
}) => {
  // Get theme colors if not provided
  const { isDark } = useTheme();
  const themeColors = colors || getColors(isDark);
  
  // Safe score value
  const safeScore = typeof score === 'number' ? score : 0;
  const roundedScore = Math.round(safeScore);
  
  // Determine risk level with safe defaults
  const getRiskLevel = () => {
    if (safeScore > 70) {
      return { 
        label: 'High Risk', 
        color: themeColors?.danger || '#dc2626',
        bgColor: themeColors?.dangerBg || '#fee2e2',
        icon: '🚨'
      };
    }
    if (safeScore > 30) {
      return { 
        label: 'Medium Risk', 
        color: themeColors?.warning || '#d97706',
        bgColor: themeColors?.warningBg || '#fef3c7',
        icon: '⚡'
      };
    }
    return { 
      label: 'Low Risk', 
      color: themeColors?.success || '#16a34a',
      bgColor: themeColors?.successBg || '#dcfce7',
      icon: '✅'
    };
  };

  const risk = getRiskLevel();

  // Size configurations
  const sizeConfigs = {
    small: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      fontSize: 11,
      iconSize: 12,
      borderRadius: 12,
      gap: 4,
    },
    medium: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      fontSize: 13,
      iconSize: 14,
      borderRadius: 16,
      gap: 6,
    },
    large: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 15,
      iconSize: 16,
      borderRadius: 20,
      gap: 8,
    },
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
      <Text style={[
        styles.label, 
        { 
          color: risk.color,
          fontSize: sizeConfig.fontSize,
        }
      ]}>
        {risk.label}
      </Text>
      {showPercentage && (
        <Text style={[
          styles.score,
          { 
            color: risk.color,
            fontSize: sizeConfig.fontSize,
          }
        ]}>
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
  icon: {
    lineHeight: 16,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  score: {
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});

// Export with memo for performance
export default React.memo(RiskBadge);