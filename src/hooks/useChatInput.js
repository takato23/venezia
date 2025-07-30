import { useState, useCallback } from 'react';

// Hook personalizado para manejar el estado del input de forma aislada
const useChatInput = () => {
  const [inputMessage, setInputMessage] = useState('');
  
  const clearInput = useCallback(() => {
    setInputMessage('');
  }, []);
  
  const handleInputChange = useCallback((value) => {
    setInputMessage(value);
  }, []);
  
  return {
    inputMessage,
    setInputMessage: handleInputChange,
    clearInput
  };
};

export default useChatInput;