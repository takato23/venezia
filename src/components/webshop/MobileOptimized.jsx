import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, WifiOff, AlertCircle, Check } from 'lucide-react';

const MobileOptimized = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionSpeed, setConnectionSpeed] = useState('4g');
  const [showAlert, setShowAlert] = useState(false);
  
  useEffect(() => {
    // Detectar dispositivo móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Detectar estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Detectar velocidad de conexión (aproximada)
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const updateConnectionSpeed = () => {
        if (connection.effectiveType) {
          setConnectionSpeed(connection.effectiveType);
        }
      };
      
      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Aplicar optimizaciones para móviles
  useEffect(() => {
    if (isMobile) {
      // Deshabilitar animaciones complejas en conexiones lentas
      if (connectionSpeed === 'slow-2g' || connectionSpeed === '2g') {
        document.body.classList.add('reduced-motion');
      }
      
      // Precargar solo imágenes visibles
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
      
      return () => {
        images.forEach(img => imageObserver.unobserve(img));
      };
    }
  }, [isMobile, connectionSpeed]);
  
  return (
    <>
      {/* Alerta de conexión */}
      <AnimatePresence>
        {!isOnline && showAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5" />
                <p className="font-medium">
                  Sin conexión - Mostrando contenido guardado
                </p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Indicador de conexión lenta */}
      {isMobile && (connectionSpeed === 'slow-2g' || connectionSpeed === '2g') && (
        <div className="fixed bottom-20 left-4 right-4 z-30">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-start gap-2"
          >
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Conexión lenta detectada</p>
              <p>Hemos optimizado la página para cargar más rápido</p>
            </div>
          </motion.div>
        </div>
      )}
      
      {children}
    </>
  );
};

// Componente de imagen optimizada
export const OptimizedImage = ({ src, alt, className = '', ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Generar URL de imagen optimizada según el dispositivo
  const getOptimizedSrc = () => {
    if (!src) return '';
    
    // Si es una URL de Unsplash, optimizar parámetros
    if (src.includes('unsplash.com')) {
      const isMobile = window.innerWidth <= 768;
      const width = isMobile ? 400 : 800;
      const quality = isMobile ? 75 : 90;
      
      return src.includes('?') 
        ? `${src}&w=${width}&q=${quality}&fm=webp`
        : `${src}?w=${width}&q=${quality}&fm=webp`;
    }
    
    return src;
  };
  
  return (
    <div className={`relative ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-lg" />
      )}
      
      {error && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">🍦</div>
            <p className="text-sm">Imagen no disponible</p>
          </div>
        </div>
      )}
      
      <img
        src={getOptimizedSrc()}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

// Hook para detectar si es móvil
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

export default MobileOptimized;