import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  StatusBar,
  Dimensions,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ThemeToggle from './ThemeToggle';

const { width } = Dimensions.get('window');

const Navbar = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(rotateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const navigateTo = (routeName) => {
    navigation.navigate(routeName);
    toggleMenu();
  };

  const getIconName = (item) => isActive(item.route) ? item.activeIcon : item.icon;

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
            <View style={styles.logoIconContainer}>
              <View style={[styles.logoGradient, { backgroundColor: colors.primary[600] }]}>
                <Ionicons name="shield" size={22} color="white" />
              </View>
              <View style={[styles.logoPulse, { borderColor: colors.primary[600] }]} />
            </View>
            <View>
              <Text style={[styles.logoText, { color: colors.text }]}>PhishGuard</Text>
              <View style={styles.logoBadge}>
                <View style={[styles.logoDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.logoBadgeText, { color: colors.textMuted }]}>AI Security</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.rightContainer}>
            <ThemeToggle />
            <TouchableOpacity 
              style={[styles.menuButton, { 
                backgroundColor: colors.backgroundInput,
                borderColor: colors.border,
              }]}
              onPress={toggleMenu}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons 
                  name={menuOpen ? 'close' : 'menu'} 
                  size={28} 
                  color={colors.text} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.indicatorLine, { backgroundColor: colors.borderLight }]}>
          <View style={[
            styles.indicatorFill,
            { 
              width: `${(navItems.findIndex(item => isActive(item.route)) + 1) * (100 / navItems.length)}%`,
              backgroundColor: colors.primary[600],
            }
          ]} />
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
          <Text style={[styles.menuHeaderTitle, { color: colors.text }]}>PhishGuard</Text>
          <Text style={[styles.menuHeaderSub, { color: colors.textMuted }]}>Premium Security</Text>
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
                isActive(item.route) && [styles.menuItemIconActive, { backgroundColor: colors.primary[600] }],
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

        <View style={[styles.menuFooter, { borderTopColor: colors.border }]}>
          <View style={[styles.menuFooterBadge, { backgroundColor: colors.backgroundInput }]}>
            <View style={[styles.menuFooterDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.menuFooterText, { color: colors.textMuted }]}>Protected by AI</Text>
          </View>
          <Text style={[styles.menuFooterVersion, { color: colors.textMuted }]}>v1.0.0</Text>
        </View>
      </Animated.View>
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
    gap: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 2,
    opacity: 0.2,
    top: -3,
    left: -3,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  logoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  logoBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  indicatorLine: {
    height: 3,
    marginTop: 8,
    marginHorizontal: 0,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorFill: {
    height: '100%',
    borderRadius: 2,
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
  menuFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  menuFooterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  menuFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  menuFooterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuFooterVersion: {
    fontSize: 11,
    marginTop: 8,
  },
});

export default Navbar;