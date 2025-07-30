import React, { memo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import LoadingIndicator from './LoadingIndicator';

const MessageList = memo(({ 
  messages, 
  isLoading, 
  compact = false,
  className = "",
  height = "h-64"
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Detectar si el usuario está haciendo scroll manual
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setAutoScroll(isAtBottom);
  }, []);

  // Botón para volver al final
  const ScrollToBottomButton = () => {
    if (autoScroll) return null;
    
    return (
      <button
        onClick={() => {
          setAutoScroll(true);
          scrollToBottom();
        }}
        className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Ir al final"
      >
        ↓
      </button>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className={`${height} overflow-y-auto ${compact ? 'p-2 space-y-2' : 'p-4 space-y-3'} scroll-smooth`}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              compact={compact}
            />
          ))}
        </AnimatePresence>
        
        {isLoading && <LoadingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ScrollToBottomButton />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;