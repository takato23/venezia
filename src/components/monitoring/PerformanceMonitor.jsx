import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Server, Wifi, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';
import { Line } from 'react-chartjs-2';
import Button from '../ui/Button';

const PerformanceMonitor = ({ 
  position = 'bottom-right',
  defaultExpanded = false,
  showInProduction = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    cpu: 0,
    networkLatency: 0,
    apiCalls: []
  });
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const animationFrameId = useRef();
  const lastTime = useRef(performance.now());
  const frameCount = useRef(0);

  // Check if we should show the monitor
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  // Measure FPS
  const measureFPS = useCallback(() => {
    const currentTime = performance.now();
    frameCount.current++;

    if (currentTime >= lastTime.current + 1000) {
      const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
      frameCount.current = 0;
      lastTime.current = currentTime;
      
      setMetrics(prev => ({ ...prev, fps }));
    }

    animationFrameId.current = requestAnimationFrame(measureFPS);
  }, []);

  // Measure memory usage
  const measureMemory = useCallback(() => {
    if (performance.memory) {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      setMetrics(prev => ({ ...prev, memory: memoryMB }));
    }
  }, []);

  // Intercept API calls
  useEffect(() => {
    if (!shouldShow) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        setMetrics(prev => ({
          ...prev,
          apiCalls: [
            ...prev.apiCalls.slice(-9),
            {
              url: typeof url === 'string' ? url : url.url,
              duration,
              status: response.status,
              timestamp: Date.now()
            }
          ],
          networkLatency: duration
        }));
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        setMetrics(prev => ({
          ...prev,
          apiCalls: [
            ...prev.apiCalls.slice(-9),
            {
              url: typeof url === 'string' ? url : url.url,
              duration,
              status: 'error',
              timestamp: Date.now()
            }
          ],
          networkLatency: duration
        }));
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [shouldShow]);

  // Start measurements
  useEffect(() => {
    if (!shouldShow) return;

    measureFPS();
    const memoryInterval = setInterval(measureMemory, 1000);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      clearInterval(memoryInterval);
    };
  }, [measureFPS, measureMemory, shouldShow]);

  // Update performance history
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceHistory(prev => {
        const newHistory = [
          ...prev.slice(-29),
          {
            timestamp: Date.now(),
            fps: metrics.fps,
            memory: metrics.memory,
            latency: metrics.networkLatency
          }
        ];
        return newHistory;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [metrics]);

  if (!shouldShow) return null;

  const getPerformanceStatus = () => {
    if (metrics.fps < 30 || metrics.networkLatency > 1000) return 'poor';
    if (metrics.fps < 50 || metrics.networkLatency > 500) return 'moderate';
    return 'good';
  };

  const status = getPerformanceStatus();
  const statusColors = {
    good: 'text-green-500',
    moderate: 'text-yellow-500',
    poor: 'text-red-500'
  };

  const chartData = {
    labels: performanceHistory.map((_, i) => `${i}s`),
    datasets: [
      {
        label: 'FPS',
        data: performanceHistory.map(h => h.fps),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        yAxisID: 'fps'
      },
      {
        label: 'Memory (MB)',
        data: performanceHistory.map(h => h.memory),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'memory'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        display: false
      },
      fps: {
        type: 'linear',
        display: false,
        position: 'left',
        min: 0,
        max: 60
      },
      memory: {
        type: 'linear',
        display: false,
        position: 'right',
        min: 0
      }
    },
    maintainAspectRatio: false
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={clsx('fixed z-50', positionClasses[position])}>
      <AnimatePresence>
        {!isExpanded ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsExpanded(true)}
            className={clsx(
              'p-3 rounded-full shadow-lg',
              'bg-white dark:bg-gray-800',
              'hover:shadow-xl transition-shadow',
              'border-2',
              status === 'good' && 'border-green-500',
              status === 'moderate' && 'border-yellow-500',
              status === 'poor' && 'border-red-500'
            )}
          >
            <Activity className={clsx('h-5 w-5', statusColors[status])} />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Performance Monitor
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Metrics */}
            <div className="p-4 space-y-3">
              {/* FPS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">FPS</span>
                </div>
                <span className={clsx(
                  'text-sm font-medium',
                  metrics.fps >= 50 ? 'text-green-500' : 
                  metrics.fps >= 30 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {metrics.fps}
                </span>
              </div>

              {/* Memory */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.memory} MB
                </span>
              </div>

              {/* Network Latency */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Latency</span>
                </div>
                <span className={clsx(
                  'text-sm font-medium',
                  metrics.networkLatency <= 200 ? 'text-green-500' : 
                  metrics.networkLatency <= 500 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {metrics.networkLatency}ms
                </span>
              </div>

              {/* Performance Chart */}
              {performanceHistory.length > 0 && (
                <div className="h-24 mt-4">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}

              {/* Recent API Calls */}
              {metrics.apiCalls.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Recent API Calls
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {metrics.apiCalls.map((call, index) => (
                      <div 
                        key={index}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between"
                      >
                        <span className="truncate flex-1">
                          {call.url.replace(window.location.origin, '')}
                        </span>
                        <span className={clsx(
                          'ml-2 font-medium',
                          call.status === 'error' ? 'text-red-500' :
                          call.duration <= 200 ? 'text-green-500' : 
                          call.duration <= 500 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {call.duration}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Warning */}
              {status !== 'good' && (
                <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      {status === 'poor' 
                        ? 'Performance issues detected. Consider optimizing your application.'
                        : 'Moderate performance. Monitor for potential issues.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceMonitor;