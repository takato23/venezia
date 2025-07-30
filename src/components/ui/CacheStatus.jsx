import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import eventBus, { EVENTS } from '../../utils/eventBus';

const CacheStatus = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let timeout;

    const handleCacheInvalidation = () => {
      setIsUpdating(true);
      setMessage('Actualizando datos...');
      
      // Ocultar después de 2 segundos
      timeout = setTimeout(() => {
        setIsUpdating(false);
      }, 2000);
    };

    const handleAIAction = (data) => {
      setIsUpdating(true);
      
      const messages = {
        provider_created: 'Proveedor agregado, actualizando lista...',
        product_created: 'Producto creado, actualizando catálogo...',
        stock_updated: 'Stock actualizado, refrescando inventario...'
      };
      
      setMessage(messages[data?.action] || 'Actualizando datos...');
      
      timeout = setTimeout(() => {
        setIsUpdating(false);
      }, 2000);
    };

    // Suscribirse a eventos
    const unsubscribeCache = eventBus.on(EVENTS.CACHE_INVALIDATE, handleCacheInvalidation);
    const unsubscribeAI = eventBus.on(EVENTS.AI_ACTION_COMPLETED, handleAIAction);

    return () => {
      clearTimeout(timeout);
      unsubscribeCache();
      unsubscribeAI();
    };
  }, []);

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-venezia-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CacheStatus;