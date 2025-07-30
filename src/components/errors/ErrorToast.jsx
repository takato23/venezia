import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const ErrorToast = () => {
  const { errors, clearError } = useErrorHandler();
  const [visibleErrors, setVisibleErrors] = useState([]);

  useEffect(() => {
    // Show only the last 3 errors as toasts
    const recentErrors = errors.slice(-3).map(error => ({
      ...error,
      visible: true
    }));
    setVisibleErrors(recentErrors);

    // Auto-dismiss errors after 5 seconds
    const timers = recentErrors.map(error => 
      setTimeout(() => {
        setVisibleErrors(prev => 
          prev.map(e => e.id === error.id ? { ...e, visible: false } : e)
        );
        
        // Remove from global errors after animation
        setTimeout(() => clearError(error.id), 300);
      }, 5000)
    );

    return () => timers.forEach(clearTimeout);
  }, [errors, clearError]);

  const getErrorIcon = (error) => {
    const type = error.context?.type;
    const severity = error.context?.severity;

    if (type === 'api') {
      if (severity === 'high') return '🚨';
      if (severity === 'medium') return '⚠️';
      return 'ℹ️';
    }

    if (type === 'javascript') return '🐛';
    if (type === 'unhandledrejection') return '💥';
    if (type === 'network') return '🌐';
    
    return '❌';
  };

  const getErrorMessage = (error) => {
    const type = error.context?.type;
    
    if (type === 'api') {
      const status = error.context?.status;
      if (status === 404) return 'Recurso no encontrado';
      if (status === 401) return 'No autorizado';
      if (status === 403) return 'Acceso denegado';
      if (status >= 500) return 'Error del servidor';
      if (status >= 400) return 'Error en la solicitud';
    }

    if (type === 'network') return 'Error de conexión';
    
    return error.error?.message || 'Ha ocurrido un error';
  };

  const handleDismiss = (errorId) => {
    setVisibleErrors(prev => 
      prev.map(e => e.id === errorId ? { ...e, visible: false } : e)
    );
    
    setTimeout(() => clearError(errorId), 300);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleErrors.filter(e => e.visible).map((error) => (
          <motion.div
            key={error.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`
              bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-lg p-4 
              max-w-sm min-w-[300px] cursor-pointer
              ${error.context?.severity === 'high' ? 'border-red-500' : 
                error.context?.severity === 'medium' ? 'border-yellow-500' : 
                'border-blue-500'}
            `}
            onClick={() => handleDismiss(error.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="text-lg flex-shrink-0">
                {getErrorIcon(error)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getErrorMessage(error)}
                </p>
                
                {error.context?.endpoint && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {error.context.endpoint}
                  </p>
                )}
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(error.id);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ErrorToast;