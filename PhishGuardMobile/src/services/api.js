// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "https://mud-cable-passerby.ngrok-free.dev";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 60000,
});

// --- Request Interceptor ---
api.interceptors.request.use(
  async (config) => {
    config.headers["ngrok-skip-browser-warning"] = "true";
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === "ERR_NETWORK") {
      throw { 
        message: "Cannot connect to server. Please check your connection.",
        isCorsError: true,
        status: 0
      };
    }
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("user");
      throw { 
        message: "Session expired. Please login again.",
        status: 401,
        isAuthError: true
      };
    }
    if (error.response && error.response.status === 403) {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("user");
      throw { 
        message: "Access denied. Please login again.",
        status: 403,
        isAuthError: true
      };
    }
    if (error.response) {
      throw error.response.data || { message: "Server error occurred" };
    }
    throw { message: error.message || "An error occurred" };
  }
);

// ==================== AUTH ENDPOINTS ====================

export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    if (response.data.accessToken) {
      await AsyncStorage.setItem("accessToken", response.data.accessToken);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    if (response.data.accessToken) {
      await AsyncStorage.setItem("accessToken", response.data.accessToken);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("user");
    return response.data;
  } catch (error) {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("user");
    throw error.response?.data || { message: "Logout failed" };
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    return !!token;
  } catch {
    return false;
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put("/auth/profile", userData);
    if (response.data.user) {
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }
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

export const getPrediction = (scan) => {
  return scan.overallPrediction || scan.prediction || "UNKNOWN";
};

export const scanURL = async (url) => {
  try {
    const response = await api.post("/scans/url", { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to scan URL" };
  }
};

export const scanMessage = async (message) => {
  try {
    const response = await api.post("/scans/messages", { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to scan message" };
  }
};

// ==================== HISTORY ENDPOINTS ====================

export const getScanHistory = async () => {
  try {
    const response = await api.get("/scans");
    return response.data;
  } catch (error) {
    if (error.status === 401 || error.status === 403 || error.isAuthError) {
      throw { 
        message: "Please login to view scan history",
        status: error.status || 401,
        isAuthError: true
      };
    }
    throw error.response?.data || { message: "Failed to fetch scan history" };
  }
};

export const getScanByReference = async (reference) => {
  try {
    const response = await api.get(`/scans/${reference}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch scan details" };
  }
};

export const deleteScanByReference = async (reference) => {
  try {
    const response = await api.delete(`/scans/${reference}`, {
      headers: { "Accept": "*/*" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete scan" };
  }
};

export const downloadScanReport = async (reference) => {
  try {
    const response = await api.get(`/scans/${reference}/report`, {
      responseType: "blob",
    });
    return response;
  } catch (error) {
    if (error.response && error.response.data) {
      try {
        const errorText = await error.response.data.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw errorJson;
        } catch {
          throw { message: errorText || "Failed to download report" };
        }
      } catch {
        throw { message: "Failed to download report" };
      }
    }
    throw { message: "Failed to download report" };
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch dashboard statistics" };
  }
};

// ==================== FEEDBACK ENDPOINT ====================

export const submitFeedback = async (message) => {
  try {
    const body = { message: message };
    const response = await api.post("/feedback", body);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to submit feedback" };
  }
};

export default api;