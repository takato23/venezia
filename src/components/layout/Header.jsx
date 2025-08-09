import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, User, LogOut, Settings, ChevronDown, Moon, Sun, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore.supabase';
import { useSocket } from '../../services/socketMock';
import AlertCenter from '../alerts/AlertCenter';
import BranchSelector from '../multibranch/BranchSelector';
import clsx from 'clsx';

const Header = ({ onMenuClick }) => {
  const { user, logout, darkMode, toggleDarkMode } = useAuthStore();
  const { connected } = useSocket();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState({ products: [], orders: [], customers: [] });
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(null);
  
  const userMenuRef = useRef(null);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or show search modal
      setShowSearchResults(true);
      performSearch(searchQuery);
    }
  };
  
  const performSearch = async (query) => {
    // Search across products, customers, orders
    const searchResults = {
      products: [],
      orders: [],
      customers: []
    };
    
    try {
      // Search products
      const productsRes = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        searchResults.products = data.slice(0, 5); // Limit to 5 results
      }
      
      // Search sales/orders
      const salesRes = await fetch(`/api/sales?search=${encodeURIComponent(query)}`);
      if (salesRes.ok) {
        const data = await salesRes.json();
        searchResults.orders = data.sales?.slice(0, 5) || [];
      }
      
      setSearchResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleBranchChange = (branch) => {
    setCurrentBranch(branch);
    // Guardar en el contexto global o localStorage
    localStorage.setItem('currentBranchId', branch.id);
    // Recargar datos de la nueva sucursal
    window.location.reload();
  };

  return (
    <header className="frost-overlay border-b-4 border-b-venezia-200 dark:border-b-venezia-700 sticky top-0 z-40 shadow-lg">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Menu button - más grande en móvil */}
          <button
            onClick={onMenuClick}
            className={clsx(
              'touch-target rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-venezia-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
              'lg:hidden', // Solo visible en móvil
              isMobile ? 'p-3' : 'p-2' // Más padding en móvil
            )}
            aria-label="Abrir menú"
          >
            <Menu className={clsx('text-gray-600 dark:text-gray-300', isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
          </button>

          {/* Branch Selector - Solo si el usuario tiene acceso a múltiples sucursales */}
          {user?.branch_access?.length > 1 && (
            <BranchSelector 
              currentBranch={currentBranch}
              onBranchChange={handleBranchChange}
            />
          )}

          {/* Ice Cream Themed Search - oculto en móvil pequeño */}
          <div className={clsx('relative', isMobile ? 'hidden' : 'block')}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-venezia-400" />
            <input
              type="text"
              placeholder="Buscar sabores, órdenes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="gelato-input pl-10 pr-4 py-2 w-64 bg-venezia-50/80 dark:bg-gray-700/80 border-venezia-200 dark:border-gray-600 placeholder-venezia-700 dark:placeholder-gray-300"
              aria-label="Buscar productos, órdenes o clientes"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Ice Cream Search Mobile - solo ícono */}
          {isMobile && (
            <button
              onClick={() => setShowMobileSearch(true)}
              className="touch-target p-3 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              aria-label="Buscar productos, órdenes o clientes"
              title="Buscar productos, órdenes o clientes"
            >
              <Search className="h-5 w-5 text-white" />
            </button>
          )}

          {/* Ice Cream Theme Toggle - más grande en móvil */}
          <button
            onClick={toggleDarkMode}
            className={clsx(
              'touch-target rounded-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm',
              'hover:bg-venezia-100/60 dark:hover:bg-gray-700/60 hover:shadow-md',
              isMobile ? 'p-3' : 'p-2'
            )}
            aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? (
              <Sun className={clsx('text-accent-400', isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
            ) : (
              <Moon className={clsx('text-venezia-700 dark:text-venezia-300', isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
            )}
          </button>

          {/* Alert Center - Sistema de Alertas Inteligentes */}
          <AlertCenter />

          {/* Estado de conexión */}
          <div className={clsx('flex items-center gap-2', isMobile ? 'hidden' : 'flex')}>
            <div className={clsx(
              'w-2 h-2 rounded-full',
              connected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-xs text-gray-600 dark:text-gray-400 hidden lg:block">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Ice Cream User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={clsx(
                'touch-target flex items-center gap-2 rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105',
                'hover:bg-venezia-100/60 dark:hover:bg-gray-700/60 hover:shadow-md',
                isMobile ? 'p-2' : 'p-2'
              )}
              aria-label="Menú de usuario"
            >
              <div className={clsx(
                'bg-accent-500 hover:bg-accent-600 text-white rounded-2xl flex items-center justify-center font-semibold shadow-lg transition-colors',
                isMobile ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-xs'
              )}>
                {user?.name?.charAt(0)?.toUpperCase() || '🍦'}
              </div>
              {!isMobile && (
                <>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                    {user?.name || 'Usuario'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </>
              )}
            </button>

            {/* Dropdown del usuario */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={clsx(
                    'absolute right-0 mt-2 gelato-card shadow-2xl border-2 border-venezia-200 dark:border-venezia-700 z-50 overflow-hidden',
                    isMobile ? 'w-64' : 'w-56'
                  )}
                >
                  <div className="p-4 border-b border-venezia-200/30 dark:border-venezia-700/30">
                    <p className="font-semibold text-venezia-800 dark:text-venezia-100">{user?.name || 'Usuario'}</p>
                    <p className="text-sm text-venezia-600 dark:text-venezia-400">{user?.email || 'usuario@venezia.com'}</p>
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Navegar a configuración
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-venezia-700 dark:text-venezia-300 hover:bg-venezia-50/60 dark:hover:bg-gray-700/60 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Settings className="h-4 w-4 text-venezia-500" />
                      Configuración
                    </button>
                    
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-accent-600 dark:text-accent-400 hover:bg-accent-50/60 dark:hover:bg-accent-900/20 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <LogOut className="h-4 w-4 text-accent-500" />
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 