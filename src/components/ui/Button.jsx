import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  tooltip,
  className,
  flavor, // New ice cream flavor prop
  ...props
}, ref) => {
  const baseClasses = 'scoop-button relative overflow-hidden font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform hover:scale-105 active:scale-95';
  
  const variants = {
    primary: `scoop-button ${flavor ? `scoop-${flavor}` : ''} text-white shadow-lg hover:shadow-xl focus:ring-primary-400/50`,
    secondary: 'bg-venezia-100 dark:bg-gray-700 text-venezia-800 dark:text-gray-100 hover:bg-venezia-200 dark:hover:bg-gray-600 focus:ring-venezia-400 shadow-md hover:shadow-lg',
    success: 'scoop-mint text-white shadow-lg hover:shadow-xl focus:ring-mint-400/50',
    danger: 'scoop-strawberry text-white shadow-lg hover:shadow-xl focus:ring-primary-400/50',
    outline: 'border-2 border-venezia-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-venezia-700 dark:text-gray-200 hover:bg-venezia-50 dark:hover:bg-gray-700 focus:ring-venezia-400 backdrop-blur-sm',
    ghost: 'text-venezia-700 dark:text-gray-200 hover:bg-venezia-100/60 dark:hover:bg-gray-700/60 focus:ring-venezia-400 backdrop-blur-sm'
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-xl',
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-2.5 text-sm rounded-2xl',
    lg: 'px-8 py-3 text-base rounded-2xl'
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      whileHover={!isDisabled ? { y: -2 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      animate={loading ? { 
        boxShadow: ['0 4px 15px rgba(236, 72, 153, 0.3)', '0 8px 25px rgba(236, 72, 153, 0.5)', '0 4px 15px rgba(236, 72, 153, 0.3)']
      } : {}}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        isDisabled && 'cursor-not-allowed opacity-60 hover:scale-100',
        loading && 'animate-flavor-pulse',
        className
      )}
      disabled={isDisabled}
      title={tooltip}
      {...props}
    >
      {loading && (
        <div className="swirl-loader mr-2 w-4 h-4 border-2 border-white/20 border-l-white" />
      )}
      
      {Icon && !loading && (
        <Icon className="h-4 w-4 mr-2" />
      )}
      
      <span className={loading ? 'animate-melt-gentle' : ''}>{children}</span>
      
      {/* Ice cream scoop ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-300" />
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button; 