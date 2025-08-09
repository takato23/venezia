// Monitor de performance para WebShop

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      apiCalls: {},
      interactions: {},
      resources: {}
    };
    
    this.observers = {
      fps: null,
      memory: null,
      longTasks: null
    };
    
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    
    // Métricas de carga de página
    this.measurePageLoad();
    
    // Observer para tareas largas
    this.observeLongTasks();
    
    // Monitor de FPS
    this.monitorFPS();
    
    // Web Vitals
    this.measureWebVitals();
  }

  /**
   * Medir tiempo de carga de página
   */
  measurePageLoad() {
    if (!window.performance || !window.performance.timing) return;
    
    window.addEventListener('load', () => {
      const timing = window.performance.timing;
      
      this.metrics.pageLoad = {
        // Tiempo total de carga
        loadTime: timing.loadEventEnd - timing.navigationStart,
        // Tiempo hasta primer byte
        ttfb: timing.responseStart - timing.navigationStart,
        // Tiempo de procesamiento DOM
        domProcessing: timing.domComplete - timing.domLoading,
        // Tiempo de recursos
        resourcesTime: timing.loadEventStart - timing.domContentLoadedEventEnd
      };
      
      this.logMetrics('Page Load', this.metrics.pageLoad);
    });
  }

  /**
   * Medir Web Vitals
   */
  measureWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          this.checkPerformanceThresholds();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.debug('LCP observer not supported');
      }
    }
    
    // First Input Delay (FID)
    if ('PerformanceEventTiming' in window) {
      window.addEventListener('click', (event) => {
        const eventTiming = performance.getEntriesByType('event').pop();
        if (eventTiming) {
          this.metrics.fid = eventTiming.processingStart - eventTiming.startTime;
        }
      }, { once: true });
    }
    
    // Cumulative Layout Shift (CLS)
    if ('LayoutShift' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cls = clsValue;
      });
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.debug('CLS observer not supported');
      }
    }
  }

  /**
   * Observar tareas largas (>50ms)
   */
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      this.observers.longTasks = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
          
          // Notificar si la tarea es muy larga
          if (entry.duration > 100) {
            this.notifyPerformanceIssue('long-task', {
              duration: entry.duration
            });
          }
        }
      });
      
      this.observers.longTasks.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.debug('Long task observer not supported');
    }
  }

  /**
   * Monitor de FPS
   */
  monitorFPS() {
    let lastTime = performance.now();
    let frames = 0;
    let fps = 60;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.metrics.fps = fps;
        
        // Alertar si FPS bajo
        if (fps < 30) {
          this.notifyPerformanceIssue('low-fps', { fps });
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Medir llamadas API
   */
  measureAPICall(url, startTime) {
    const duration = performance.now() - startTime;
    
    if (!this.metrics.apiCalls[url]) {
      this.metrics.apiCalls[url] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0
      };
    }
    
    const metric = this.metrics.apiCalls[url];
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.maxTime = Math.max(metric.maxTime, duration);
    
    // Alertar si la API es lenta
    if (duration > 3000) {
      this.notifyPerformanceIssue('slow-api', { url, duration });
    }
    
    return duration;
  }

  /**
   * Medir interacciones de usuario
   */
  measureInteraction(action, startTime) {
    const duration = performance.now() - startTime;
    
    if (!this.metrics.interactions[action]) {
      this.metrics.interactions[action] = {
        count: 0,
        totalTime: 0,
        avgTime: 0
      };
    }
    
    const metric = this.metrics.interactions[action];
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    
    return duration;
  }

  /**
   * Verificar umbrales de performance
   */
  checkPerformanceThresholds() {
    const thresholds = {
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1   // 0.1
    };
    
    if (this.metrics.lcp > thresholds.lcp) {
      this.notifyPerformanceIssue('poor-lcp', { 
        value: this.metrics.lcp,
        threshold: thresholds.lcp 
      });
    }
    
    if (this.metrics.fid > thresholds.fid) {
      this.notifyPerformanceIssue('poor-fid', { 
        value: this.metrics.fid,
        threshold: thresholds.fid 
      });
    }
    
    if (this.metrics.cls > thresholds.cls) {
      this.notifyPerformanceIssue('poor-cls', { 
        value: this.metrics.cls,
        threshold: thresholds.cls 
      });
    }
  }

  /**
   * Notificar problema de performance
   */
  notifyPerformanceIssue(type, data) {
    console.warn(`Performance issue: ${type}`, data);
    
    // Enviar a analytics o monitoring service
    if (window.gtag) {
      window.gtag('event', 'performance_issue', {
        event_category: 'Performance',
        event_label: type,
        value: JSON.stringify(data)
      });
    }
  }

  /**
   * Log de métricas
   */
  logMetrics(category, metrics) {
    console.group(`🚀 Performance: ${category}`);
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`${key}: ${typeof value === 'number' ? value.toFixed(2) + 'ms' : value}`);
    });
    console.groupEnd();
  }

  /**
   * Obtener reporte de performance
   */
  getReport() {
    return {
      ...this.metrics,
      memory: this.getMemoryUsage(),
      connection: this.getConnectionInfo()
    };
  }

  /**
   * Obtener uso de memoria
   */
  getMemoryUsage() {
    if (!performance.memory) return null;
    
    return {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    };
  }

  /**
   * Obtener información de conexión
   */
  getConnectionInfo() {
    if (!navigator.connection) return null;
    
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  /**
   * Limpiar observers
   */
  destroy() {
    Object.values(this.observers).forEach(observer => {
      if (observer) observer.disconnect();
    });
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Helper functions para uso fácil
export const measureAPICall = (url, startTime) => 
  performanceMonitor.measureAPICall(url, startTime);

export const measureInteraction = (action, startTime) => 
  performanceMonitor.measureInteraction(action, startTime);

export const getPerformanceReport = () => 
  performanceMonitor.getReport();

export default performanceMonitor;