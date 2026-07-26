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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
    const response = await api.post("/scans", { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to scan URL" };
  }
};

export const scanMessage = async (message) => {
  try {
    const response = await api.post("/scans", { message });
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

// ==================== DASHBOARD ENDPOINTS ====================

export const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch dashboard statistics" };
  }
};

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

export default api;