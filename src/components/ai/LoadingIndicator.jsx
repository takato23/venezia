import React, { memo } from 'react';
import { motion } from 'framer-motion';

const LoadingIndicator = memo(({ size = 'normal' }) => {
  const dotSize = size === 'small' ? 'w-2 h-2' : 'w-3 h-3';
  const spacing = size === 'small' ? 'space-x-1' : 'space-x-2';
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
        <div className={`flex ${spacing}`}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={`${dotSize} bg-gray-400 rounded-full`}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.1,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

LoadingIndicator.displayName = 'LoadingIndicator';

export default LoadingIndicator;