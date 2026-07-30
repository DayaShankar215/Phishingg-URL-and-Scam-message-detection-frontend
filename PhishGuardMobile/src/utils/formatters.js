// utils/formatters.js

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
  } catch {
    return 'N/A';
  }
};

export const formatShortDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

export const formatRiskScore = (score) => {
  if (typeof score !== 'number') return '0%';
  return `${Math.round(score)}%`;
};

export const getRiskLevel = (score) => {
  const safeScore = typeof score === 'number' ? score : 0;
  if (safeScore > 70) {
    return { label: 'High Risk', color: '#ef4444', bg: '#fee2e2', icon: '⚠️' };
  }
  if (safeScore > 30) {
    return { label: 'Medium Risk', color: '#f59e0b', bg: '#fef3c7', icon: '⚡' };
  }
  return { label: 'Low Risk', color: '#10b981', bg: '#d1fae5', icon: '✅' };
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return 'N/A';
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const truncateMiddle = (text, maxLength = 30) => {
  if (!text) return 'N/A';
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLength) return text;
  const half = Math.floor((maxLength - 3) / 2);
  return text.substring(0, half) + '...' + text.substring(text.length - half);
};

export const capitalizeWords = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getPredictionColor = (prediction) => {
  const upperPred = prediction?.toUpperCase() || '';
  switch (upperPred) {
    case 'PHISHING':
    case 'DANGEROUS':
    case 'MALICIOUS':
      return { bg: '#fee2e2', color: '#dc2626' };
    case 'SCAM':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'SUSPICIOUS':
    case 'WARNING':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'SAFE':
    case 'LEGITIMATE':
      return { bg: '#d1fae5', color: '#065f46' };
    default:
      return { bg: '#f1f5f9', color: '#64748b' };
  }
};

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

export const formatURL = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
};

export const extractDomain = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

export const timeAgo = (date) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  } catch {
    return 'N/A';
  }
};