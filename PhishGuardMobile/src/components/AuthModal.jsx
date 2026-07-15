import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { showToast } from './Toaster';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'login', onSuccess }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
    setAcceptTerms(false);
    setMode(initialMode);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (mode === 'register') {
      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      if (!acceptTerms) {
        showToast('Please accept the terms and conditions', 'error');
        return;
      }
      if (!firstName.trim()) {
        showToast('Please enter your first name', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      let response;
      if (mode === 'login') {
        response = await login({ email, password });
      } else {
        response = await register({ firstName, lastName, email, password });
      }

      showToast(
        mode === 'login' ? 'Welcome back! 🎉' : 'Account created successfully! 🎉',
        'success'
      );

      if (onSuccess) {
        onSuccess(response);
      }
      handleClose();
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.backgroundCard,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.backgroundInput }]}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoContainer}>
                  <View
                    style={[
                      styles.logoIcon,
                      { backgroundColor: colors.primary[600] },
                    ]}
                  >
                    <Text style={styles.logoEmoji}>🛡️</Text>
                  </View>
                  <Text style={[styles.logoTitle, { color: colors.text }]}>
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </Text>
                  <Text style={[styles.logoSubtitle, { color: colors.textMuted }]}>
                    {mode === 'login'
                      ? 'Sign in to save your scans and access premium features'
                      : 'Start securing your online experience today'}
                  </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                  {mode === 'register' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                          First Name
                        </Text>
                        <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color={colors.textMuted}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="John"
                            placeholderTextColor={colors.textMuted}
                            value={firstName}
                            onChangeText={setFirstName}
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                          Last Name
                        </Text>
                        <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color={colors.textMuted}
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Doe"
                            placeholderTextColor={colors.textMuted}
                            value={lastName}
                            onChangeText={setLastName}
                          />
                        </View>
                      </View>
                    </>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Email Address
                    </Text>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Password
                    </Text>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={colors.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={
                          mode === 'login' ? 'Enter your password' : 'Create a password'
                        }
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                    {mode === 'register' && (
                      <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                        Minimum 6 characters
                      </Text>
                    )}
                  </View>

                  {mode === 'register' && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        Confirm Password
                      </Text>
                      <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={colors.textMuted}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Confirm your password"
                          placeholderTextColor={colors.textMuted}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
                        />
                      </View>
                    </View>
                  )}

                  {mode === 'register' && (
                    <TouchableOpacity
                      style={styles.termsContainer}
                      onPress={() => setAcceptTerms(!acceptTerms)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: acceptTerms ? colors.primary[600] : colors.border,
                            backgroundColor: acceptTerms ? colors.primary[600] : 'transparent',
                          },
                        ]}
                      >
                        {acceptTerms && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </View>
                      <Text style={[styles.termsText, { color: colors.textMuted }]}>
                        I agree to the{' '}
                        <Text style={{ color: colors.primary[600] }}>Terms of Service</Text>
                        {' '}and{' '}
                        <Text style={{ color: colors.primary[600] }}>Privacy Policy</Text>
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor: loading ? colors.textMuted : colors.primary[600],
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Social Buttons */}
                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    style={[
                      styles.socialBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundInput,
                      },
                    ]}
                    // Google auth would go here
                  >
                    <Ionicons name="logo-google" size={20} color="#ea4335" />
                    <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.socialBtn,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundInput,
                      },
                    ]}
                    // GitHub auth would go here
                  >
                    <Ionicons name="logo-github" size={20} color={colors.text} />
                    <Text style={[styles.socialBtnText, { color: colors.text }]}>GitHub</Text>
                  </TouchableOpacity>
                </View>

                {/* Switch Mode */}
                <View style={styles.switchContainer}>
                  <Text style={[styles.switchText, { color: colors.textMuted }]}>
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  </Text>
                  <TouchableOpacity onPress={switchMode}>
                    <Text style={[styles.switchLink, { color: colors.primary[600] }]}>
                      {mode === 'login' ? 'Sign up now' : 'Sign in instead'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthModal;