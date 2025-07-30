import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) {
      // Clean up if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }
    
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_INTERVAL
    });
    
    const socket = socketRef.current;
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to notification server');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      
      // Join notification rooms
      socket.emit('join:notifications', {
        userId: user.id,
        storeId: user.store_id,
        role: user.role
      });
      
      // Start heartbeat
      startHeartbeat();
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      setIsConnected(false);
      stopHeartbeat();
      attemptReconnect();
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });
    
    // Notification event handlers
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notifications:all:read', handleAllNotificationsRead);
    socket.on('notifications:unread:count', handleUnreadCount);
    socket.on('preferences:updated', handlePreferencesUpdated);
    
    // Heartbeat handler
    socket.on('heartbeat', handleHeartbeat);
    
    // Load initial data
    loadNotifications();
    loadPreferences();
    getUnreadCount();
    
    // Cleanup on unmount
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);
  
  // Handle browser tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Heartbeat functions
  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('heartbeat:response');
      }
    }, 30000); // 30 seconds
  };
  
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };
  
  const handleHeartbeat = (data) => {
    // Server heartbeat received
    if (socketRef.current) {
      socketRef.current.emit('heartbeat:response');
    }
  };
  
  // Reconnection logic
  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      toast.error('No se pudo conectar al servidor de notificaciones');
      return;
    }
    
    reconnectAttemptsRef.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, RECONNECT_INTERVAL);
  };
  
  // Notification handlers
  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification based on priority
    const toastOptions = {
      duration: notification.priority === 'critical' ? 8000 : 5000,
      position: 'top-right'
    };
    
    switch (notification.priority) {
      case 'critical':
        toast.error(notification.message, toastOptions);
        // Play sound if enabled
        if (preferences?.sound_enabled) {
          playNotificationSound('critical');
        }
        break;
      case 'high':
        toast.error(notification.message, toastOptions);
        if (preferences?.sound_enabled) {
          playNotificationSound('warning');
        }
        break;
      case 'medium':
        toast(notification.message, toastOptions);
        if (preferences?.sound_enabled) {
          playNotificationSound('default');
        }
        break;
      case 'low':
        toast.success(notification.message, toastOptions);
        break;
    }
    
    // Update browser tab title with unread count
    updateTabTitle();
  };
  
  const handleNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    updateTabTitle();
  };
  
  const handleAllNotificationsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
    updateTabTitle();
  };
  
  const handleUnreadCount = (count) => {
    setUnreadCount(count);
    updateTabTitle();
  };
  
  const handlePreferencesUpdated = (newPreferences) => {
    setPreferences(newPreferences);
  };
  
  // API functions
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${SOCKET_URL}/api/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPreferences = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };
  
  const getUnreadCount = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
        updateTabTitle();
      }
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  };
  
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        handleNotificationRead(notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar la notificación como leída');
    }
  }, [user]);
  
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        handleAllNotificationsRead();
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  }, [user]);
  
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(newPreferences)
      });
      
      if (response.ok) {
        setPreferences(newPreferences);
        toast.success('Preferencias actualizadas');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Error al actualizar las preferencias');
    }
  }, [user]);
  
  // Utility functions
  const updateTabTitle = () => {
    const baseTitle = 'Venezia Ice Cream';
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  };
  
  const playNotificationSound = (type = 'default') => {
    try {
      const audioFile = {
        default: '/sounds/notification.mp3',
        warning: '/sounds/warning.mp3',
        critical: '/sounds/critical.mp3'
      }[type] || '/sounds/notification.mp3';
      
      const audio = new Audio(audioFile);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  // Filter notifications by type
  const filterNotifications = useCallback((type) => {
    if (!type || type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  }, [notifications]);
  
  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);
  
  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read_at);
  }, [notifications]);
  
  return {
    notifications,
    unreadCount,
    isConnected,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    refreshNotifications: loadNotifications,
    filterNotifications,
    getNotificationsByPriority,
    getUnreadNotifications
  };
}