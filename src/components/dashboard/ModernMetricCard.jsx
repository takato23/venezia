import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

const ModernMetricCard = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  changeType, 
  isLoading,
  flavor = 'vanilla', // Changed from gradient to ice cream flavor
  delay = 0 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Ice Cream Flavor Gradients
  const flavorGradients = {
    vanilla: 'from-venezia-400 to-venezia-600',
    strawberry: 'from-accent-400 to-accent-600', 
    chocolate: 'from-chocolate-500 to-chocolate-700',
    mint: 'from-sage-400 to-sage-600',
    pistachio: 'from-pistachio-400 to-pistachio-600',
    caramel: 'from-venezia-500 to-venezia-700',
  };

  // Ice Cream Background Themes
  const flavorBackgrounds = {
    vanilla: 'from-venezia-50/80 to-venezia-100/80 dark:from-venezia-900/20 dark:to-venezia-800/20',
    strawberry: 'from-accent-50/80 to-accent-100/80 dark:from-accent-900/20 dark:to-accent-800/20',
    chocolate: 'from-chocolate-50/80 to-chocolate-100/80 dark:from-chocolate-900/20 dark:to-chocolate-800/20',
    mint: 'from-sage-50/80 to-sage-100/80 dark:from-sage-900/20 dark:to-sage-800/20',
    pistachio: 'from-pistachio-50/80 to-pistachio-100/80 dark:from-pistachio-900/20 dark:to-pistachio-800/20',
    caramel: 'from-venezia-50/80 to-venezia-200/80 dark:from-venezia-900/20 dark:to-venezia-700/20',
  };

  // Animación de contador para los valores
  useEffect(() => {
    if (!isLoading && value) {
      const numericValue = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
      const duration = 1000;
      const steps = 60;
      const increment = numericValue / steps;
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        setDisplayValue(Math.min(increment * currentStep, numericValue));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayValue(numericValue);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [value, isLoading]);

  const formatValue = (val) => {
    if (value && value.toString().includes('$')) {
      return `$${Math.round(val).toLocaleString()}`;
    }
    return Math.round(val).toLocaleString();
  };

  const TrendIcon = changeType === 'positive' ? TrendingUp : 
                    changeType === 'negative' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative group animate-freeze-in"
    >
      {/* Ice Cream Glow Effect */}
      <div className={clsx(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        'bg-gradient-to-r', flavorGradients[flavor],
        'blur-xl animate-flavor-pulse'
      )} />
      
      {/* Gelato Card with Enhanced Styling */}
      <div className="metric-gelato gelato-card p-6 shadow-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Ice Cream Background Gradient */}
        <div className={clsx(
          'absolute inset-0 bg-gradient-to-br opacity-40',
          flavorBackgrounds[flavor]
        )} />
        
        {/* Patrón decorativo */}
        <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-tl from-white/10 to-transparent" />
        
        {/* Contenido */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {/* Ice Cream Scoop Icon */}
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="metric-scoop relative animate-scoop-bounce"
            >
              <Icon className="h-6 w-6 text-white relative z-10" />
              {/* Ice cream melt effect */}
              <motion.div
                className={clsx(
                  'absolute inset-0 rounded-full',
                  'bg-gradient-to-br', flavorGradients[flavor]
                )}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </motion.div>
            
            {/* Ice Cream Flavor Tag */}
            {change !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.3 }}
                className={clsx(
                  'flavor-tag flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md',
                  'backdrop-blur-sm border',
                  changeType === 'positive' && 'sage border-sage-300 bg-sage-100/90 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300 dark:border-sage-600',
                  changeType === 'negative' && 'accent border-accent-300 bg-accent-100/90 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 dark:border-accent-600',
                  changeType === 'neutral' && 'flavor-vanilla border-venezia-300 bg-venezia-100/90 text-venezia-700 dark:bg-venezia-900/40 dark:text-venezia-300 dark:border-venezia-600'
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(change)}%</span>
              </motion.div>
            )}
          </div>
          
          {/* Valor */}
          <div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-24 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-gray-200/50 dark:bg-gray-700/50 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: delay + 0.2 }}
                  className="text-3xl font-bold text-venezia-800 dark:text-venezia-100 mb-1 font-display animate-melt-gentle"
                >
                  {formatValue(displayValue)}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.4 }}
                  className="text-sm text-venezia-600 dark:text-venezia-400 font-semibold tracking-wide"
                >
                  {title}
                </motion.p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernMetricCard;