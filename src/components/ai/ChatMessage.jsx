import React, { memo } from 'react';
import { motion } from 'framer-motion';

// Importación condicional de ReactMarkdown
let ReactMarkdown;
try {
  ReactMarkdown = require('react-markdown').default || require('react-markdown');
} catch (e) {
  console.warn('react-markdown not available, using plain text rendering');
  ReactMarkdown = null;
}

const ChatMessage = memo(React.forwardRef(({ message, compact = false }, ref) => {
  const isUser = message.type === 'user';
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${compact ? 'mb-2' : 'mb-3'}`}
    >
      <div
        className={`
          ${compact ? 'max-w-[85%]' : 'max-w-[70%]'} 
          ${compact ? 'p-2' : 'p-4'} 
          rounded-${compact ? 'md' : 'xl'} 
          ${isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          } 
          shadow-md
          relative
          group
        `}
      >
        {/* Avatar para mensajes AI */}
        {!isUser && !compact && (
          <div className="absolute -left-10 top-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">AI</span>
            </div>
          </div>
        )}
        
        {/* Contenido del mensaje */}
        <div className={`${compact ? 'text-sm' : ''}`}>
          {!isUser && ReactMarkdown ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
              <ReactMarkdown 
                components={{
                // Estilo para negritas (**texto**)
                strong: ({ children }) => (
                  <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>
                ),
                // Estilo para código inline
                code: ({ inline, children }) => (
                  <code className={`${inline ? 'bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-sm font-mono' : 'block bg-gray-200 dark:bg-gray-600 p-2 rounded font-mono text-sm'}`}>
                    {children}
                  </code>
                ),
                // Estilo para párrafos
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                // Estilo para títulos
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mb-1 text-gray-900 dark:text-white">{children}</h3>
                ),
                // Estilo para listas
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="ml-2">{children}</li>
                ),
                // Estilo para enlaces
                a: ({ href, children }) => (
                  <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`
          text-xs mt-${compact ? '1' : '2'} 
          ${isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}
          flex items-center justify-between
        `}>
          <span>{formatTime(message.timestamp)}</span>
          
          {/* Indicador de estado */}
          {message.status && (
            <span className="ml-2">
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'error' && '❌'}
            </span>
          )}
        </div>

        {/* Acciones del mensaje (copiar, reenviar, etc) */}
        {!compact && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="text-xs p-1 rounded hover:bg-black/10"
              title="Copiar mensaje"
            >
              📋
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}));

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;