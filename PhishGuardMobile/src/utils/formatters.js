/**
 * Format a date to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format date to short format (MMM DD)
 * @param {string|Date} date - The date to format
 * @returns {string} Short formatted date
 */
export const formatShortDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format risk score with percentage
 * @param {number} score - The risk score
 * @returns {string} Formatted risk score
 */
export const formatRiskScore = (score) => {
  if (typeof score !== 'number') return '0%';
  return `${Math.round(score)}%`;
};

/**
 * Get risk level based on score
 * @param {number} score - The risk score
 * @returns {Object} Risk level with label, color, and icon
 */
export const getRiskLevel = (score) => {
  const safeScore = typeof score === 'number' ? score : 0;
  
  if (safeScore > 70) {
    return { 
      label: 'High Risk', 
      color: '#ef4444', 
      icon: '⚠️',
      bg: '#fee2e2'
    };
  }
  if (safeScore > 30) {
    return { 
      label: 'Medium Risk', 
      color: '#f59e0b', 
      icon: '⚡',
      bg: '#fef3c7'
    };
  }
  return { 
    label: 'Low Risk', 
    color: '#10b981', 
    icon: '✅',
    bg: '#d1fae5'
  };
};

/**
 * Truncate text to a maximum length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return 'N/A';
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Truncate text from the middle
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 30)
 * @returns {string} Truncated text
 */
export const truncateMiddle = (text, maxLength = 30) => {
  if (!text) return 'N/A';
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLength) return text;
  
  const half = Math.floor((maxLength - 3) / 2);
  return text.substring(0, half) + '...' + text.substring(text.length - half);
};

/**
 * Capitalize first letter of each word
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format bytes to human readable size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format time ago (relative time)
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export const timeAgo = (date) => {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Get status color based on prediction
 * @param {string} prediction - The prediction string
 * @returns {Object} Color object with bg and text colors
 */
export const getPredictionColor = (prediction) => {
  switch (prediction?.toUpperCase()) {
    case 'PHISHING':
    case 'DANGEROUS':
    case 'MALICIOUS':
      return { bg: '#fee2e2', text: '#dc2626' };
    case 'SCAM':
    case 'SUSPICIOUS':
    case 'WARNING':
      return { bg: '#fef3c7', text: '#d97706' };
    case 'SAFE':
    case 'LEGITIMATE':
      return { bg: '#d1fae5', text: '#065f46' };
    default:
      return { bg: '#f1f5f9', text: '#64748b' };
  }
};

/**
 * Get status icon based on prediction
 * @param {string} prediction - The prediction string
 * @returns {string} Icon name for Ionicons
 */
export const getPredictionIcon = (prediction) => {
  switch (prediction?.toUpperCase()) {
    case 'PHISHING':
    case 'DANGEROUS':
    case 'MALICIOUS':
      return 'alert-circle-outline';
    case 'SCAM':
    case 'SUSPICIOUS':
    case 'WARNING':
      return 'warning-outline';
    case 'SAFE':
    case 'LEGITIMATE':
      return 'checkmark-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

/**
 * Format URL for display (remove protocol)
 * @param {string} url - The URL to format
 * @returns {string} Formatted URL
 */
export const formatURL = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
};

/**
 * Extract domain from URL
 * @param {string} url - The URL
 * @returns {string} Domain name
 */
export const extractDomain = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

/**
 * Format phone number for display
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  if (cleaned.length === 11) {
    return `${cleaned.substring(0, 1)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  return phone;
};

export default {
  formatDate,
  formatShortDate,
  formatRiskScore,
  getRiskLevel,
  truncateText,
  truncateMiddle,
  capitalizeWords,
  formatBytes,
  timeAgo,
  getPredictionColor,
  getPredictionIcon,
  formatURL,
  extractDomain,
  formatPhone,
};