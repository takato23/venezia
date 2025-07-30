import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const ReportChart = ({ 
  data = [], 
  type = 'bar',
  title,
  height = 300,
  options = {},
  className 
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Chart type configurations
  const chartConfigs = {
    bar: {
      type: 'bar',
      icon: BarChart3,
      defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    },
    line: {
      type: 'line',
      icon: LineChart,
      defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6,
          },
          line: {
            borderWidth: 2,
            tension: 0.1,
          },
        },
      },
    },
    pie: {
      type: 'pie',
      icon: PieChart,
      defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
        },
      },
    },
    doughnut: {
      type: 'doughnut',
      icon: PieChart,
      defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
        },
        cutout: '60%',
      },
    },
  };

  // Generate chart colors
  const generateColors = (count) => {
    const colors = [
      'rgba(59, 130, 246, 0.8)', // Blue
      'rgba(16, 185, 129, 0.8)', // Green
      'rgba(245, 158, 11, 0.8)', // Yellow
      'rgba(239, 68, 68, 0.8)',  // Red
      'rgba(139, 92, 246, 0.8)', // Purple
      'rgba(236, 72, 153, 0.8)', // Pink
      'rgba(14, 165, 233, 0.8)', // Sky
      'rgba(34, 197, 94, 0.8)',  // Emerald
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  // Process data for Chart.js
  const processData = () => {
    if (!data || data.length === 0) return null;

    const config = chartConfigs[type] || chartConfigs.bar;
    
    if (type === 'pie' || type === 'doughnut') {
      return {
        labels: data.map(item => item.label || item.name),
        datasets: [{
          data: data.map(item => item.value),
          backgroundColor: generateColors(data.length),
          borderWidth: 1,
          borderColor: '#ffffff',
        }],
      };
    }

    // For bar and line charts
    return {
      labels: data.map(item => item.label || item.name),
      datasets: [{
        label: title || 'Datos',
        data: data.map(item => item.value),
        backgroundColor: generateColors(data.length),
        borderColor: generateColors(data.length).map(color => 
          color.replace('0.8', '1')
        ),
        borderWidth: type === 'line' ? 2 : 1,
        fill: type === 'line' ? false : true,
      }],
    };
  };

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const config = chartConfigs[type] || chartConfigs.bar;
    const chartData = processData();
    
    if (!chartData) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new ChartJS(chartRef.current, {
      type: config.type,
      data: chartData,
      options: {
        ...config.defaultOptions,
        ...options,
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, options, title]);

  const config = chartConfigs[type] || chartConfigs.bar;
  const Icon = config.icon;

  if (!data || data.length === 0) {
    return (
      <div className={clsx(
        'flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg',
        className
      )} style={{ height }}>
        <div className="text-center">
          <Icon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos para mostrar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </h3>
        </div>
      )}
      
      <div style={{ height }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default ReportChart;