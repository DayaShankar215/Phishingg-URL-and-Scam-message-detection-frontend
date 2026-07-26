import React from 'react';

const URLInput = ({ value, onChange, onSubmit, loading, placeholder }) => {
  return (
    <div className="url-input-container">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter URL to scan..."}
        disabled={loading}
        className="url-input"
      />
      <button onClick={onSubmit} disabled={loading} className="scan-btn">
        {loading ? 'Scanning...' : 'Scan URL'}
      </button>
    </div>
  );
};

export default URLInput;