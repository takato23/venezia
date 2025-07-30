import { useEffect, useRef, useCallback } from 'react';

const useChatPerformance = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const performanceData = useRef({
    renders: [],
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity
  });

  // Incrementar contador de renders
  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const renderTime = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    // Guardar datos de rendimiento
    performanceData.current.renders.push({
      count: renderCount.current,
      time: renderTime,
      timestamp: currentTime
    });

    // Calcular estadísticas
    if (renderTime > performanceData.current.maxRenderTime) {
      performanceData.current.maxRenderTime = renderTime;
    }
    if (renderTime < performanceData.current.minRenderTime) {
      performanceData.current.minRenderTime = renderTime;
    }

    const totalTime = performanceData.current.renders.reduce((sum, r) => sum + r.time, 0);
    performanceData.current.averageRenderTime = totalTime / performanceData.current.renders.length;

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development' && renderCount.current > 1) {
      console.log(`⚡ ${componentName} render #${renderCount.current} - ${renderTime}ms`);
    }

    // Limpiar datos antiguos (mantener solo últimos 100 renders)
    if (performanceData.current.renders.length > 100) {
      performanceData.current.renders = performanceData.current.renders.slice(-100);
    }
  });

  // Función para obtener reporte de rendimiento
  const getPerformanceReport = useCallback(() => {
    return {
      component: componentName,
      totalRenders: renderCount.current,
      averageRenderTime: performanceData.current.averageRenderTime.toFixed(2) + 'ms',
      maxRenderTime: performanceData.current.maxRenderTime + 'ms',
      minRenderTime: performanceData.current.minRenderTime + 'ms',
      lastRenders: performanceData.current.renders.slice(-10)
    };
  }, [componentName]);

  // Función para resetear métricas
  const resetMetrics = useCallback(() => {
    renderCount.current = 0;
    performanceData.current = {
      renders: [],
      averageRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity
    };
  }, []);

  return {
    renderCount: renderCount.current,
    getPerformanceReport,
    resetMetrics
  };
};

export default useChatPerformance;