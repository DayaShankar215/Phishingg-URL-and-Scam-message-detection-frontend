import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// URL Detection
export const scanURL = async (url) => {
  try {
    const response = await api.post('/scan/url', { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan URL' };
  }
};

// Message Detection
export const scanMessage = async (message) => {
  try {
    const response = await api.post('/scan/message', { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan message' };
  }
};

// Get Scan History
export const getScanHistory = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await api.get('/scans', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scan history' };
  }
};

// Get Scan by ID
export const getScanById = async (id, type) => {
  try {
    const response = await api.get(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scan details' };
  }
};

// Submit Feedback
export const submitFeedback = async (scanId, type, isAccurate, comments) => {
  try {
    const response = await api.post('/feedback', {
      scanId,
      type,
      isAccurate,
      comments
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit feedback' };
  }
};

// Get Dashboard Statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dashboard statistics' };
  }
};

// Download PDF Report
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

export default api;