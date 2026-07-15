import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      {text && <Text style={[styles.text, { color: colors.textMuted }]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  text: {
    marginTop: 20,
    fontSize: 14,
  },
});

export default LoadingSpinner;