import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary[600]} />
      <Text style={styles.text}>{text}</Text>
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
    color: Colors.gray,
    fontSize: 14,
  },
});

export default LoadingSpinner;