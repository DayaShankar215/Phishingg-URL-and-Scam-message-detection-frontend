import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const colors = getColors(isDark);

  const options = [
    { value: 'light', icon: 'sunny-outline', label: 'Light' },
    { value: 'dark', icon: 'moon-outline', label: 'Dark' },
    { value: 'system', icon: 'phone-portrait-outline', label: 'System' },
  ];

  const getCurrentIcon = () => {
    const option = options.find(o => o.value === theme);
    return option ? option.icon : 'sunny-outline';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { 
          backgroundColor: colors.backgroundInput,
          borderColor: colors.border,
        }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name={getCurrentIcon()} size={20} color={colors.text} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme</Text>
            {options.map((option) => {
              const isActive = theme === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    isActive && { backgroundColor: colors.primary[600] + '20' },
                  ]}
                  onPress={() => {
                    toggleTheme(option.value);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={isActive ? colors.primary[600] : colors.text} 
                  />
                  <Text style={[
                    styles.optionText, 
                    { 
                      color: isActive ? colors.primary[600] : colors.text,
                      fontWeight: isActive ? '600' : '400',
                    }
                  ]}>
                    {option.label}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={20} color={colors.primary[600]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default ThemeToggle;