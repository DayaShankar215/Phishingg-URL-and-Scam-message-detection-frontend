export const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatRiskScore = (score) => {
  return `${Math.round(score)}%`;
};

export const getRiskLevel = (score) => {
  if (score > 70) return { label: 'High Risk', color: '#ef4444', icon: '⚠️' };
  if (score > 30) return { label: 'Medium Risk', color: '#f59e0b', icon: '⚡' };
  return { label: 'Low Risk', color: '#10b981', icon: '✅' };
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};