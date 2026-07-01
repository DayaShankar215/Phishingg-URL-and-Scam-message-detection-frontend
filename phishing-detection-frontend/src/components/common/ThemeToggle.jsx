import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'light', icon: FaSun, label: 'Light' },
    { value: 'dark', icon: FaMoon, label: 'Dark' },
    { value: 'system', icon: FaDesktop, label: 'System' },
  ];

  const getCurrentIcon = () => {
    const option = options.find(o => o.value === theme);
    return option ? option.icon : FaSun;
  };

  const IconComponent = getCurrentIcon();

  // Theme-based colors
  const themeColors = {
    bg: isDark ? '#1e293b' : 'white',
    bgHover: isDark ? '#334155' : '#f1f5f9',
    text: isDark ? '#f1f5f9' : '#0f172a',
    border: isDark ? '#334155' : '#e2e8f0',
    shadow: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)',
    activeBg: isDark ? '#2563eb' : '#667eea',
    activeText: isDark ? '#93c5fd' : '#667eea',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: themeColors.bg,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          cursor: 'pointer',
          color: themeColors.text,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = themeColors.bgHover}
        onMouseLeave={(e) => e.currentTarget.style.background = themeColors.bg}
      >
        <IconComponent size={18} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: themeColors.bg,
            borderRadius: '12px',
            boxShadow: `0 10px 40px ${themeColors.shadow}`,
            padding: '8px',
            minWidth: '160px',
            zIndex: 1000,
            border: `1px solid ${themeColors.border}`,
          }}
        >
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  toggleTheme(option.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  background: isActive ? themeColors.bgHover : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: isActive ? themeColors.activeText : themeColors.text,
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = themeColors.bgHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} />
                <span>{option.label}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', color: themeColors.activeText }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;