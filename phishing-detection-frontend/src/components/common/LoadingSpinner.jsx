import React from 'react';
import { ThreeDots } from 'react-loader-spinner';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px'
    }}>
      <ThreeDots
        height="80"
        width="80"
        color="#667eea"
        ariaLabel="loading"
        visible={true}
      />
      {text && <p style={{ marginTop: '20px', color: '#666' }}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;