import React, { Suspense } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Enhanced loadable function with retry and error boundaries
export const createLoadable = (importFunc, options = {}) => {
  const {
    fallback = <LoadingSpinner size="lg" />,
    retryDelay = 1000,
    maxRetries = 3,
    onError = null
  } = options;

  let retryCount = 0;
  
  const load = async () => {
    try {
      const module = await importFunc();
      retryCount = 0; // Reset on successful load
      return module;
    } catch (error) {
      console.error('Failed to load module:', error);
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying module load (${retryCount}/${maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        return load(); // Recursive retry
      }
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  };

  const LazyComponent = React.lazy(load);

  return React.forwardRef((props, ref) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Preload function for route prefetching
export const preloadRoute = (importFunc) => {
  const load = async () => {
    try {
      await importFunc();
      console.log('Route preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload route:', error);
    }
  };

  return load;
};

// Bundle analyzer - track which modules are loaded
class BundleAnalyzer {
  constructor() {
    this.loadedModules = new Set();
    this.loadTimes = new Map();
    this.errors = new Map();
  }

  trackLoad(moduleName, loadTime) {
    this.loadedModules.add(moduleName);
    this.loadTimes.set(moduleName, loadTime);
    
    console.log(`📦 Module "${moduleName}" loaded in ${loadTime}ms`);
  }

  trackError(moduleName, error) {
    this.errors.set(moduleName, error);
    console.error(`❌ Module "${moduleName}" failed to load:`, error);
  }

  getReport() {
    return {
      loadedModules: Array.from(this.loadedModules),
      loadTimes: Object.fromEntries(this.loadTimes),
      errors: Object.fromEntries(this.errors),
      averageLoadTime: Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / this.loadTimes.size || 0
    };
  }

  reset() {
    this.loadedModules.clear();
    this.loadTimes.clear();
    this.errors.clear();
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// Enhanced loadable with analytics
export const loadableWithAnalytics = (importFunc, moduleName, options = {}) => {
  const enhancedImportFunc = async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFunc();
      const loadTime = performance.now() - startTime;
      
      bundleAnalyzer.trackLoad(moduleName, loadTime);
      
      return module;
    } catch (error) {
      bundleAnalyzer.trackError(moduleName, error);
      throw error;
    }
  };

  return createLoadable(enhancedImportFunc, options);
};

// Route-based code splitting with prefetching
export class RouteManager {
  constructor() {
    this.routes = new Map();
    this.preloadedRoutes = new Set();
  }

  registerRoute(path, importFunc, options = {}) {
    this.routes.set(path, {
      importFunc,
      component: null,
      preloaded: false,
      ...options
    });
  }

  async preloadRoute(path) {
    const route = this.routes.get(path);
    if (!route || this.preloadedRoutes.has(path)) {
      return;
    }

    try {
      console.log(`🔄 Preloading route: ${path}`);
      await route.importFunc();
      this.preloadedRoutes.add(path);
      console.log(`✅ Route preloaded: ${path}`);
    } catch (error) {
      console.warn(`❌ Failed to preload route ${path}:`, error);
    }
  }

  getLoadableComponent(path) {
    const route = this.routes.get(path);
    if (!route) {
      throw new Error(`Route not registered: ${path}`);
    }

    if (!route.component) {
      route.component = loadableWithAnalytics(
        route.importFunc,
        `route-${path}`,
        route.options
      );
    }

    return route.component;
  }

  // Intelligent prefetching based on user behavior
  setupIntelligentPrefetch() {
    let mouseOverTimer;
    
    // Prefetch on hover (with delay to avoid unnecessary loads)
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;

      clearTimeout(mouseOverTimer);
      mouseOverTimer = setTimeout(() => {
        this.preloadRoute(href);
      }, 300); // 300ms delay
    });

    // Prefetch on viewport entry (for route cards, etc.)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const route = element.dataset.route;
          if (route) {
            this.preloadRoute(route);
          }
        }
      });
    }, { rootMargin: '200px' });

    // Observe elements with data-route attribute
    document.querySelectorAll('[data-route]').forEach(el => {
      observer.observe(el);
    });
  }
}

export const routeManager = new RouteManager();

// Utility to create optimized lazy components
export const lazy = (importFunc, options = {}) => {
  return createLoadable(importFunc, {
    fallback: <LoadingSpinner size="lg" />,
    maxRetries: 2,
    retryDelay: 1000,
    ...options
  });
};

// Progressive enhancement for critical components
export const progressive = (criticalComponent, enhancedImportFunc) => {
  const [Enhanced, setEnhanced] = React.useState(null);

  React.useEffect(() => {
    // Load enhanced version after initial render
    const loadEnhanced = async () => {
      try {
        const module = await enhancedImportFunc();
        setEnhanced(() => module.default || module);
      } catch (error) {
        console.warn('Failed to load enhanced component:', error);
      }
    };

    // Delay to ensure critical path is loaded first
    setTimeout(loadEnhanced, 100);
  }, [enhancedImportFunc]);

  return Enhanced || criticalComponent;
};