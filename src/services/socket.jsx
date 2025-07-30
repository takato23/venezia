import React, { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  useEffect(() => {
    // Si ya intentamos conectar, no hacerlo de nuevo
    if (connectionAttempted) return;
    
    let socketInstance = null;
    
    const initializeSocket = async () => {
      setConnectionAttempted(true);
      try {
        // console.log('🔌 Intentando conectar WebSocket real...');
        
        // Importar socket.io de forma dinámica
        const { io } = await import('socket.io-client');
        
        // En desarrollo, el proxy redirige /socket.io al backend
        // En producción, conectar directamente al backend
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? `${window.location.protocol}//${window.location.hostname}:5002`
          : '/'; // Usar proxy en desarrollo
          
        socketInstance = io(socketUrl, {
          transports: ['websocket', 'polling'],
          upgrade: true,
          timeout: 5000,
          path: '/socket.io/',
          autoConnect: true,
          reconnection: false, // Desactivar reconexión automática
          forceNew: false
        });

        socketInstance.on('connect', () => {
          // console.log('✅ WebSocket conectado correctamente');
          setSocket(socketInstance);
          setConnected(true);
        });

        socketInstance.on('disconnect', () => {
          // console.log('❌ WebSocket desconectado');
          setConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          // console.log('⚠️ Error de conexión WebSocket:', error.message);
          // console.log('🔄 Backend no disponible, continuando sin WebSocket real...');
          socketInstance.close(); // Cerrar el socket que falló
          useMockSocket();
        });

      } catch (error) {
        // console.log('⚠️ Socket.io no disponible, usando mock:', error.message);
        useMockSocket();
      }
    };

    const useMockSocket = () => {
      // console.log('🔌 Usando mock WebSocket...');
      
      const mockSocket = {
        on: (event, callback) => {
          // console.log(`📡 Mock listener registrado para: ${event}`);
        },
        off: (event, callback) => {
          // console.log(`📡 Mock listener removido para: ${event}`);
        },
        emit: (event, data) => {
          console.log(`📤 Mock emitiendo evento: ${event}`, data);
        },
        close: () => {
          console.log('🔌 Mock socket cerrado');
        }
      };

      setSocket(mockSocket);
      setConnected(true);
    };

    // Timeout para fallback a mock si la conexión real falla
    const fallbackTimeout = setTimeout(() => {
      if (!connected) {
        useMockSocket();
      }
    }, 3000);

    initializeSocket();

    return () => {
      clearTimeout(fallbackTimeout);
      if (socketInstance) {
        socketInstance.close();
      }
      setConnected(false);
    };
  }, []); // Solo ejecutar una vez al montar

  // Métodos útiles para emitir eventos
  const emitEvent = (eventName, data) => {
    if (socket && connected) {
      socket.emit(eventName, data);
    } else {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento:', eventName);
    }
  };

  const value = {
    socket,
    connected,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 