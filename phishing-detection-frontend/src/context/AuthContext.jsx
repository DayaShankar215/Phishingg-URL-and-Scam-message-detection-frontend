// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  register as apiRegister,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated,
} from "../services/api";
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
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (authenticated) {
        const userData = getCurrentUser();
        setUser(userData);
        setIsAuthenticatedState(true);
      } else {
        setUser(null);
        setIsAuthenticatedState(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      setUser(response.user);
      setIsAuthenticatedState(true);
      toast.success("Account created successfully! 🎉");
      return response;
    } catch (error) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      setUser(response.user);
      setIsAuthenticatedState(true);
      toast.success("Welcome back! 🎉");
      return response;
    } catch (error) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      setUser(null);
      setIsAuthenticatedState(false);
      toast.success("Logged out successfully");
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: isAuthenticatedState,
    register,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
