import React, { createContext, useContext } from 'react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider');
  }
  return context;
};

// Versión deshabilitada del SocketProvider que no intenta conectar
export const SocketProvider = ({ children }) => {
  // Proveer un objeto mock que no hace nada
  const mockSocket = {
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {},
    connected: false
  };

  const value = {
    socket: mockSocket,
    connected: false,
    emit: () => {},
    on: () => {},
    off: () => {}
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};