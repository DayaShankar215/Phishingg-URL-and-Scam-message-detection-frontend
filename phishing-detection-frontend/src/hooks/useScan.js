import { useState } from 'react';

export const useScan = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scan = async (input, type) => {
    setScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, type }),
      });
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setScanning(false);
    }
  };

  return { scanning, result, error, scan };
};

export default useScan;