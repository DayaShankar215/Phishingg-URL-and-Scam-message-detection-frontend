// services/api.js
import axios from "axios";

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
  (config) => {
    config.headers["ngrok-skip-browser-warning"] = "true";
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status}`, response);
    return response;
  },
  (error) => {
    console.error("[API Error]", error);
    if (error.code === "ERR_NETWORK") {
      throw { 
        message: "Cannot connect to server. Please check your connection.",
        isCorsError: true
      };
    }
    if (error.response) {
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
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
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
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    return response.data;
  } catch (error) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    throw error.response?.data || { message: "Logout failed" };
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put("/auth/profile", userData);
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
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
        "Accept": "application/json",
        "Content-Type": "application/json",
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