// components/ProtectedRoute.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import AuthModal from './AuthModal';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { isAuthenticated, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={56} color={colors.primary[600]} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Sign in to Access</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Sign in to save your scan history, download PDF reports, and access all premium features across all your devices.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary[600] }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.buttonText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
        <AuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102,126,234,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProtectedRoute;