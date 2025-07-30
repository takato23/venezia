import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Minimize2, Maximize2, MessageCircle } from 'lucide-react';
import AIAssistant from './AIAssistant';

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Guardar estado en localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('ai-assistant-state');
    if (savedState) {
      const { isOpen: savedIsOpen, isMinimized: savedIsMinimized } = JSON.parse(savedState);
      setIsOpen(savedIsOpen);
      setIsMinimized(savedIsMinimized);
    }
  }, []);

  // Actualizar localStorage cuando cambia el estado
  useEffect(() => {
    localStorage.setItem('ai-assistant-state', JSON.stringify({ isOpen, isMinimized }));
  }, [isOpen, isMinimized]);

  // Escuchar eventos del teclado (Ctrl+Shift+A para abrir/cerrar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Escuchar evento personalizado para abrir el chat
  useEffect(() => {
    const handleChatControl = (event) => {
      if (event.detail.action === 'open') {
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    window.addEventListener('chatControl', handleChatControl);
    return () => window.removeEventListener('chatControl', handleChatControl);
  }, []);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      setUnreadMessages(0);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Variantes de animación
  const buttonVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    tap: { scale: 0.95 }
  };

  const windowVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      x: 100,
      y: 100
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      x: 100,
      y: 100,
      transition: {
        duration: 0.2
      }
    },
    minimized: {
      scale: 0.5,
      opacity: 0.7,
      y: 200,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="floating-button"
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            onClick={toggleOpen}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center group"
            title="Asistente AI (Ctrl+Shift+A)"
          >
            <Brain className="w-6 h-6" />
            
            {/* Badge de mensajes no leídos */}
            {unreadMessages > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
              >
                {unreadMessages}
              </motion.div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap">
                Asistente AI Venezia
                <div className="text-xs text-gray-300">Ctrl+Shift+A</div>
              </div>
            </div>
            
            {/* Animación de pulso */}
            <motion.div
              className="absolute inset-0 bg-blue-400 rounded-full"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: [1, 1.5, 1.5],
                opacity: [0.5, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ventana del AI Assistant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-window"
            variants={windowVariants}
            initial="initial"
            animate={isMinimized ? "minimized" : "animate"}
            exit="exit"
            className={`fixed bottom-6 right-6 z-50 ${
              isMinimized ? 'w-80 h-16' : 'w-[28rem] h-[36rem]'
            } bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            style={{
              maxHeight: 'calc(100vh - 3rem)',
              maxWidth: 'calc(100vw - 3rem)',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Asistente AI Venezia</h3>
                  {!isMinimized && (
                    <p className="text-xs text-blue-100">Tu experto en heladería</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMinimize}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={isMinimized ? "Maximizar" : "Minimizar"}
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Cerrar (Ctrl+Shift+A)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            {!isMinimized && (
              <div className="flex-1 overflow-hidden">
                <AIAssistant />
              </div>
            )}

            {/* Indicador cuando está minimizado */}
            {isMinimized && (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">Click para expandir</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIAssistant;