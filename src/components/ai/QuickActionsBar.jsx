import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const QuickActionsBar = memo(({ 
  actions, 
  onActionClick, 
  compact = false,
  className = "" 
}) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className={`${className} ${compact ? 'px-2 py-1' : 'px-6 py-3'} ${compact ? '' : 'border-b border-gray-200 dark:border-gray-700'} ${!compact && 'bg-gray-50 dark:bg-gray-900/50'}`}>
      {compact ? (
        // Diseño compacto 2x2 para chat minimizado
        <div className="relative">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Acciones rápidas:</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí podrías agregar lógica para colapsar/expandir
              }}
            >
              <ChevronDown size={12} />
            </motion.button>
          </div>
          <div className="grid grid-cols-2 gap-0.5">
            {actions.slice(0, 4).map((action) => (
              <motion.button
                key={action.id || action.text}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick(action);
                }}
                className="
                  px-1.5 py-1
                  text-[11px]
                  bg-gray-50 dark:bg-gray-800
                  hover:bg-blue-50 dark:hover:bg-gray-700
                  border border-gray-200 dark:border-gray-600
                  rounded
                  transition-all duration-200
                  flex items-center justify-center gap-1
                  text-gray-700 dark:text-gray-300
                "
                disabled={action.disabled}
                title={action.text}
              >
                <span className="opacity-70">{action.icon}</span>
                <span className="truncate max-w-[60px]">
                  {action.text.replace(/^[\p{Emoji}]\s*/u, '').substring(0, 10)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        // Diseño normal para chat expandido
        <div className="flex space-x-2 overflow-x-auto">
          {actions.map((action) => (
            <motion.button
              key={action.id || action.text}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onActionClick(action);
              }}
              className="
                flex-shrink-0 px-3 py-1.5 text-sm 
                bg-white dark:bg-gray-700 
                hover:bg-gray-100 dark:hover:bg-gray-600 
                rounded-lg transition-colors 
                flex items-center space-x-2 
                border border-gray-200 dark:border-gray-600
              "
              disabled={action.disabled}
            >
              {action.icon && <span className="text-base">{action.icon}</span>}
              <span>{action.text}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
});

QuickActionsBar.displayName = 'QuickActionsBar';

export default QuickActionsBar;