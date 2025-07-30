import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import clsx from 'clsx';

const CashIndicator = ({ 
  cashAvailable = 0,
  lowCashThreshold = 500,
  criticalCashThreshold = 100,
  className = ''
}) => {
  const [status, setStatus] = useState('normal');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let newStatus = 'normal';
    
    if (cashAvailable <= criticalCashThreshold) {
      newStatus = 'critical';
    } else if (cashAvailable <= lowCashThreshold) {
      newStatus = 'warning';
    }
    
    if (newStatus !== status) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
    
    setStatus(newStatus);
  }, [cashAvailable, lowCashThreshold, criticalCashThreshold, status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'critical':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: AlertTriangle,
          label: 'Efectivo Crítico',
          message: '¡Necesitas más billetes chicos!',
          pulse: true
        };
      case 'warning':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: TrendingDown,
          label: 'Efectivo Bajo',
          message: 'Considera reponer billetes',
          pulse: false
        };
      default:
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
          label: 'Efectivo OK',
          message: 'Suficiente para dar cambio',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg border-2',
        config.bg,
        config.border,
        'transition-all duration-300',
        className
      )}
      animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* Icono con pulso si es crítico */}
      <div className="relative">
        <Icon className={clsx('h-5 w-5', config.color)} />
        {config.pulse && (
          <motion.div
            className="absolute inset-0"
            animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.7, 0, 0.7] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity 
            }}
          >
            <Icon className={clsx('h-5 w-5', config.color)} />
          </motion.div>
        )}
      </div>

      {/* Información */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className={clsx('text-sm font-medium', config.color)}>
            {config.label}
          </span>
          <span className={clsx('text-lg font-bold', config.color)}>
            ${cashAvailable.toFixed(0)}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {config.message}
        </div>
      </div>

      {/* Indicador de nivel */}
      <div className="w-16">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min((cashAvailable / (lowCashThreshold * 2)) * 100, 100)}%`
            }}
            transition={{ duration: 0.5 }}
            className={clsx(
              'h-full rounded-full transition-colors duration-300',
              status === 'critical' && 'bg-red-500',
              status === 'warning' && 'bg-yellow-500',
              status === 'normal' && 'bg-green-500'
            )}
          />
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          Cambio
        </div>
      </div>
    </motion.div>
  );
};

export default CashIndicator;