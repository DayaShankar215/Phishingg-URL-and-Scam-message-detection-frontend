import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  register as apiRegister, 
  login as apiLogin, 
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated
} from '../services/api';
import { showToast } from '../components/Toaster';

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
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticatedState(true);
        } else {
          setUser(null);
          setIsAuthenticatedState(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setIsAuthenticatedState(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (userData) => {
    try {
      const response = await apiRegister(userData);
      setUser(response.user);
      setIsAuthenticatedState(true);
      showToast("Account created successfully! 🎉", "success");
      return response;
    } catch (error) {
      showToast(error.message || "Registration failed", "error");
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      setUser(response.user);
      setIsAuthenticatedState(true);
      showToast("Welcome back! 🎉", "success");
      return response;
    } catch (error) {
      showToast(error.message || "Login failed", "error");
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
      showToast("Logged out successfully", "success");
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