// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, login as apiLogin, register as apiRegister, logout as apiLogout } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const response = await getCurrentUser();
          if (response && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            // Token invalid
            localStorage.removeItem("authToken");
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      if (response.token) {
        localStorage.setItem("authToken", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success("Welcome back! 🎉");
        return response;
      }
      throw new Error("No token received");
    } catch (error) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      if (response.token) {
        localStorage.setItem("authToken", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success("Account created successfully! 🎉");
        return response;
      }
      throw new Error("No token received");
    } catch (error) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
    setIsAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};