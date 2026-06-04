export const API_ENDPOINTS = {
  SCAN_URL: '/api/scan/url',
  SCAN_MESSAGE: '/api/scan/message',
  GET_SCANS: '/api/scans',
  GET_STATS: '/api/dashboard/stats',
  SUBMIT_FEEDBACK: '/api/feedback',
  DOWNLOAD_REPORT: '/api/reports',
};

export const RISK_LEVELS = {
  SAFE: { min: 0, max: 30, label: 'Low Risk', color: '#10b981' },
  SUSPICIOUS: { min: 31, max: 70, label: 'Medium Risk', color: '#f59e0b' },
  DANGEROUS: { min: 71, max: 100, label: 'High Risk', color: '#ef4444' },
};

export const SCAN_TYPES = {
  URL: 'url',
  MESSAGE: 'message',
};

export const MESSAGES = {
  SCAN_SUCCESS: 'Scan completed successfully!',
  SCAN_ERROR: 'Failed to complete scan. Please try again.',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_MESSAGE: 'Please enter a message to scan',
  PDF_DOWNLOAD_SUCCESS: 'PDF report downloaded successfully!',
  PDF_DOWNLOAD_ERROR: 'Failed to generate PDF report',
  FEEDBACK_SUCCESS: 'Thank you for your feedback!',
  FEEDBACK_ERROR: 'Failed to submit feedback',
};