export const validateURL = (url) => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL cannot be empty' };
  }
  
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  if (!urlPattern.test(url)) {
    return { isValid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
  }
  
  return { isValid: true, error: null };
};

export const validateMessage = (message) => {
  if (!message || message.trim() === '') {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length < 10) {
    return { isValid: false, error: 'Message must be at least 10 characters for accurate detection' };
  }
  
  if (message.length > 1000) {
    return { isValid: false, error: 'Message is too long (maximum 1000 characters)' };
  }
  
  return { isValid: true, error: null };
};