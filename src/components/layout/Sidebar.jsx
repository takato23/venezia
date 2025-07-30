import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  Factory,
  Store,
  UserCheck,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Home,
  X,
  Brain,
  Truck,
  FileText,
  ChefHat,
  History,
  DollarSign,
  Thermometer,
  Building2,
  LayoutGrid
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const Sidebar = React.memo(({ isOpen, onClose }) => {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar en móvil al hacer click en un enlace
  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const navigationGroups = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/', icon: Home },
      ]
    },
    {
      title: 'Ventas & POS',
      items: [
        { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart },
        { name: 'Ventas', href: '/sales', icon: ShoppingCart },
        { name: 'Tienda Web', href: '/shop', icon: Store },
        { name: 'Entregas', href: '/deliveries', icon: Truck },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Stock General', href: '/stock', icon: Package },
        { name: 'Ingredientes', href: '/ingredients', icon: Package },
        { name: 'Transacciones', href: '/transactions', icon: History },
        { name: 'Inventario', href: '/inventory', icon: Package },
      ]
    },
    {
      title: 'Producción',
      items: [
        { name: 'Recetas', href: '/recipes', icon: ChefHat },
        { name: 'Producción', href: '/production', icon: Factory },
        { name: 'Órdenes de Producción', href: '/production-orders', icon: Factory },
        { name: 'Asignar Lote', href: '/batch-assignment', icon: Factory },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { name: 'Clientes', href: '/customers', icon: Users },
        { name: 'Productos', href: '/products', icon: Tag },
        { name: 'Proveedores', href: '/providers', icon: Users },
        { name: 'Tiendas', href: '/stores', icon: Store },
        { name: 'Usuarios Web', href: '/web-users', icon: UserCheck },
      ]
    },
    {
      title: 'Finanzas',
      items: [
        { name: 'Control de Caja', href: '/cashflow', icon: DollarSign },
      ]
    },
    {
      title: 'Multi-Sucursal',
      items: [
        { name: 'Sucursales', href: '/branches', icon: Building2 },
        { name: 'Dashboard Corporativo', href: '/corporate-dashboard', icon: LayoutGrid },
      ]
    },
    {
      title: 'Análisis',
      items: [
        { name: 'Reportes', href: '/reports', icon: FileText },
        { name: 'Analíticas', href: '/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { name: 'Control de Temperatura', href: '/temperature', icon: Thermometer },
        { name: 'Configuración', href: '/settings', icon: Settings },
      ]
    }
  ];

  // Variantes de animación
  const sidebarVariants = {
    open: {
      width: isMobile ? '85vw' : '16rem', // 85% del ancho en móvil para permitir cerrar tocando afuera
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      width: isMobile ? '0px' : '4rem',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const contentVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1,
        duration: 0.2
      }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.15
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Ice Cream Themed Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        className={clsx(
          'fixed left-0 top-0 z-50 h-screen gelato-card border-r-4 border-r-primary-300 dark:border-r-primary-600',
          'lg:translate-x-0 shadow-2xl',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && 'max-w-[85vw]' // Máximo 85% del ancho
        )}
        style={{
          background: 'linear-gradient(180deg, var(--flavor-vanilla) 0%, var(--cream-warm) 100%)'
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header con área táctil optimizada */}
          <div className={clsx(
            'flex items-center justify-between border-b border-gray-200 dark:border-gray-700',
            isMobile ? 'h-20 px-4 py-3' : 'h-16 px-4' // Más altura en móvil
          )}>
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="logo-full"
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 scoop-button scoop-strawberry rounded-xl flex items-center justify-center shadow-lg animate-wobble-soft">
                    <span className="text-white font-bold text-lg font-display">🍦</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-display font-bold text-venezia-800 dark:text-venezia-100">Venezia</h1>
                    <p className="text-xs text-venezia-600 dark:text-venezia-400 font-medium">Gelateria Management</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-compact"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-10 w-10 scoop-button scoop-strawberry rounded-xl flex items-center justify-center shadow-lg animate-wobble-soft"
                >
                  <span className="text-white font-bold text-lg">🍦</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón cerrar en móvil - área táctil más grande */}
            {isMobile && (
              <button
                onClick={onClose}
                className="touch-target p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                aria-label="Cerrar menú"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          {/* Navigation con scroll optimizado */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="space-y-6"> {/* Más espacio entre grupos */}
              {navigationGroups.map((group, groupIndex) => (
                <div key={group.title} className="space-y-2">
                  {/* Group Title */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.h3
                        variants={contentVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4"
                      >
                        {group.title}
                      </motion.h3>
                    )}
                  </AnimatePresence>
                  
                  {/* Group Items */}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-4 rounded-2xl px-4 transition-all duration-300 relative backdrop-blur-sm',
                        'hover:bg-primary-50/60 dark:hover:bg-gray-700/60 hover:shadow-md hover:-translate-y-0.5',
                        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                        'active:scale-95 active:shadow-inner', // Feedback táctil
                        // Área táctil más grande en móvil
                        isMobile ? 'py-4 min-h-[56px]' : 'py-3 min-h-[44px]',
                        // Estilo especial para AI Assistant
                        item.highlight && !isActive && 'bg-gradient-to-r from-mint-50/80 to-pistachio-50/80 dark:from-mint-900/20 dark:to-pistachio-900/20 border border-mint-200/50 dark:border-mint-700/50',
                        isActive
                          ? item.highlight 
                            ? 'bg-gradient-to-r from-mint-100/90 to-pistachio-100/90 text-mint-700 dark:bg-gradient-to-r dark:from-mint-900/50 dark:to-pistachio-900/50 dark:text-mint-300 shadow-lg border border-mint-300 dark:border-mint-600'
                            : 'bg-gradient-to-r from-primary-50/90 to-venezia-50/90 text-primary-700 dark:bg-gradient-to-r dark:from-primary-900/50 dark:to-venezia-900/50 dark:text-primary-300 shadow-lg'
                          : item.highlight
                            ? 'text-mint-700 dark:text-mint-300'
                            : 'text-venezia-700 dark:text-venezia-300'
                      )
                    }
                  >
                    <item.icon className={clsx(
                      'flex-shrink-0 transition-colors',
                      isMobile ? 'h-6 w-6' : 'h-5 w-5',
                      isActive
                        ? item.highlight
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-blue-600 dark:text-blue-400'
                        : item.highlight
                          ? 'text-purple-500 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    )} />
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          variants={contentVariants}
                          initial="closed"
                          animate="open"
                          exit="closed"
                          className="flex items-center gap-2 flex-1"
                        >
                          <span className={clsx(
                            'truncate font-medium',
                            isMobile ? 'text-base' : 'text-sm'
                          )}>
                            {item.name}
                          </span>
                          {item.highlight && (
                            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                              NEW
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Ice Cream Cone Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="cone-indicator"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30
                        }}
                      />
                    )}
                  </NavLink>
                );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer con controles accesibles */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {/* Toggle Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className={clsx(
                'group flex items-center gap-4 w-full rounded-2xl px-4 transition-all duration-300 backdrop-blur-sm',
                'hover:bg-primary-50/60 dark:hover:bg-gray-700/60 hover:shadow-md hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                'text-venezia-700 dark:text-venezia-300',
                'active:scale-95',
                isMobile ? 'py-4 min-h-[56px]' : 'py-3 min-h-[44px]'
              )}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {darkMode ? (
                <Sun className={clsx(
                  'flex-shrink-0 text-yellow-500 transition-colors',
                  isMobile ? 'h-6 w-6' : 'h-5 w-5'
                )} />
              ) : (
                <Moon className={clsx(
                  'flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors',
                  isMobile ? 'h-6 w-6' : 'h-5 w-5'
                )} />
              )}
              
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    variants={contentVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className={clsx(
                      'truncate font-medium',
                      isMobile ? 'text-base' : 'text-sm'
                    )}
                  >
                    {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Versión - solo desktop */}
            {!isMobile && (
              <div className="mt-2">
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      variants={contentVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      className="text-xs text-gray-500 dark:text-gray-400 text-center py-2"
                    >
                      Venezia Ice Cream v2.0
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 