import React from 'react';
import { getRiskLevel } from '../../utils/formatters';

const RiskBadge = ({ score, size = 'medium' }) => {
  const { label, color, icon } = getRiskLevel(score);
  
  const sizeStyles = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '6px 12px', fontSize: '14px' },
    large: { padding: '8px 16px', fontSize: '16px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: color + '20',
        color: color,
        borderRadius: '20px',
        fontWeight: '600',
        ...sizeStyles[size],
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span style={{ fontWeight: 'bold' }}>{Math.round(score)}%</span>
    </span>
  );
};

export default RiskBadge;