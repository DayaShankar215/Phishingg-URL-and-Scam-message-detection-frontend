// services/api.js
import axios from "axios";

// Use environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.1.78:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== AUTH ENDPOINTS ====================

export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Logout failed" };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to get user info" };
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put("/auth/profile", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update profile" };
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await api.put("/auth/change-password", passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to change password" };
  }
};

// ==================== SCAN ENDPOINTS ====================

export const scanURL = async (url) => {
  try {
    const response = await api.post("/scan/url", { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to scan URL" };
  }
};

export const scanMessage = async (message) => {
  try {
    const response = await api.post("/scan/message", { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to scan message" };
  }
};

// ==================== HISTORY ENDPOINTS ====================

export const getScanHistory = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await api.get("/scans", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch scan history" };
  }
};

export const getScanById = async (id, type) => {
  try {
    const response = await api.get(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch scan details" };
  }
};

export const deleteScanById = async (id, type) => {
  try {
    const response = await api.delete(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete scan" };
  }
};

export const clearScanHistory = async () => {
  try {
    const response = await api.delete("/scans/clear");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to clear scan history" };
  }
};

// ==================== DASHBOARD ENDPOINTS ====================

export const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch dashboard statistics" };
  }
};

// ==================== FEEDBACK ENDPOINTS ====================

export const submitFeedback = async (scanId, type, isAccurate, comments, rating = null) => {
  try {
    const body = { scanId, type, isAccurate, comments };
    if (rating !== null) body.rating = rating;
    const response = await api.post("/feedback", body);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to submit feedback" };
  }
};

// ==================== PDF REPORT ENDPOINTS ====================

export const downloadPDFReport = async (scanId, type) => {
  try {
    const response = await api.get(`/reports/${type}/${scanId}/pdf`, {
      responseType: "blob",
    });
    return response;
  } catch (error) {
    if (error.response && error.response.data) {
      const errorText = await error.response.data.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw errorJson;
      } catch {
        throw { message: errorText || "Failed to download PDF report" };
      }
    }
    throw { message: "Failed to download PDF report" };
  }
};

export default api;