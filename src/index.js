import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { SocketProvider } from './services/socketMock';
import { initializeIcons } from './utils/createIcons';
import { setupApiInterceptors } from './services/apiInterceptor';

// Initialize PWA icons
initializeIcons();

// Setup API interceptors for error handling and offline mode
setupApiInterceptors();

// Configuración global de toast notifications
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#ffffff',
    color: '#1a1a1a',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#22c55e',
      secondary: '#ffffff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  },
};

// Inicialización de la aplicación
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <SocketProvider>
        <App />
        <Toaster 
          toastOptions={toastOptions}
          containerStyle={{
            top: 20,
            right: 20,
          }}
        />
      </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Hot Module Replacement para desarrollo
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(
      <React.StrictMode>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <SocketProvider>
            <NextApp />
            <Toaster toastOptions={toastOptions} />
          </SocketProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  });
} 