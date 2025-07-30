import { useEffect, useCallback, useRef } from 'react';

const usePerformanceMonitor = () => {
  const metricsRef = useRef({
    navigationStart: 0,
    domContentLoaded: 0,
    loadComplete: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    routeChanges: [],
    componentMounts: [],
    apiCalls: []
  });

  // Monitorear Core Web Vitals
  const measureWebVitals = useCallback(() => {
    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              metricsRef.current.firstContentfulPaint = entry.startTime;
              console.log(`🎨 FCP: ${Math.round(entry.startTime)}ms`);
            }
          }
        });
        
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            metricsRef.current.largestContentfulPaint = lastEntry.startTime;
            console.log(`🖼️ LCP: ${Math.round(lastEntry.startTime)}ms`);
          }
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Input Delay (FID) - aproximación con event timing
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const inputDelay = entry.processingStart - entry.startTime;
            console.log(`⚡ Input Delay: ${Math.round(inputDelay)}ms`);
          }
        });

        if (PerformanceObserver.supportedEntryTypes.includes('first-input')) {
          fidObserver.observe({ entryTypes: ['first-input'] });
        }

      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }
    }
  }, []);

  // Monitorear tiempo de carga de rutas
  const measureRouteChange = useCallback((route, startTime = performance.now()) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    metricsRef.current.routeChanges.push({
      route,
      duration,
      timestamp: Date.now()
    });

    console.log(`🚀 Route "${route}" loaded in ${Math.round(duration)}ms`);

    // Alerta si la ruta toma más de 1 segundo
    if (duration > 1000) {
      console.warn(`⚠️ Slow route loading: ${route} took ${Math.round(duration)}ms`);
    }

    return duration;
  }, []);

  // Monitorear tiempo de montaje de componentes
  const measureComponentMount = useCallback((componentName, startTime = performance.now()) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    metricsRef.current.componentMounts.push({
      component: componentName,
      duration,
      timestamp: Date.now()
    });

    console.log(`🔧 Component "${componentName}" mounted in ${Math.round(duration)}ms`);

    return duration;
  }, []);

  // Monitorear llamadas API
  const measureApiCall = useCallback((endpoint, startTime, endTime, success = true) => {
    const duration = endTime - startTime;
    
    metricsRef.current.apiCalls.push({
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    });

    const status = success ? '✅' : '❌';
    console.log(`${status} API "${endpoint}" took ${Math.round(duration)}ms`);

    // Alerta si la API toma más de 3 segundos
    if (duration > 3000) {
      console.warn(`⚠️ Slow API call: ${endpoint} took ${Math.round(duration)}ms`);
    }

    return duration;
  }, []);

  // Optimizar recursos con prefetch/preload
  const optimizeResource = useCallback((url, type = 'prefetch') => {
    if (!url) return;

    const link = document.createElement('link');
    link.rel = type; // prefetch, preload, preconnect
    link.href = url;
    
    if (type === 'preload') {
      link.as = 'script'; // o 'style', 'image', etc.
    }

    document.head.appendChild(link);
    console.log(`🔗 ${type}: ${url}`);
  }, []);

  // Lazy load con Intersection Observer
  const createLazyLoader = useCallback((threshold = 0.1) => {
    if (!('IntersectionObserver' in window)) {
      return null;
    }

    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          
          // Lazy load images
          if (target.dataset.src) {
            target.src = target.dataset.src;
            target.removeAttribute('data-src');
          }
          
          // Lazy load components
          if (target.dataset.component) {
            const event = new CustomEvent('lazyLoad', {
              detail: { component: target.dataset.component }
            });
            target.dispatchEvent(event);
          }
        }
      });
    }, { threshold });
  }, []);

  // Memory usage monitoring
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576); // MB

      console.log(`🧠 Memory: ${used}MB used, ${total}MB total, ${limit}MB limit`);

      // Alerta si usa más del 80% de memoria disponible
      if (used / limit > 0.8) {
        console.warn(`⚠️ High memory usage: ${used}MB (${Math.round(used/limit*100)}%)`);
      }

      return { used, total, limit };
    }
    return null;
  }, []);

  // Bundle size analyzer
  const analyzeBundleSize = useCallback(() => {
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      const bundles = {};

      resources.forEach(resource => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          const size = resource.transferSize || resource.encodedBodySize || 0;
          totalSize += size;
          
          const name = resource.name.split('/').pop();
          bundles[name] = Math.round(size / 1024); // KB
        }
      });

      console.log('📦 Bundle Analysis:', bundles);
      console.log(`📊 Total bundle size: ${Math.round(totalSize / 1024)}KB`);

      return { bundles, totalSize: Math.round(totalSize / 1024) };
    }
    return null;
  }, []);

  // Generar reporte de performance
  const generateReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...metricsRef.current },
      memory: measureMemoryUsage(),
      bundles: analyzeBundleSize(),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };

    console.log('📈 Performance Report:', report);
    return report;
  }, [measureMemoryUsage, analyzeBundleSize]);

  // Enviar métricas a analytics (simulado)
  const sendMetrics = useCallback((metrics) => {
    // En producción, esto enviaría a Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        'custom_map': {
          'metric_1': 'fcp',
          'metric_2': 'lcp'
        },
        'fcp': metrics.firstContentfulPaint,
        'lcp': metrics.largestContentfulPaint
      });
    }
    
    console.log('📊 Metrics sent to analytics:', metrics);
  }, []);

  // Configurar monitoreo automático
  useEffect(() => {
    // Medir métricas de navegación básicas
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      metricsRef.current.navigationStart = navigation.fetchStart;
      metricsRef.current.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      metricsRef.current.loadComplete = navigation.loadEventEnd - navigation.fetchStart;
    }

    // Iniciar monitoreo de Web Vitals
    measureWebVitals();

    // Monitoreo periódico de memoria (cada 30 segundos)
    const memoryInterval = setInterval(measureMemoryUsage, 30000);

    // Cleanup
    return () => {
      clearInterval(memoryInterval);
    };
  }, [measureWebVitals, measureMemoryUsage]);

  return {
    measureRouteChange,
    measureComponentMount,
    measureApiCall,
    optimizeResource,
    createLazyLoader,
    measureMemoryUsage,
    analyzeBundleSize,
    generateReport,
    sendMetrics,
    getMetrics: () => metricsRef.current
  };
};

export default usePerformanceMonitor;