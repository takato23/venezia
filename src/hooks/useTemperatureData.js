import { useState, useEffect, useCallback } from 'react';
import temperatureService from '../services/temperatureService';

// Custom hook for temperature data with simulated service
export const useTemperatureData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentData = await temperatureService.getCurrentData();
      setData(currentData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// Hook for temperature history
export const useTemperatureHistory = (range = '24h') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await temperatureService.getHistory(range);
        setData(history);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [range]);

  return { data, loading, error };
};

// Hook for device configuration
export const useTemperatureDevices = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const devices = await temperatureService.getDevices();
        setData(devices);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const updateDevices = useCallback(async (devices) => {
    try {
      await temperatureService.updateDevices(devices);
      const updatedDevices = await temperatureService.getDevices();
      setData(updatedDevices);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return { data, loading, error, updateDevices };
};

// Hook for alert configuration
export const useTemperatureAlerts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const config = await temperatureService.getAlertConfig();
        setData(config);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const updateConfig = useCallback(async (config) => {
    try {
      await temperatureService.updateAlertConfig(config);
      setData(config);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return { data, loading, error, updateConfig };
};