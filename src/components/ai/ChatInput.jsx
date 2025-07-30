import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff } from 'lucide-react';

const ChatInput = memo(({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  onVoiceCommand,
  isLoading, 
  isListening, 
  voiceSupported,
  className = "",
  placeholder = "Pregúntame algo..."
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
    e.stopPropagation();
    setInputMessage(e.target.value);
  }, [setInputMessage]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`flex space-x-2 ${className}`}>
      <input
        type="text"
        value={inputMessage}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onClick={handleClick}
        onFocus={handleClick}
        placeholder={placeholder}
        className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      />
      
      {voiceSupported && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onVoiceCommand}
          className={`p-2 ${isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          } text-white rounded-lg transition-all`}
          title="Comando de voz (Ctrl+Shift+V)"
          disabled={isLoading}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </motion.button>
      )}
      
      <motion.button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={!inputMessage.trim() || isLoading}
        className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <Send size={16} />
      </motion.button>
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;