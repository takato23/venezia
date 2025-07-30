import React from 'react';
import { 
  Download, 
  BarChart3, 
  LineChart, 
  PieChart,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import Button from '../ui/Button';
import clsx from 'clsx';

const ReportCard = ({ 
  title, 
  description, 
  data = [], 
  type = 'bar',
  onExport,
  className 
}) => {
  // Get chart icon based on type
  const getChartIcon = () => {
    switch (type) {
      case 'line':
        return LineChart;
      case 'pie':
        return PieChart;
      case 'bar':
      default:
        return BarChart3;
    }
  };

  // Calculate trend if data is available
  const calculateTrend = () => {
    if (!data || data.length < 2) return null;
    
    const latest = data[data.length - 1]?.value || 0;
    const previous = data[data.length - 2]?.value || 0;
    
    if (previous === 0) return null;
    
    const change = ((latest - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const ChartIcon = getChartIcon();
  const trend = calculateTrend();

  // Mock chart visualization (in real app would use Chart.js)
  const renderMockChart = () => {
    switch (type) {
      case 'line':
        return (
          <div className="h-32 flex items-end space-x-1">
            {data.slice(0, 12).map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-gradient-to-t from-venezia-200 to-venezia-400 rounded-t"
                style={{ 
                  height: `${Math.max(10, (item.value / Math.max(...data.map(d => d.value))) * 100)}%` 
                }}
              />
            ))}
          </div>
        );
      
      case 'pie':
        return (
          <div className="h-32 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-8 border-venezia-200 border-t-venezia-500 border-r-venezia-400" />
          </div>
        );
      
      case 'bar':
      default:
        return (
          <div className="h-32 flex items-end space-x-2">
            {data.slice(0, 8).map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-gradient-to-t from-venezia-300 to-venezia-500 rounded-t"
                style={{ 
                  height: `${Math.max(10, (item.value / Math.max(...data.map(d => d.value))) * 100)}%` 
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-venezia-100 dark:bg-venezia-900/20 rounded-lg">
            <ChartIcon className="w-5 h-5 text-venezia-600 dark:text-venezia-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
        
        <Button
          onClick={onExport}
          variant="ghost"
          size="sm"
          icon={Download}
          className="text-gray-400 hover:text-gray-600"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {data && data.length > 0 ? (
          <>
            {/* Chart Area */}
            <div className="mb-4">
              {renderMockChart()}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {data.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  {trend.direction === 'up' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +{trend.value}% vs período anterior
                      </span>
                    </>
                  )}
                  {trend.direction === 'down' && (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        -{trend.value}% vs período anterior
                      </span>
                    </>
                  )}
                  {trend.direction === 'neutral' && (
                    <>
                      <Minus className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        Sin cambios vs período anterior
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <ChartIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay datos disponibles para mostrar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;