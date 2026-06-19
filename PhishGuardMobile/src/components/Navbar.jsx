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
import Colors from '../constants/colors';

const { width } = Dimensions.get('window');

const Navbar = () => {
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Get current route name using useNavigationState
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

  const isActive = (routeName) => {
    return currentRoute === routeName;
  };

  const toggleMenu = () => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
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

  const getIconName = (item) => {
    return isActive(item.route) ? item.activeIcon : item.icon;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Main Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          {/* Logo */}
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.8}
          >
            <View style={styles.logoIconContainer}>
              <View style={styles.logoGradient}>
                <Ionicons name="shield" size={22} color="white" />
              </View>
              <View style={styles.logoPulse} />
            </View>
            <View>
              <Text style={styles.logoText}>PhishGuard</Text>
              <View style={styles.logoBadge}>
                <View style={styles.logoDot} />
                <Text style={styles.logoBadgeText}>AI Security</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Menu Button */}
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleMenu}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons 
                name={menuOpen ? 'close' : 'menu'} 
                size={28} 
                color="#1e293b" 
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom Indicator Line */}
        <View style={styles.indicatorLine}>
          <View style={[
            styles.indicatorFill,
            { 
              width: `${(navItems.findIndex(item => isActive(item.route)) + 1) * (100 / navItems.length)}%` 
            }
          ]} />
        </View>
      </View>

      {/* Overlay */}
      {menuOpen && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Slide Menu */}
      <Animated.View 
        style={[
          styles.slideMenu,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Menu Header */}
        <View style={styles.menuHeader}>
          <View style={styles.menuHeaderIcon}>
            <Ionicons name="shield-checkmark" size={32} color={Colors.primary[600]} />
          </View>
          <Text style={styles.menuHeaderTitle}>PhishGuard</Text>
          <Text style={styles.menuHeaderSub}>Premium Security</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuItems}>
          {navItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isActive(item.route) && styles.menuItemActive
              ]}
              onPress={() => navigateTo(item.route)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.menuItemIcon,
                isActive(item.route) && styles.menuItemIconActive
              ]}>
                <Ionicons 
                  name={getIconName(item)} 
                  size={22} 
                  color={isActive(item.route) ? 'white' : '#64748b'} 
                />
              </View>
              <Text style={[
                styles.menuItemText,
                isActive(item.route) && styles.menuItemTextActive
              ]}>
                {item.name}
              </Text>
              {isActive(item.route) && (
                <View style={styles.menuItemActiveDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu Footer */}
        <View style={styles.menuFooter}>
          <View style={styles.menuFooterBadge}>
            <View style={styles.menuFooterDot} />
            <Text style={styles.menuFooterText}>Protected by AI</Text>
          </View>
          <Text style={styles.menuFooterVersion}>v1.0.0</Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.4)',
    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.06)',
    zIndex: 100,
  },
  navbarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  // Logo
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
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(102, 126, 234, 0.3)',
  },
  logoPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primary[600],
    opacity: 0.2,
    top: -3,
    left: -3,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
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
    backgroundColor: '#10b981',
  },
  logoBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Menu Button
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Indicator Line
  indicatorLine: {
    height: 3,
    backgroundColor: '#f1f5f9',
    marginTop: 8,
    marginHorizontal: 0,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorFill: {
    height: '100%',
    backgroundColor: Colors.primary[600],
    borderRadius: 2,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 200,
  },

  // Slide Menu
  slideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.78,
    height: '100%',
    backgroundColor: 'white',
    zIndex: 300,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    boxShadow: '4px 0px 20px rgba(0, 0, 0, 0.12)',
  },
  menuHeader: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary[600] + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  menuHeaderSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Menu Items
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
  menuItemActive: {
    backgroundColor: Colors.primary[600] + '10',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    marginRight: 14,
  },
  menuItemIconActive: {
    backgroundColor: Colors.primary[600],
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
    flex: 1,
  },
  menuItemTextActive: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  menuItemActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[600],
  },

  // Menu Footer
  menuFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  menuFooterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  menuFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  menuFooterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  menuFooterVersion: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
  },
});

export default Navbar;