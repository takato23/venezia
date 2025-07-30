import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const SkeletonLoader = ({ 
  variant = 'text', 
  width = '100%', 
  height = 'auto',
  className,
  count = 1,
  animate = true 
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
  
  const variants = {
    text: 'h-4 mb-2',
    title: 'h-8 mb-4',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-40 w-full',
    card: 'h-32 w-full rounded-lg',
    button: 'h-10 w-24',
    input: 'h-10 w-full',
    chart: 'h-64 w-full',
    table: 'h-12 w-full mb-2',
    metric: 'h-20 w-full rounded-lg'
  };

  const shimmerAnimation = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    }
  };

  const renderSkeleton = () => (
    <motion.div
      className={clsx(
        baseClasses,
        variants[variant],
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
      animate={animate ? shimmerAnimation.animate : {}}
      transition={shimmerAnimation.transition}
    >
      {animate && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 dark:via-gray-600 to-transparent"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </motion.div>
  );

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

// Compound components for complex layouts
export const SkeletonCard = ({ className }) => (
  <div className={clsx('p-4 bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
    <SkeletonLoader variant="avatar" className="mb-4" />
    <SkeletonLoader variant="title" width="60%" />
    <SkeletonLoader variant="text" count={3} />
    <div className="flex gap-2 mt-4">
      <SkeletonLoader variant="button" />
      <SkeletonLoader variant="button" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, className }) => (
  <div className={clsx('bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden', className)}>
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <SkeletonLoader variant="title" width="200px" />
    </div>
    <div className="p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonLoader key={index} variant="table" />
      ))}
    </div>
  </div>
);

export const SkeletonMetric = ({ className }) => (
  <div className={clsx('p-6 bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
    <div className="flex items-center justify-between mb-4">
      <SkeletonLoader variant="avatar" width="40px" height="40px" />
      <SkeletonLoader variant="text" width="60px" />
    </div>
    <SkeletonLoader variant="title" width="120px" />
    <SkeletonLoader variant="text" width="80px" />
  </div>
);

export const SkeletonChart = ({ className }) => (
  <div className={clsx('p-6 bg-white dark:bg-gray-800 rounded-lg shadow', className)}>
    <SkeletonLoader variant="title" width="200px" className="mb-6" />
    <SkeletonLoader variant="chart" />
  </div>
);

export default SkeletonLoader;