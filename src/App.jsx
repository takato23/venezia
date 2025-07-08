import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuthStore } from './store/authStore.supabase';
import { useSocket } from './services/socket';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';
import ErrorBoundary, { RouteErrorBoundary } from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useVoiceCommands from './hooks/useVoiceCommands';
import useAutoTheme from './hooks/useAutoTheme';
import CacheStatus from './components/ui/CacheStatus';

// Chart.js se carga de forma lazy cuando se necesita

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNavigation from './components/ui/MobileNavigation';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ExpandableAIChatRefactored from './components/ai/ExpandableAIChatRefactored';
import { AIChatProvider } from './contexts/AIChatContext';
import GlobalSearch from './components/ui/GlobalSearch';
import VoiceCommandIndicator from './components/ui/VoiceCommandIndicator';
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal';
import PerformanceTracker from './components/ui/PerformanceTracker';
import AlertPanel from './components/alerts/AlertPanel';
import './styles/focus-mode.css';

// Lazy loading de páginas para mejor performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Production = React.lazy(() => import('./pages/Production'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Providers = React.lazy(() => import('./pages/Providers'));
const WebUsers = React.lazy(() => import('./pages/WebUsers'));
const Products = React.lazy(() => import('./pages/Products'));
const AIAssistantPage = React.lazy(() => import('./pages/AIAssistant'));
const Login = React.lazy(() => import('./pages/Login'));
const Deliveries = React.lazy(() => import('./pages/Deliveries'));
const Reports = React.lazy(() => import('./pages/Reports'));
const POS = React.lazy(() => import('./pages/POS'));
const Stores = React.lazy(() => import('./pages/Stores'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const BatchAssignmentPage = React.lazy(() => import('./pages/BatchAssignment'));
const Customers = React.lazy(() => import('./pages/Customers'));
const CashFlow = React.lazy(() => import('./pages/CashFlow'));
const Temperature = React.lazy(() => import('./pages/Temperature'));

// Layout principal con sidebar y header
const AppLayout = ({ children, globalSearchOpen, setGlobalSearchOpen, shortcutsModalOpen, setShortcutsModalOpen }) => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Manejar responsive del sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Configurar estado inicial basado en el tamaño de pantalla
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - no afecta el layout en móvil */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Contenido principal - siempre ocupa el ancho completo en móvil */}
      <div className={clsx(
        'flex-1 flex flex-col min-w-0', // min-w-0 previene overflow
        'transition-all duration-300 ease-in-out',
        // En desktop, ajustar margen según sidebar
        !isMobile && sidebarOpen ? 'lg:ml-64' : !isMobile ? 'lg:ml-16' : ''
      )}>
        <Header onMenuClick={toggleSidebar} />
        
        {/* Main content con scroll independiente */}
        <main className={clsx(
          'flex-1 overflow-y-auto overflow-x-hidden', // Scroll independiente
          'p-4 lg:p-6',
          isMobile ? 'pb-20' : '', // Espacio para nav móvil
          'custom-scrollbar' // Scrollbar personalizado
        )}>
          <div className="max-w-full"> {/* Prevenir overflow horizontal */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full" // Asegurar ancho completo
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Navegación móvil inferior - posición fija */}
      {isMobile && <MobileNavigation onMenuClick={toggleSidebar} />}
      
      {/* Chat AI expandible global */}
      <AIChatProvider>
        <ExpandableAIChatRefactored />
      </AIChatProvider>
      
      {/* Búsqueda global */}
      <GlobalSearch 
        isOpen={globalSearchOpen} 
        onClose={() => setGlobalSearchOpen(false)} 
      />
      
      {/* Modal de atajos de teclado */}
      <KeyboardShortcutsModal 
        isOpen={shortcutsModalOpen} 
        onClose={() => setShortcutsModalOpen(false)} 
      />
      
      {/* Indicador de comandos de voz */}
      <VoiceCommandIndicator />
      
      {/* Monitor de performance */}
      <PerformanceTracker />
      
      {/* Panel de alertas en tiempo real */}
      <AlertPanel />
    </div>
  );
};

