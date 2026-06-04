import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorMap = {
    primary: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '#667eea' },
    danger: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '#f5576c' },
    warning: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '#fa709a' },
    success: { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', icon: '#4facfe' },
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: '#666', fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>
            {title}
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{value}</p>
          {trend && (
            <p style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              color: trend >= 0 ? '#10b981' : '#ef4444',
              fontWeight: '500'
            }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        <div style={{
          width: '60px',
          height: '60px',
          background: colorMap[color].bg,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ fontSize: '30px', color: 'white' }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;