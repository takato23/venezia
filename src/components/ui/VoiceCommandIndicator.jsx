import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const VoiceCommandIndicator = () => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Escuchar eventos de comandos de voz
  useEffect(() => {
    const handleVoiceStart = () => {
      setIsListening(true);
    };

    const handleVoiceEnd = () => {
      setIsListening(false);
    };

    const handleVoiceCommand = (event) => {
      const { originalText, confidence } = event.detail;
      setLastCommand(`"${originalText}" (${Math.round(confidence * 100)}%)`);
      setShowFeedback(true);
      
      // Ocultar feedback después de 3 segundos
      setTimeout(() => setShowFeedback(false), 3000);
    };

    // Escuchar eventos del hook de voz
    window.addEventListener('voiceStart', handleVoiceStart);
    window.addEventListener('voiceEnd', handleVoiceEnd);
    window.addEventListener('voiceCommand', handleVoiceCommand);

    return () => {
      window.removeEventListener('voiceStart', handleVoiceStart);
      window.removeEventListener('voiceEnd', handleVoiceEnd);
      window.removeEventListener('voiceCommand', handleVoiceCommand);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isListening || showFeedback) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={`px-6 py-3 rounded-2xl shadow-lg border ${
            isListening 
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' 
              : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
          }`}>
            <div className="flex items-center space-x-3">
              {isListening ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic size={20} className="text-red-600 dark:text-red-400" />
                  </motion.div>
                  <div>
                    <p className="font-medium">🎤 Escuchando...</p>
                    <p className="text-sm opacity-75">Di tu comando en español</p>
                  </div>
                </>
              ) : showFeedback ? (
                <>
                  <Volume2 size={20} className="text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">🎯 Comando reconocido</p>
                    <p className="text-sm opacity-75">{lastCommand}</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceCommandIndicator;