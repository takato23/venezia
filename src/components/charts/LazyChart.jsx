import React, { Suspense, lazy, useEffect, useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { initializeChart } from '../../utils/chartSetup';

// Lazy load de Chart components
const Line = lazy(() => 
  initializeChart().then(() => import('react-chartjs-2').then(module => ({ default: module.Line })))
);

const Bar = lazy(() => 
  initializeChart().then(() => import('react-chartjs-2').then(module => ({ default: module.Bar })))
);

const Doughnut = lazy(() => 
  initializeChart().then(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })))
);

const Pie = lazy(() => 
  initializeChart().then(() => import('react-chartjs-2').then(module => ({ default: module.Pie })))
);

// Componente wrapper optimizado
const LazyChart = React.memo(({ type, data, options, ...props }) => {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    // Pre-inicializar Chart.js cuando el componente se monta
    initializeChart().then(() => {
      setChartReady(true);
    });
  }, []);

  if (!chartReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  const getChartComponent = () => {
    switch (type) {
      case 'line':
        return Line;
      case 'bar':
        return Bar;
      case 'doughnut':
        return Doughnut;
      case 'pie':
        return Pie;
      default:
        return Line;
    }
  };

  const ChartComponent = getChartComponent();

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="sm" />
        </div>
      }
    >
      <ChartComponent data={data} options={options} {...props} />
    </Suspense>
  );
});

LazyChart.displayName = 'LazyChart';

export default LazyChart;