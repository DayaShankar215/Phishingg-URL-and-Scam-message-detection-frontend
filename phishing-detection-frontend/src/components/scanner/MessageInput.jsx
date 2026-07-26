import React from 'react';

const MessageInput = ({ value, onChange, onSubmit, loading, placeholder }) => {
  return (
    <div className="message-input-container">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Paste message to scan..."}
        disabled={loading}
        className="message-input"
        rows={5}
      />
      <button onClick={onSubmit} disabled={loading} className="scan-btn">
        {loading ? 'Scanning...' : 'Scan Message'}
      </button>
    </div>
  );
};

export default MessageInput;