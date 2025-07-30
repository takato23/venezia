import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = toastId++;
    const newToast = {
      id,
      ...toast,
      createdAt: Date.now()
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const success = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const error = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'error',
      title,
      message,
      persistent: true, // Los errores son persistentes por defecto
      ...options
    });
  }, [addToast]);

  const warning = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 7000, // Más tiempo para warnings
      ...options
    });
  }, [addToast]);

  const info = useCallback((title, message, options = {}) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addToast]);

  // Toast para operaciones de carga
  const loading = useCallback((title, message = 'Procesando...') => {
    return addToast({
      type: 'info',
      title,
      message,
      persistent: true,
      duration: 0
    });
  }, [addToast]);

  // Toast para operaciones exitosas con acción
  const successWithAction = useCallback((title, message, actionLabel, actionCallback) => {
    return addToast({
      type: 'success',
      title,
      message,
      action: {
        label: actionLabel,
        onClick: actionCallback
      }
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    loading,
    successWithAction
  };
}; 