// Componente de ruta protegida
const ProtectedRoute = ({ children, globalSearchOpen, setGlobalSearchOpen, shortcutsModalOpen, setShortcutsModalOpen }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-venezia-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout 
      globalSearchOpen={globalSearchOpen} 
      setGlobalSearchOpen={setGlobalSearchOpen}
      shortcutsModalOpen={shortcutsModalOpen}
      setShortcutsModalOpen={setShortcutsModalOpen}
    >
      {children}
    </AppLayout>
  );
};

// Componente principal de la aplicación
function App() {
  const { checkAuth, isLoading, darkMode, setDarkMode } = useAuthStore();
  const { socket } = useSocket();
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const navigate = useNavigate();
  
  // Hooks para funcionalidades avanzadas
  const { shortcuts } = useKeyboardShortcuts();
  const { isSupported: voiceSupported, startListening, stopListening, isListening } = useVoiceCommands();
  const { autoMode, toggleAutoMode, getNextThemeChange, getPeriodIcon } = useAutoTheme(darkMode, setDarkMode);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Inicializar dark mode desde localStorage y aplicarlo al DOM
  useEffect(() => {
    // Verificar preferencia del sistema si no hay configuración guardada
    const savedDarkMode = localStorage.getItem('venezia-auth');
    let shouldUseDarkMode = darkMode;
    
    if (!savedDarkMode) {
      // Si no hay preferencia guardada, usar preferencia del sistema
      shouldUseDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(shouldUseDarkMode);
    }

    // Aplicar al DOM
    if (shouldUseDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sincronizar cambios de darkMode con el DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handler para shortcuts de teclado
  useEffect(() => {
    const handleKeyboardShortcut = (event) => {
      const { type, target, action, text } = event.detail;
      
      switch (type) {
        case 'navigate':
          navigate(target);
          success('Navegación', `Navegando a ${target}`);
          break;
          
        case 'chat':
          // Enviar evento para controlar el chat
          const chatEvent = new CustomEvent('chatControl', { detail: { action } });
          window.dispatchEvent(chatEvent);
          break;
          
        case 'theme':
          if (action === 'toggle') {
            if (autoMode) {
              // Si está en modo automático, desactivarlo y cambiar tema manualmente
              toggleAutoMode();
              info('Tema automático', 'Modo automático desactivado. Cambiando tema manualmente.');
            }
            setDarkMode(!darkMode);
            success('Tema', `Modo ${!darkMode ? 'oscuro' : 'claro'} activado`);
          }
          break;
          
        case 'voice':
          if (action === 'toggle' && voiceSupported) {
            if (isListening) {
              stopListening();
            } else {
              startListening();
              info('Comando de voz', '🎤 Escuchando... Di tu comando');
            }
          }
          break;
          
        case 'action':
          if (action === 'refresh_data') {
            window.location.reload();
          } else if (action === 'toggle_auto_theme') {
            const newAutoMode = toggleAutoMode();
            const nextChange = getNextThemeChange();
            success(
              'Tema automático',
              newAutoMode 
                ? `Activado. Próximo cambio: ${nextChange?.timeString} (${nextChange?.type})` 
                : 'Desactivado'
            );
          } else if (action === 'new_sale' && target) {
            navigate(target);
            success('Acceso rápido', 'Navegando al punto de venta');
          } else if (action === 'new_product' && target) {
            navigate(target);
            success('Acceso rápido', 'Navegando a productos');
          } else if (action === 'new_order' && target) {
            navigate(target);
            success('Acceso rápido', 'Navegando a órdenes de producción');
          } else if (action === 'new_ingredient' && target) {
            navigate(target);
            success('Acceso rápido', 'Navegando a ingredientes');
          } else if (action === 'new_recipe' && target) {
            navigate(target);
            success('Acceso rápido', 'Navegando a recetas');
          } else if (action === 'new_transaction' && target) {
            navigate(target);
            success('Acceso rápido', 'Navegando a transacciones');
          }
          break;
          
        case 'filter':
          if (action === 'low_stock' && target) {
            navigate(target);
            success('Filtro aplicado', 'Mostrando productos con stock bajo');
          } else if (action === 'pending_orders' && target) {
            navigate(target);
            success('Filtro aplicado', 'Mostrando órdenes pendientes');
          } else if (action === 'toggle_filters') {
            // Enviar evento para toggle filtros
            const filterEvent = new CustomEvent('toggleFilters');
            window.dispatchEvent(filterEvent);
            info('Filtros', 'Toggle filtros activado');
          } else if (action === 'clear_filters') {
            // Enviar evento para limpiar filtros
            const clearEvent = new CustomEvent('clearFilters');
            window.dispatchEvent(clearEvent);
            success('Filtros', 'Filtros limpiados');
          }
          break;
          
        case 'ui':
          if (action === 'toggle_sidebar') {
            // Toggle sidebar (si está disponible)
            const sidebarEvent = new CustomEvent('toggleSidebar');
            window.dispatchEvent(sidebarEvent);
            info('UI', 'Sidebar toggled');
          } else if (action === 'toggle_focus') {
            // Toggle modo focus
            document.documentElement.classList.toggle('focus-mode');
            const isFocusMode = document.documentElement.classList.contains('focus-mode');
            success('Modo Focus', isFocusMode ? 'Activado' : 'Desactivado');
          }
          break;
          
        case 'search':
          if (action === 'open') {
            setGlobalSearchOpen(true);
          }
          break;
          
        case 'help':
          if (action === 'shortcuts') {
            setShortcutsModalOpen(true);
          }
          break;
          
        default:
          console.log('Shortcut no manejado:', event.detail);
      }
    };
    
    window.addEventListener('keyboardShortcut', handleKeyboardShortcut);
    return () => window.removeEventListener('keyboardShortcut', handleKeyboardShortcut);
  }, [navigate, success, info, darkMode, setDarkMode, voiceSupported, isListening, startListening, stopListening, setGlobalSearchOpen, setShortcutsModalOpen, toggleAutoMode, getNextThemeChange]);

  // Handler para comandos de voz
  useEffect(() => {
    const handleVoiceCommand = (event) => {
      const { type, target, action, text, originalText, confidence } = event.detail;
      
      // Mostrar feedback del comando reconocido
      info('Comando de voz', `🎯 "${originalText}" (${Math.round(confidence * 100)}%)`);
      
      switch (type) {
        case 'navigate':
          navigate(target);
          success('Navegación por voz', `Navegando a ${target}`);
          break;
          
        case 'chat':
          const chatEvent = new CustomEvent('chatControl', { detail: { action } });
          window.dispatchEvent(chatEvent);
          break;
          
        case 'query':
          // Enviar consulta al chat AI
          const queryEvent = new CustomEvent('chatQuery', { detail: { text } });
          window.dispatchEvent(queryEvent);
          break;
          
        case 'theme':
          if (action === 'dark') {
            setDarkMode(true);
            success('Tema', 'Modo oscuro activado por voz');
          } else if (action === 'light') {
            setDarkMode(false);
            success('Tema', 'Modo claro activado por voz');
          }
          break;
          
        default:
          console.log('Comando de voz no manejado:', event.detail);
      }
    };
    
    window.addEventListener('voiceCommand', handleVoiceCommand);
    return () => window.removeEventListener('voiceCommand', handleVoiceCommand);
  }, [navigate, success, info, setDarkMode]);

  // Handler para cambios automáticos de tema
  useEffect(() => {
    const handleThemeAutoChange = (event) => {
      const { newTheme, time, reason } = event.detail;
      
      if (reason === 'automatic') {
        const icon = getPeriodIcon();
        info(
          `${icon} Tema automático`,
          `Cambiando a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} (${time})`
        );
      }
    };
    
    window.addEventListener('themeAutoChange', handleThemeAutoChange);
    return () => window.removeEventListener('themeAutoChange', handleThemeAutoChange);
  }, [info, getPeriodIcon]);

  // Configurar listeners de WebSocket con notificaciones Toast
  useEffect(() => {
    if (socket) {
      // Listener para notificaciones en tiempo real
      socket.on('notification', (data) => {
        console.log('Nueva notificación:', data);
        
        // Mostrar notificación según el tipo
        switch (data.type) {
          case 'success':
            success(data.title, data.message);
            break;
          case 'error':
            error(data.title, data.message);
            break;
          case 'warning':
            warning(data.title, data.message);
            break;
          default:
            info(data.title, data.message);
        }
      });

      // Listener para actualizaciones de datos
      socket.on('data_update', (data) => {
        console.log('Actualización de datos:', data);
        // Mostrar notificación sutil para actualizaciones
        info('Datos actualizados', 'La información se ha actualizado automáticamente');
      });

      // Listener para conexión/desconexión
      socket.on('connect', () => {
        success('Conectado', 'Conexión en tiempo real establecida');
      });

      socket.on('disconnect', () => {
        warning('Desconectado', 'Se perdió la conexión en tiempo real');
      });

      return () => {
        socket.off('notification');
        socket.off('data_update');
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket, success, error, warning, info]);

  // Loading inicial mientras se verifica auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-venezia-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {/* Sistema de notificaciones Toast personalizado */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        {/* Monitor de estado de red */}
        <NetworkStatus />
        
        {/* Indicador de actualización de caché */}
        <CacheStatus />
        
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-venezia-50 dark:bg-gray-900">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <RouteErrorBoundary>
            <Routes>
          {/* Ruta de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/sales/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Sales />
            </ProtectedRoute>
          } />
          
          <Route path="/inventory/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Inventory />
            </ProtectedRoute>
          } />
          
          <Route path="/ingredients" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Inventory />
            </ProtectedRoute>
          } />
          
          <Route path="/recipes" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Inventory />
            </ProtectedRoute>
          } />
          
          <Route path="/stock" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Inventory />
            </ProtectedRoute>
          } />
          
          <Route path="/transactions" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Transactions />
            </ProtectedRoute>
          } />
          
          <Route path="/products/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Products />
            </ProtectedRoute>
          } />
          
          <Route path="/production/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Production />
            </ProtectedRoute>
          } />
          
          <Route path="/production-orders" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Production />
            </ProtectedRoute>
          } />
          
          <Route path="/batch-assignment" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <BatchAssignmentPage />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Analytics />
            </ProtectedRoute>
          } />
          
          <Route path="/shop/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Shop />
            </ProtectedRoute>
          } />
          
          <Route path="/providers/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Providers />
            </ProtectedRoute>
          } />
          
          <Route path="/pos" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <POS />
            </ProtectedRoute>
          } />
          
          <Route path="/stores" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Stores />
            </ProtectedRoute>
          } />
          
          <Route path="/web-users/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <WebUsers />
            </ProtectedRoute>
          } />
          
          <Route path="/deliveries/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Deliveries />
            </ProtectedRoute>
          } />
          
          <Route path="/customers/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Customers />
            </ProtectedRoute>
          } />
          
          <Route path="/cashflow/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <CashFlow />
            </ProtectedRoute>
          } />
          
          <Route path="/temperature/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Temperature />
            </ProtectedRoute>
          } />
          
          <Route path="/reports/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/settings/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Ruta temporal sin protección para debug */}
          <Route path="/ai-test" element={<AIAssistantPage />} />
          
          <Route path="/ai-assistant" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <AIAssistantPage />
            </ProtectedRoute>
          } />
          
          <Route path="/ai-assistant/*" element={
            <ProtectedRoute globalSearchOpen={globalSearchOpen} setGlobalSearchOpen={setGlobalSearchOpen} shortcutsModalOpen={shortcutsModalOpen} setShortcutsModalOpen={setShortcutsModalOpen}>
              <AIAssistantPage />
            </ProtectedRoute>
          } />
          
          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </RouteErrorBoundary>
    </Suspense>
  </div>
</ErrorBoundary>
  );
}

export default App; 