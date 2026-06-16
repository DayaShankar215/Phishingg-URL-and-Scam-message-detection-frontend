export const validateURL = (url) => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL cannot be empty' };
  }
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  if (!urlPattern.test(url)) {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
  return { isValid: true, error: null };
};

export const validateMessage = (message) => {
  if (!message || message.trim() === '') {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  if (message.length < 10) {
    return { isValid: false, error: 'Message must be at least 10 characters' };
  }
  if (message.length > 1000) {
    return { isValid: false, error: 'Message is too long (maximum 1000 characters)' };
  }
  return { isValid: true, error: null };
};

export const getRiskLevel = (score) => {
  if (score > 70) return { label: 'High Risk', color: '#ef4444', icon: '⚠️' };
  if (score > 30) return { label: 'Medium Risk', color: '#f59e0b', icon: '⚡' };
  return { label: 'Low Risk', color: '#10b981', icon: '✅' };
};

export const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};