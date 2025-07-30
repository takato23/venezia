import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { isInOfflineMode } from '../../services/apiInterceptor';
import Button from './Button';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Verificar si el usuario ha deshabilitado el indicador
  const isDisabled = localStorage.getItem('venezia-disable-offline-indicator') === 'true';

  useEffect(() => {
    // Verificar estado inicial - pero solo mostrar después de un delay
    const checkInitial = () => {
      const offline = isInOfflineMode();
      setIsOffline(offline);
      // Solo mostrar si está offline por más de 10 segundos (menos molesto)
      if (offline) {
        setTimeout(() => {
          if (isInOfflineMode()) {
            setIsVisible(true);
          }
        }, 10000);
      }
    };

    checkInitial();

    // Verificar cada 30 segundos (menos frecuente)
    const interval = setInterval(() => {
      const offline = isInOfflineMode();
      setIsOffline(offline);
      
      if (!offline && isVisible) {
        // Mantener visible por 2 segundos después de reconectar
        setTimeout(() => setIsVisible(false), 2000);
      }
    }, 30000);

    // Escuchar eventos de red del navegador
    const handleOnline = () => {
      setRetryCount(0);
      // Intentar reconectar
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isVisible]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleDisable = () => {
    localStorage.setItem('venezia-disable-offline-indicator', 'true');
    setIsVisible(false);
  };

  if (!isVisible || isDisabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
      >
        <div className={`
          backdrop-blur-md rounded-lg shadow-lg p-4
          ${isOffline 
            ? 'bg-orange-500/90 text-white' 
            : 'bg-green-500/90 text-white'
          }
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOffline ? (
                <CloudOff className="h-5 w-5" />
              ) : (
                <Cloud className="h-5 w-5" />
              )}
              <div>
                <h4 className="font-semibold">
                  {isOffline ? 'Modo Offline' : 'Conexión Restaurada'}
                </h4>
                <p className="text-sm opacity-90">
                  {isOffline 
                    ? 'Trabajando con datos locales. Los cambios se sincronizarán cuando se restaure la conexión.'
                    : 'La conexión con el servidor ha sido restaurada.'
                  }
                </p>
              </div>
            </div>
            
            {isOffline && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleRetry}
                  className="text-white hover:bg-white/20"
                >
                  Reintentar
                  {retryCount > 0 && ` (${retryCount})`}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisable}
                  className="text-white hover:bg-white/20 text-xs"
                  title="Deshabilitar este indicador permanentemente"
                >
                  ×
                </Button>
              </div>
            )}
          </div>

          {/* Barra de progreso para reconexión automática */}
          {isOffline && (
            <motion.div
              className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 30, ease: 'linear' }}
                onAnimationComplete={handleRetry}
              />
            </motion.div>
          )}
        </div>

        {/* Información adicional */}
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 bg-gray-800/90 backdrop-blur-md rounded-lg p-3 text-white text-sm"
          >
            <div className="flex items-start gap-2">
              <WifiOff className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">¿Qué puedes hacer en modo offline?</p>
                <ul className="space-y-1 text-xs opacity-90">
                  <li>• Ver información guardada en caché</li>
                  <li>• Navegar por la aplicación</li>
                  <li>• Los cambios se guardarán localmente</li>
                  <li>• Se sincronizará automáticamente al reconectar</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;