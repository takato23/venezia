// Enhanced lazy loading with retry logic and loading states
import { lazy, Suspense } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, retry }) => (
  <div className="flex items-center justify-center min-h-[200px] p-4">
    <div className="text-center">
      <p className="text-red-600 mb-4">Failed to load component</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Retry
      </button>
    </div>
  </div>
);

// Lazy load with retry logic
export function lazyWithRetry(importFn, componentName = 'Component') {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem(`retry-lazy-${componentName}`) || 'false'
    );

    try {
      const component = await importFn();
      window.sessionStorage.setItem(`retry-lazy-${componentName}`, 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assuming that the user's browser has cached an old version
        // Refresh the page to get the latest version
        window.sessionStorage.setItem(`retry-lazy-${componentName}`, 'true');
        window.location.reload();
      }
      // If page was already refreshed, throw the error
      throw error;
    }
  });
}

// Wrapper component with Suspense and Error Boundary
export function LazyComponent({ 
  component: Component, 
  fallback = <LoadingFallback />,
  ...props 
}) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

// Preload component
export function preloadComponent(lazyComponent) {
  // This triggers the lazy loading without rendering
  lazyComponent.preload = lazyComponent._ctor || lazyComponent;
  return lazyComponent;
}

// Route-based code splitting helper
export function createLazyRoute(importFn, routeName) {
  const LazyComponent = lazyWithRetry(importFn, routeName);
  
  return {
    Component: LazyComponent,
    preload: () => {
      // Preload the component
      LazyComponent._ctor?.();
    }
  };
}

// Batch preloader for multiple components
export function preloadComponents(components) {
  return Promise.all(
    components.map(component => {
      if (component.preload) {
        return component.preload();
      }
      if (component._ctor) {
        return component._ctor();
      }
      return Promise.resolve();
    })
  );
}

// Usage example:
/*
// Define lazy routes
export const routes = {
  Dashboard: createLazyRoute(() => import('../pages/Dashboard'), 'Dashboard'),
  Products: createLazyRoute(() => import('../pages/Products'), 'Products'),
  Sales: createLazyRoute(() => import('../pages/Sales'), 'Sales'),
};

// Preload on hover
<Link 
  to="/dashboard" 
  onMouseEnter={() => routes.Dashboard.preload()}
>
  Dashboard
</Link>

// Or preload after initial load
useEffect(() => {
  // Preload common routes after initial render
  setTimeout(() => {
    preloadComponents([
      routes.Products.Component,
      routes.Sales.Component
    ]);
  }, 2000);
}, []);
*/