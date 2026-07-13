// context/GuestContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const GUEST_STORAGE_KEY = "guest_data";

const GuestContext = createContext();

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
};

export const GuestProvider = ({ children }) => {
  const [scans, setScans] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadGuestData = () => {
      try {
        const stored = localStorage.getItem(GUEST_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          setScans(data.scans || []);
          setSessionId(data.sessionId || uuidv4());
        } else {
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
            sessionId: newSessionId,
            scans: [],
          }));
        }
      } catch (error) {
        console.error("Failed to load guest data:", error);
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
      }
      setIsInitialized(true);
    };

    loadGuestData();
  }, []);

  useEffect(() => {
    if (isInitialized && sessionId !== null) {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
          sessionId,
          scans,
        }));
      } catch (error) {
        console.error("Failed to save guest data:", error);
      }
    }
  }, [scans, sessionId, isInitialized]);

  const addScan = (scan) => {
    const newScan = {
      ...scan,
      id: scan.id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: scan.date || new Date().toISOString(),
      isGuest: true,
    };
    setScans((prev) => [newScan, ...prev]);
    return newScan;
  };

  const clearScans = () => {
    setScans([]);
    if (sessionId) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
        sessionId,
        scans: [],
      }));
    }
  };

  const getScans = () => scans;

  const getScanCount = () => scans.length;

  const getStats = () => {
    const total = scans.length;
    const phishing = scans.filter(s => s.result === "phishing" || s.result === "dangerous").length;
    const scam = scans.filter(s => s.result === "scam" || s.result === "suspicious").length;
    const safe = scans.filter(s => s.result === "safe" || s.result === "clean").length;
    const avgRisk = total > 0 ? scans.reduce((sum, s) => sum + (s.riskScore || 0), 0) / total : 0;

    return { total, phishing, scam, safe, avgRisk };
  };

  const migrateToUser = async () => {
    const guestScans = [...scans];
    clearScans();
    return guestScans;
  };

  const value = {
    scans,
    sessionId,
    addScan,
    clearScans,
    getScans,
    getScanCount,
    getStats,
    migrateToUser,
    isGuest: true,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
};