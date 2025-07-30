import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, X, Maximize2, Minimize2, Trash2, Wifi, WifiOff } from 'lucide-react';

const ChatHeader = memo(({ 
  title = "VenezIA",
  subtitle,
  connectionStatus,
  onClose,
  onMinimize,
  onExpand,
  onClear,
  isExpanded = false,
  stats,
  aiSource = null
}) => {
  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
      <div className="flex items-center space-x-3">
        {/* Logo con indicador de conexión */}
        <div className="relative">
          <Brain className="text-white" size={isExpanded ? 28 : 18} />
          {connectionStatus === 'connected' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1"
            >
              <Wifi className="text-green-400" size={isExpanded ? 12 : 10} />
            </motion.div>
          )}
          {connectionStatus === 'disconnected' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1"
            >
              <WifiOff className="text-red-400" size={isExpanded ? 12 : 10} />
            </motion.div>
          )}
        </div>
        
        {/* Título y subtítulo */}
        <div className="flex items-center">
          <div>
            <h3 className={`${isExpanded ? 'text-lg' : 'text-sm'} font-semibold text-white`}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-white/70">{subtitle}</p>
            )}
          </div>
          {/* Indicador de sistema AI activo */}
          {aiSource && (
            <span className={`
              ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium
              ${aiSource === 'gemini' ? 'bg-blue-500/30 text-blue-100 border border-blue-400/50' : 
                aiSource === 'mock' ? 'bg-yellow-500/30 text-yellow-100 border border-yellow-400/50' : 
                'bg-gray-500/30 text-gray-100 border border-gray-400/50'}
            `}>
              {aiSource === 'gemini' ? '✨ Gemini 1.5' : 
               aiSource === 'mock' ? '🤖 Local AI' : 
               '📦 Básico'}
            </span>
          )}
        </div>
      </div>

      {/* Acciones y estadísticas */}
      <div className="flex items-center space-x-1">
        {/* Estadísticas (solo en modo expandido) */}
        {isExpanded && stats && (
          <div className="text-right text-white/70 text-sm mr-4">
            <div>{stats.userMessages} mensajes enviados</div>
            <div>{stats.aiMessages} respuestas recibidas</div>
          </div>
        )}
        
        {/* Botones de acción */}
        {onClear && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClear}
            className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            title="Limpiar chat (Ctrl+L)"
          >
            <Trash2 size={isExpanded ? 18 : 16} />
          </motion.button>
        )}
        
        {isExpanded && onMinimize ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMinimize}
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            title="Minimizar (Ctrl+Shift+M)"
          >
            <Minimize2 size={16} />
          </motion.button>
        ) : onExpand && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onExpand}
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            title="Expandir (Ctrl+Shift+E)"
          >
            <Maximize2 size={16} />
          </motion.button>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
          title="Cerrar (Esc)"
        >
          <X size={16} />
        </motion.button>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;