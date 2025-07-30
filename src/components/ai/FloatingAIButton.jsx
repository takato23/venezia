import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import AIChat from './AIChat';

const FloatingAIButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Botón Flotante AI Assistant Global */}
      {!isChatOpen && (
        <motion.div
          className="fixed bottom-8 right-8 z-40"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <motion.button
            onClick={() => setIsChatOpen(true)}
            whileHover={{ scale: 1.1, rotate: 8 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
            title="🧠 Asistente AI Venezia - Chat Inteligente"
          >
            {/* Fondo con gradiente animado y blur */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-full blur-sm opacity-75 group-hover:opacity-100 group-hover:blur-md transition-all duration-500 animate-pulse"></div>
            
            {/* Círculo exterior rotativo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 rounded-full border-2 border-gradient-to-r from-purple-400 to-blue-400 opacity-50"
            ></motion.div>
            
            {/* Botón principal */}
            <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-5 rounded-full shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-300">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(360deg)"]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
              >
                <Brain size={32} className="text-white drop-shadow-lg" />
              </motion.div>
            </div>
            
            {/* Badge AI con animación */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
              className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-white"
            >
              AI
            </motion.div>
            
            {/* Efectos de partículas mejorados */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "linear"
              }}
              className="absolute -top-3 -left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Sparkles className="text-yellow-300" size={18} />
            </motion.div>
            
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.4, 1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "linear",
                delay: 1
              }}
              className="absolute -bottom-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Sparkles className="text-blue-300" size={16} />
            </motion.div>
            
            {/* Tooltip mejorado */}
            <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform group-hover:translate-y-1">
              <div className="bg-gray-900 text-white rounded-xl p-4 shadow-2xl min-w-max max-w-xs">
                <div className="flex items-center space-x-3 mb-3">
                  <Brain size={20} className="text-purple-400" />
                  <span className="font-bold text-lg">AI Assistant Pro</span>
                </div>
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">🤖 Automatización</span>
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      Completa formularios automáticamente
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">💬 Chat</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">📈 Predicciones</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-xs">📊 Análisis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs">📦 Inventario</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-center text-gray-400 bg-gray-800 rounded-lg py-2">
                  <div className="font-medium text-white mb-1">¡Nuevo! Capacidades avanzadas</div>
                  <div>"Crea sabor vainilla $450" - Llena formularios automáticamente</div>
                </div>
                {/* Flecha del tooltip */}
                <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Modal de Chat AI */}
      <AnimatePresence>
        {isChatOpen && (
          <AIChat 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIButton;