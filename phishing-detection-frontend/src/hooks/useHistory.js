import { useState, useEffect } from "react";

export const useHistory = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      setScans(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { scans, loading, error, fetchHistory };
};

export default useHistory;
