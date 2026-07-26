import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, 
  StatusBar, Dimensions, Platform, Modal, TextInput, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getColors } from '../constants/colors';
import ThemeToggle from './ThemeToggle';
import { showToast } from './Toaster';

const { width } = Dimensions.get('window');

const Navbar = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { isAuthenticated, user, login, register, logout } = useAuth();
  const colors = getColors(isDark);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentRoute = useNavigationState(state => {
    if (!state) return 'Dashboard';
    const route = state.routes[state.index];
    return route?.name || 'Dashboard';
  });

  const navItems = [
    { name: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid', route: 'Dashboard' },
    { name: 'URL Scanner', icon: 'link-outline', activeIcon: 'link', route: 'URL Scanner' },
    { name: 'Message Scanner', icon: 'chatbubble-outline', activeIcon: 'chatbubble', route: 'Message Scanner' },
    { name: 'History', icon: 'time-outline', activeIcon: 'time', route: 'History' },
  ];

  const isActive = (routeName) => currentRoute === routeName;

  const toggleMenu = () => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -300, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  };

  const navigateTo = (routeName) => {
    navigation.navigate(routeName);
    toggleMenu();
  };

  const getIconName = (item) => isActive(item.route) ? item.activeIcon : item.icon;

  const handleAuth = async () => {
    // ✅ FIX: Validate password match
    if (authMode === 'register' && password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await login({ email, password });
      } else {
        await register({ firstName, lastName, email, password });
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      showToast(authMode === 'login' ? 'Welcome back!' : 'Account created!', 'success');
    } catch (error) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={[styles.navbar, { 
        backgroundColor: colors.backgroundSecondary,
        borderBottomColor: colors.border,
      }]}>
        <View style={styles.navbarContent}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.8}
          >
            <View style={[styles.logoGradient, { backgroundColor: colors.primary[600] }]}>
              <Ionicons name="shield" size={22} color="white" />
            </View>
            <View>
              <Text style={[styles.logoText, { color: colors.text }]}>SecureShield</Text>
              <Text style={[styles.logoBadgeText, { color: colors.textMuted }]}>
                {isAuthenticated ? `Welcome, ${user?.firstName || 'User'}` : 'AI Security'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rightContainer}>
            {!isAuthenticated ? (
              <>
                <TouchableOpacity 
                  style={[styles.authButton, { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => { setAuthMode('login'); setShowAuthModal(true); }}
                >
                  <Text style={[styles.authButtonText, { color: colors.text }]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.authButton, { backgroundColor: colors.primary[600] }]}
                  onPress={() => { setAuthMode('register'); setShowAuthModal(true); }}
                >
                  <Text style={[styles.authButtonText, { color: 'white' }]}>Register</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.userContainer}>
                <View style={[styles.userAvatar, { backgroundColor: colors.primary[600] }]}>
                  <Text style={styles.userAvatarText}>
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
            <ThemeToggle />
            <TouchableOpacity 
              style={[styles.menuButton, { 
                backgroundColor: colors.backgroundInput,
                borderColor: colors.border,
              }]}
              onPress={toggleMenu}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={menuOpen ? 'close' : 'menu'} 
                size={28} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {menuOpen && (
        <TouchableOpacity 
          style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <Animated.View 
        style={[
          styles.slideMenu,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
            backgroundColor: colors.backgroundCard,
          }
        ]}
      >
        <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.menuHeaderIcon, { backgroundColor: colors.primary[600] + '20' }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary[600]} />
          </View>
          <Text style={[styles.menuHeaderTitle, { color: colors.text }]}>SecureShield</Text>
          {isAuthenticated && user && (
            <Text style={[styles.menuHeaderSub, { color: colors.textMuted }]}>
              {user.firstName} {user.lastName || ''}
            </Text>
          )}
        </View>

        <View style={styles.menuItems}>
          {navItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isActive(item.route) && [styles.menuItemActive, { backgroundColor: colors.primary[600] + '10' }]
              ]}
              onPress={() => navigateTo(item.route)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.menuItemIcon,
                { backgroundColor: isActive(item.route) ? colors.primary[600] : colors.backgroundInput }
              ]}>
                <Ionicons 
                  name={getIconName(item)} 
                  size={22} 
                  color={isActive(item.route) ? 'white' : colors.textMuted} 
                />
              </View>
              <Text style={[
                styles.menuItemText,
                isActive(item.route) ? [styles.menuItemTextActive, { color: colors.primary[600] }] : { color: colors.text }
              ]}>
                {item.name}
              </Text>
              {isActive(item.route) && (
                <View style={[styles.menuItemActiveDot, { backgroundColor: colors.primary[600] }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Auth Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAuthModal}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {authMode === 'register' && (
                <>
                  <TextInput
                    style={[styles.modalInput, { 
                      backgroundColor: colors.backgroundInput,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    placeholder="First Name"
                    placeholderTextColor={colors.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    style={[styles.modalInput, { 
                      backgroundColor: colors.backgroundInput,
                      color: colors.text,
                      borderColor: colors.border,
                    }]}
                    placeholder="Last Name"
                    placeholderTextColor={colors.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </>
              )}
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.backgroundInput,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                placeholder="Email Address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.backgroundInput,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {authMode === 'register' && (
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: colors.backgroundInput,
                    color: colors.text,
                    borderColor: colors.border,
                  }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              )}
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary[600] }]}
                onPress={handleAuth}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                <Text style={[styles.modalSwitchText, { color: colors.primary[600] }]}>
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  navbar: {
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  navbarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  authButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  slideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.78,
    height: '100%',
    zIndex: 300,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  menuHeader: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  menuHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  menuHeaderSub: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuItems: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  menuItemTextActive: {
    fontWeight: '600',
  },
  menuItemActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalBody: {
    gap: 14,
  },
  modalInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSwitchText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
});

export default Navbar;