import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const ML_API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for logging (optional)
api.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ==================== URL SCAN ENDPOINTS ====================

// Scan URL for phishing detection
export const scanURL = async (url) => {
  try {
    const response = await api.post('/scan/url', { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan URL' };
  }
};

// Get URL scan by ID
export const getURLScanById = async (id) => {
  try {
    const response = await api.get(`/scans/url/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch URL scan details' };
  }
};

// ==================== MESSAGE SCAN ENDPOINTS ====================

// Scan message for scam detection
export const scanMessage = async (message) => {
  try {
    const response = await api.post('/scan/message', { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan message' };
  }
};

// Get message scan by ID
export const getMessageScanById = async (id) => {
  try {
    const response = await api.get(`/scans/message/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch message scan details' };
  }
};

// ==================== HISTORY ENDPOINTS ====================

// Get all scans with optional type filter
export const getScanHistory = async (type = null, limit = 50, offset = 0) => {
  try {
    const params = {};
    if (type && type !== 'all') params.type = type;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    const response = await api.get('/scans', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scan history' };
  }
};

// Get scan by ID and type (unified)
export const getScanById = async (id, type) => {
  try {
    const response = await api.get(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scan details' };
  }
};

// ==================== DASHBOARD ENDPOINTS ====================

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dashboard statistics' };
  }
};

// Get weekly trend data
export const getWeeklyTrends = async () => {
  try {
    const response = await api.get('/dashboard/trends/weekly');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch weekly trends' };
  }
};

// Get monthly statistics
export const getMonthlyStats = async () => {
  try {
    const response = await api.get('/dashboard/stats/monthly');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch monthly statistics' };
  }
};

// ==================== FEEDBACK ENDPOINTS ====================

// Submit feedback for a scan (with rating)
export const submitFeedback = async (scanId, type, isAccurate, comments, rating = null) => {
  try {
    const requestBody = {
      scanId,
      type,
      isAccurate,
      comments
    };
    
    // Add rating if provided (for star rating)
    if (rating !== null) {
      requestBody.rating = rating;
    }
    
    const response = await api.post('/feedback', requestBody);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit feedback' };
  }
};

// Get feedback for a specific scan
export const getFeedbackByScanId = async (scanId) => {
  try {
    const response = await api.get(`/feedback/${scanId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch feedback' };
  }
};

// Get all feedback (admin)
export const getAllFeedback = async (limit = 100) => {
  try {
    const response = await api.get('/feedback/all', { params: { limit } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch feedback list' };
  }
};

// Get feedback statistics
export const getFeedbackStats = async () => {
  try {
    const response = await api.get('/feedback/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch feedback statistics' };
  }
};

// ==================== PDF REPORT ENDPOINTS ====================

// Download PDF report for URL scan
export const downloadURLPDFReport = async (scanId) => {
  try {
    const response = await api.get(`/reports/url/${scanId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to download PDF report' };
  }
};

// Download PDF report for message scan
export const downloadMessagePDFReport = async (scanId) => {
  try {
    const response = await api.get(`/reports/message/${scanId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to download PDF report' };
  }
};

// Download PDF report (unified)
export const downloadPDFReport = async (scanId, type) => {
  try {
    const response = await api.get(`/reports/${type}/${scanId}/pdf`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to download PDF report' };
  }
};

// Download bulk PDF report
export const downloadBulkPDFReport = async (scanIds, type = 'all') => {
  try {
    const response = await api.post('/reports/bulk/pdf', 
      { scanIds, type },
      { responseType: 'blob' }
    );
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to download bulk PDF report' };
  }
};

// ==================== ML SERVICE DIRECT CALLS ====================

// Direct call to ML service for URL prediction
export const predictURLWithML = async (url, features = null) => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict/url`, {
      url,
      features
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'ML service error' };
  }
};

// Direct call to ML service for message prediction
export const predictMessageWithML = async (message) => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict/message`, {
      text: message
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'ML service error' };
  }
};

// Check ML service health
export const checkMLHealth = async () => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`);
    return response.data;
  } catch (error) {
    throw { message: 'ML service is unavailable' };
  }
};

// Extract features from URL using ML service
export const extractURLFeatures = async (url) => {
  try {
    const response = await axios.post(`${ML_API_URL}/extract_features`, { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to extract features' };
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================

export default api;