// hooks/useGuestSession.js
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const GUEST_STORAGE_KEY = "guest_scans";

export const useGuestSession = () => {
  const [scans, setScans] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  // Load guest scans from localStorage on mount
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
    };

    loadGuestData();
  }, []);

  // Save guest scans to localStorage whenever they change
  useEffect(() => {
    if (sessionId !== null) {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
          sessionId,
          scans,
        }));
      } catch (error) {
        console.error("Failed to save guest data:", error);
      }
    }
  }, [scans, sessionId]);

  const addScan = (scan) => {
    const newScan = {
      ...scan,
      id: scan.id || `guest_${Date.now()}`,
      date: scan.date || new Date().toISOString(),
    };
    setScans((prev) => [newScan, ...prev]);
    return newScan;
  };

  const clearScans = () => {
    setScans([]);
  };

  const getScans = () => scans;

  const getScanCount = () => scans.length;

  const getStats = () => {
    const total = scans.length;
    const phishing = scans.filter(s => s.result === "phishing").length;
    const scam = scans.filter(s => s.result === "scam").length;
    const safe = scans.filter(s => s.result === "safe").length;
    const avgRisk = total > 0 ? scans.reduce((sum, s) => sum + (s.riskScore || 0), 0) / total : 0;

    return { total, phishing, scam, safe, avgRisk };
  };

  const migrateToUser = async (userId) => {
    // This would be called after user logs in
    // The actual migration would happen on the backend
    // We just clear the guest data
    const guestScans = [...scans];
    clearScans();
    return guestScans;
  };

  return {
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
};