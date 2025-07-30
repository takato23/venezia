import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected, preferences } = useNotifications();
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  
  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellRef.current && 
        !bellRef.current.contains(event.target) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);
  
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };
  
  const isPushDisabled = preferences && !preferences.push_enabled;
  
  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={togglePanel}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${isConnected ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}
          ${isOpen ? 'bg-gray-100' : ''}
        `}
        title={
          !isConnected ? 'Sin conexión' :
          isPushDisabled ? 'Notificaciones desactivadas' :
          unreadCount > 0 ? `${unreadCount} notificaciones sin leer` :
          'Sin notificaciones nuevas'
        }
        disabled={!isConnected}
      >
        {/* Bell Icon */}
        {isPushDisabled ? (
          <BellOff className="w-6 h-6 text-gray-500" />
        ) : (
          <Bell className="w-6 h-6 text-gray-700" />
        )}
        
        {/* Unread Count Badge */}
        <AnimatePresence>
          {unreadCount > 0 && !isPushDisabled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Connection Status Indicator */}
        <div 
          className={`
            absolute bottom-0 right-0 w-2 h-2 rounded-full
            ${isConnected ? 'bg-green-500' : 'bg-red-500'}
          `}
        />
      </button>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <div ref={panelRef}>
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;