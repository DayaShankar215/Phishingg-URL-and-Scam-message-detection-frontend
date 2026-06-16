import axios from 'axios';

// CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
// Run 'ipconfig' in CMD to find your IP
const API_BASE_URL = 'http://192.168.1.80/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// URL Scan
export const scanURL = async (url) => {
  try {
    const response = await api.post('/scan/url', { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan URL' };
  }
};

// Message Scan
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
    throw error.response?.data || { message: 'Failed to fetch history' };
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

// Get Dashboard Stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch statistics' };
  }
};

// Submit Feedback
export const submitFeedback = async (scanId, type, isAccurate, comments, rating = null) => {
  try {
    const body = { scanId, type, isAccurate, comments };
    if (rating !== null) body.rating = rating;
    const response = await api.post('/feedback', body);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit feedback' };
  }
};

export default api;