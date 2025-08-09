import React, { useState, useEffect, useMemo } from 'react';
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
import { useAuthStore } from '../../store/authStore.supabase';
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

  // A11y: respeta reducción de movimiento
  const prefersReducedMotion = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);
  
  // A11y: id para label del nav
  const ariaLabelledById = 'sidebar-title';

  // Keyboard navigation: focus management
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Navigation groups definition - moved before flatItems to avoid reference error
  const navigationGroups = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/', icon: Home },
      ]
    },
    {
      title: 'Ventas',
      items: [
        { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart },
        { name: 'Tienda Web', href: '/shop', icon: Store },
        { name: 'Entregas', href: '/deliveries', icon: Truck },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Transacciones', href: '/transactions', icon: History },
      ]
    },
    {
      title: 'Producción',
      items: [
        { name: 'Recetas', href: '/recipes', icon: ChefHat },
        { name: 'Producción', href: '/production', icon: Factory },
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
        { name: 'Configuración', href: '/settings', icon: Settings },
      ]
    }
  ];

  // Flatten items for focus movement
  const flatItems = useMemo(() => {
    const list = [];
    navigationGroups.forEach((group, gi) => {
      group.items.forEach((item, ii) => {
        list.push({ ...item, gi, ii, key: `${group.title}-${item.name}` });
      });
    });
    return list;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Allow navigation only when sidebar is open
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((idx) => Math.min(idx + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((idx) => Math.max(idx - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(flatItems.length - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatItems.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(flatItems.length - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, flatItems.length]);

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

      {/* Neumorphic Glass Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        className={clsx(
          'fixed left-0 top-0 z-50 h-screen lg:translate-x-0 shadow-2xl',
          'sb-glass',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && 'max-w-[85vw]'
        )}
        role="navigation"
        aria-label="Navegación principal"
        aria-labelledby={ariaLabelledById}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={clsx(
              'flex items-center justify-between sb-header',
              isMobile ? 'h-20 px-4 py-3' : 'h-16 px-4'
            )}
          >
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
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg bg-venezia-500 text-white">
                    <span className="font-bold text-lg">VZ</span>
                  </div>
                  <div>
                    <h1 id={ariaLabelledById} className="sb-label text-base font-semibold">Venezia</h1>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Sistema de Gestión</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-compact"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg bg-venezia-500 text-white"
                >
                  <span className="font-bold text-lg">VZ</span>
                </motion.div>
              )}
            </AnimatePresence>

            {isMobile && (
              <button
                onClick={onClose}
                className="touch-target p-3 rounded-xl sb-item active:scale-95"
                aria-label="Cerrar menú"
              >
                <X className="h-6 w-6 sb-icon" />
              </button>
            )}
          </div>

          {/* Search (only desktop and expanded) */}
          {!isMobile && isOpen && (
            <div className="px-4 py-3 sb-divider">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="sb-search w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:focus:ring-accent-400"
                  aria-label="Buscar en el menú"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar sb-scroll p-3" aria-label="Secciones del menú">
            <div className="space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.title} className="space-y-1.5" role="group" aria-label={group.title}>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.h3
                        variants={contentVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="sb-group-title px-3"
                      >
                        {group.title}
                      </motion.h3>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;

                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={handleLinkClick}
                          aria-current={isActive ? 'page' : undefined}
                          className={({ isActive }) =>
                            clsx(
                              'sb-item group flex items-center gap-3 rounded-xl px-3 relative',
                              prefersReducedMotion ? '' : 'transition-all duration-200',
                              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:focus-visible:ring-accent-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                              isMobile ? 'py-3 min-h-[48px]' : 'py-2.5 min-h-[42px]',
                              isActive
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-gray-800 dark:text-gray-200'
                            )
                          }
                          tabIndex={0}
                          role="link"
                          aria-label={item.name}
                          onFocus={() => {
                            const idx = flatItems.findIndex((f) => f.name === item.name && f.href === item.href);
                            if (idx >= 0) setFocusedIndex(idx);
                          }}
                        >
                          <span className={clsx('sb-rail', prefersReducedMotion ? '' : 'transition-all')} aria-hidden="true" />
                          <item.icon
                            className={clsx(
                              'sb-icon flex-shrink-0',
                              isMobile ? 'h-5 w-5' : 'h-4.5 w-4.5'
                            )}
                          />

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                variants={prefersReducedMotion ? undefined : contentVariants}
                                initial={prefersReducedMotion ? undefined : 'closed'}
                                animate={prefersReducedMotion ? undefined : 'open'}
                                exit={prefersReducedMotion ? undefined : 'closed'}
                                className="flex items-center gap-2 flex-1"
                              >
                                <span className={clsx('sb-label truncate font-semibold', isMobile ? 'text-[15px]' : 'text-[14px]')}>
                                  {item.name}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="sb-divider p-3">
            <button
              onClick={toggleDarkMode}
              className={clsx(
                'sb-item group flex items-center gap-3 w-full rounded-xl px-3',
                prefersReducedMotion ? '' : 'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                isMobile ? 'py-3 min-h-[48px]' : 'py-2.5 min-h-[42px]'
              )}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {darkMode ? (
                <Sun className={clsx('sb-icon flex-shrink-0 text-yellow-500', isMobile ? 'h-5 w-5' : 'h-4.5 w-4.5')} />
              ) : (
                <Moon className={clsx('sb-icon flex-shrink-0 text-gray-500 dark:text-gray-400', isMobile ? 'h-5 w-5' : 'h-4.5 w-4.5')} />
              )}

              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    variants={contentVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className={clsx('sb-label truncate font-semibold', isMobile ? 'text-[15px]' : 'text-[14px]')}
                  >
                    {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {!isMobile && (
              <div className="mt-1.5">
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      variants={prefersReducedMotion ? undefined : contentVariants}
                      initial={prefersReducedMotion ? undefined : 'closed'}
                      animate={prefersReducedMotion ? undefined : 'open'}
                      exit={prefersReducedMotion ? undefined : 'closed'}
                      className="text-[11px] text-gray-600 dark:text-gray-400 text-center py-1.5"
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