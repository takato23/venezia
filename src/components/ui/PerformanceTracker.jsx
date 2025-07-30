import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Clock, 
  MemoryStick,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import usePerformanceMonitor from '../../hooks/usePerformanceMonitor';
import clsx from 'clsx';

const PerformanceIndicator = ({ metric, value, threshold, unit = 'ms', icon: Icon }) => {
  const isGood = value <= threshold.good;
  const isOk = value <= threshold.ok;
  const status = isGood ? 'good' : isOk ? 'ok' : 'poor';
  
  const statusColors = {
    good: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    ok: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    poor: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  };

  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
      statusColors[status]
    )}>
      <Icon className="h-4 w-4" />
      <span>{metric}</span>
      <span className="font-mono">
        {typeof value === 'number' ? Math.round(value) : value}{unit}
      </span>
    </div>
  );
};

const PerformanceTracker = ({ showDevMetrics = false }) => {
  const location = useLocation();
  const {
    measureRouteChange,
    measureMemoryUsage,
    generateReport,
    getMetrics
  } = usePerformanceMonitor();
  
  const [isVisible, setIsVisible] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState({});
  const [routeLoadTime, setRouteLoadTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(null);

  // Performance thresholds según Web Vitals
  const thresholds = {
    fcp: { good: 1800, ok: 3000 }, // First Contentful Paint
    lcp: { good: 2500, ok: 4000 }, // Largest Contentful Paint
    route: { good: 500, ok: 1000 }, // Route change time
    memory: { good: 50, ok: 100 }   // Memory usage in MB
  };

  // Medir tiempo de cambio de ruta
  useEffect(() => {
    const startTime = performance.now();
    
    // Simular finalización de carga de ruta
    const timeout = setTimeout(() => {
      const loadTime = measureRouteChange(location.pathname, startTime);
      setRouteLoadTime(loadTime);
    }, 100);

    return () => clearTimeout(timeout);
  }, [location.pathname, measureRouteChange]);

  // Actualizar métricas periódicamente
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = getMetrics();
      setCurrentMetrics(metrics);
      
      const memory = measureMemoryUsage();
      setMemoryUsage(memory);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []); // Dependencias vacías para evitar loops infinitos

  // Mostrar indicador solo si está explícitamente habilitado
  useEffect(() => {
    const showMetrics = showDevMetrics || localStorage.getItem('venezia-show-performance') === 'true';
    setIsVisible(showMetrics);
  }, [showDevMetrics]);

  // Keyboard shortcut para toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => {
          const newValue = !prev;
          localStorage.setItem('venezia-show-performance', newValue.toString());
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Performance
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          {/* Route Load Time */}
          <PerformanceIndicator
            metric="Route"
            value={routeLoadTime}
            threshold={thresholds.route}
            icon={Zap}
          />

          {/* First Contentful Paint */}
          {currentMetrics.firstContentfulPaint && (
            <PerformanceIndicator
              metric="FCP"
              value={currentMetrics.firstContentfulPaint}
              threshold={thresholds.fcp}
              icon={Clock}
            />
          )}

          {/* Largest Contentful Paint */}
          {currentMetrics.largestContentfulPaint && (
            <PerformanceIndicator
              metric="LCP"
              value={currentMetrics.largestContentfulPaint}
              threshold={thresholds.lcp}
              icon={TrendingUp}
            />
          )}

          {/* Memory Usage */}
          {memoryUsage && (
            <PerformanceIndicator
              metric="Memory"
              value={memoryUsage.used}
              threshold={thresholds.memory}
              unit="MB"
              icon={MemoryStick}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const report = generateReport();
                console.log('📊 Performance Report:', report);
                // Could also trigger download or send to analytics
              }}
              className="flex-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Generate Report
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Ctrl+Shift+P to toggle
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PerformanceTracker;