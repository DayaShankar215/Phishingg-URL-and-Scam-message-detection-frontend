// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Default backend endpoint used by the release app.
// IMPORTANT: Override this at build time so the APK does not depend on a
// local ngrok tunnel. Use any of:
//   1. EXPO_PUBLIC_API_URL environment variable (e.g. in EAS build / .env)
//   2. app.json -> expo.extra.apiUrl
//   3. This fallback value below.
const DEFAULT_API_BASE_URL = "https://mud-cable-passerby.ngrok-free.dev";

const normalizeBaseUrl = (url) => (url || '').replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  try {
    const extraUrl = Constants.expoConfig?.extra?.apiUrl;
    if (extraUrl) {
      return normalizeBaseUrl(extraUrl);
    }
  } catch (error) {
    console.warn("Unable to read apiUrl from Expo config:", error);
  }

  return normalizeBaseUrl(DEFAULT_API_BASE_URL);
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 60000,
});

console.log(`[API] Using base URL: ${API_BASE_URL}`);

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
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status}`, response);
    return response;
  },
  async (error) => {
    console.error("[API Error]", error);
    
    // Network errors
    if (error.code === "ERR_NETWORK") {
      throw { 
        message: "Cannot connect to server. Please check your connection.",
        isCorsError: true,
        status: 0
      };
    }
    
    if (error.response) {
      console.error(`[API] Status: ${error.response.status}`, error.response.data);
      
      // ✅ Check if it's a feedback endpoint
      const isFeedbackEndpoint = error.config?.url?.includes('/feedback');
      const isAccuracyEndpoint = error.config?.url?.includes('/feedback/accuracy');
      
      // ✅ For 401 Unauthorized - only logout for non-feedback endpoints
      if (error.response.status === 401 && !isFeedbackEndpoint && !isAccuracyEndpoint) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("user");
        throw { 
          message: "Session expired. Please login again.",
          status: 401,
          isAuthError: true
        };
      }
      
      // ✅ For 403 on feedback - just throw without logging out
      if (error.response.status === 403 && (isFeedbackEndpoint || isAccuracyEndpoint)) {
        throw { 
          message: "Please log in to submit feedback.",
          status: 403,
          isAuthError: false
        };
      }
      
      // ✅ For 403 on other endpoints
      if (error.response.status === 403) {
        throw { 
          message: "Access denied. Please contact with administrator.",
          status: 403,
          isAuthError: true
        };
      }
      
      // ✅ For 404 Not Found
      if (error.response.status === 404) {
        throw { 
          status: 404, 
          message: "Resource not found. It may have been deleted." 
        };
      }
      
      const errorData = error.response.data || { message: "Server error occurred" };
      errorData.status = error.response.status;
      throw errorData;
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
    throw error.response?.data || { message: "Email or password is incorrect" };
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

export const getScanHistory = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await api.get("/scans", { params });
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
    const ref = String(reference).trim();
    if (!ref) {
      throw new Error("Invalid reference ID");
    }
    
    console.log(`[DELETE] Attempting to delete scan: ${ref}`);
    
    const response = await api.delete(`/scans/${ref}`, {
      headers: { 
        "Accept": "*/*",
        "Content-Type": "*/*",
      },
    });
    
    console.log(`[DELETE] Response status: ${response.status}`, response);
    
    if (response.status === 204) {
      return { message: "Scan deleted successfully", success: true };
    }
    
    if (response.data) {
      return response.data;
    }
    
    return { message: "Scan deleted successfully", success: true };
  } catch (error) {
    console.error("[DELETE] Error:", error);
    
    if (error.code === "ERR_NETWORK") {
      throw { 
        message: "Cannot connect to server. Please check your connection.",
        isCorsError: true
      };
    }
    
    if (error.response) {
      console.error(`[DELETE] Response status: ${error.response.status}`);
      console.error(`[DELETE] Response data:`, error.response.data);
      
      if (error.response.status === 204) {
        return { message: "Scan deleted successfully", success: true };
      }
      
      if (error.response.status === 401) {
        throw { 
          status: 401, 
          message: "Session expired. Please login again." 
        };
      }
      
      if (error.response.status === 403) {
        throw { 
          status: 403, 
          message: "You don't have permission to delete this scan." 
        };
      }
      
      if (error.response.status === 404) {
        throw { 
          status: 404, 
          message: "Scan not found. It may have already been deleted." 
        };
      }
      
      throw error.response.data || { message: "Failed to delete scan" };
    }
    
    throw { message: error.message || "Failed to delete scan" };
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

// ==================== FEEDBACK ENDPOINTS ====================

export const submitFeedbackMessage = async (message) => {
  try {
    console.log("[Feedback] Submitting:", { message });
    const response = await api.post("/feedback", { message });
    console.log("[Feedback] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[Feedback] Error:", error);
    throw error.response?.data || { message: "Failed to submit feedback" };
  }
};

export const submitAccuracy = async (data) => {
  try {
    if (!data.reference) {
      throw new Error("Scan reference is required");
    }
    const payload = {
      reference: data.reference,
      accurate: data.accurate
    };
    console.log("[Accuracy] Submitting:", payload);
    const response = await api.post("/feedback/accuracy", payload);
    console.log("[Accuracy] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[Accuracy] Error:", error);
    throw error.response?.data || { message: "Failed to submit accuracy" };
  }
};

export default api;