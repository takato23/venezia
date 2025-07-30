import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff } from 'lucide-react';

const ExpandedChatInput = memo(({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  onVoiceCommand,
  isLoading, 
  isListening, 
  voiceSupported,
  inputRef
}) => {
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage);
    }
  }, [inputMessage, isLoading, onSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e) => {
    setInputMessage(e.target.value);
  }, [setInputMessage]);

  return (
    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje o pregunta..."
          className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
          disabled={isLoading}
        />
        
        {voiceSupported && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onVoiceCommand}
            className={`px-4 py-4 ${isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            } text-white rounded-2xl transition-all font-medium`}
            title="Comando de voz"
            disabled={isLoading}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </motion.button>
        )}
        
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!inputMessage.trim() || isLoading}
          className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          <Send size={20} />
        </motion.button>
      </form>
    </div>
  );
});

ExpandedChatInput.displayName = 'ExpandedChatInput';

export default ExpandedChatInput;