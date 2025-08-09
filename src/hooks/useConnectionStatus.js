import { useState, useEffect } from 'react';
import axios from 'axios';

const useConnectionStatus = (checkInterval = 30000) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let intervalId;

    const checkConnection = async () => {
      if (!mounted) return;
      
      try {
        // Usar un endpoint que sabemos que existe para verificar conexión
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await axios.get(`${apiUrl}/deliveries`, {
          timeout: 5000, // 5 segundos de timeout
          validateStatus: (status) => status < 500 // Aceptar cualquier respuesta que no sea error del servidor
        });
        
        if (mounted) {
          // Si el endpoint responde (incluso con datos vacíos), consideramos que estamos conectados
          setConnectionStatus('connected');
          setLastChecked(new Date());
          setError(null);
        }
      } catch (error) {
        if (mounted) {
          setConnectionStatus('disconnected');
          setLastChecked(new Date());
          setError(error.message);
        }
      }
    };

    // Check inicial
    checkConnection();

    // Configurar intervalo
    if (checkInterval > 0) {
      intervalId = setInterval(checkConnection, checkInterval);
    }

    // Listener para eventos de red
    const handleOnline = () => {
      if (mounted) {
        checkConnection();
      }
    };

    const handleOffline = () => {
      if (mounted) {
        setConnectionStatus('disconnected');
        setError('Sin conexión a internet');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkInterval]);

  return {
    connectionStatus,
    lastChecked,
    error,
    isConnected: connectionStatus === 'connected',
    isDisconnected: connectionStatus === 'disconnected',
    isChecking: connectionStatus === 'checking'
  };
};

export default useConnectionStatus;