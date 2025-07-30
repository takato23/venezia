import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  ShoppingCart, 
  Package, 
  BarChart3,
  Factory,
  Store,
  Menu,
  X,
  Search,
  Brain,
  Truck,
  Users,
  Settings,
  History,
  Tag,
  ChefHat,
  FileText
} from 'lucide-react';
import clsx from 'clsx';

const MobileNavigation = ({ onMenuClick }) => {
  const location = useLocation();
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Elementos principales de navegación - más estratégicos
  const primaryItems = [
    { name: 'Inicio', href: '/', icon: Home, category: 'main' },
    { name: 'POS', href: '/pos', icon: ShoppingCart, category: 'sales', highlight: true },
    { name: 'Stock', href: '/inventory', icon: Package, category: 'inventory' },
    { name: 'Producción', href: '/production', icon: Factory, category: 'production' },
  ];

  // Elementos de acceso rápido para el drawer
  const quickAccessItems = [
    // === VENTAS & POS ===
    { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, category: 'Ventas', highlight: true },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart, category: 'Ventas' },
    { name: 'Tienda Web', href: '/shop', icon: Store, category: 'Ventas' },
    { name: 'Entregas', href: '/deliveries', icon: Truck, category: 'Ventas' },
    
    // === INVENTARIO ===
    { name: 'Stock General', href: '/stock', icon: Package, category: 'Inventario' },
    { name: 'Ingredientes', href: '/ingredients', icon: Package, category: 'Inventario' },
    { name: 'Transacciones', href: '/transactions', icon: History, category: 'Inventario' },
    
    // === PRODUCCIÓN ===
    { name: 'Recetas', href: '/recipes', icon: ChefHat, category: 'Producción' },
    { name: 'Órdenes', href: '/production-orders', icon: Factory, category: 'Producción' },
    { name: 'Asignar Lote', href: '/batch-assignment', icon: Factory, category: 'Producción' },
    
    // === GESTIÓN ===
    { name: 'Productos', href: '/products', icon: Tag, category: 'Gestión' },
    { name: 'Proveedores', href: '/providers', icon: Users, category: 'Gestión' },
    { name: 'Tiendas', href: '/stores', icon: Store, category: 'Gestión' },
    { name: 'Usuarios', href: '/web-users', icon: Users, category: 'Gestión' },
    
    // === ANÁLISIS ===
    { name: 'Reportes', href: '/reports', icon: FileText, category: 'Análisis' },
    { name: 'Analíticas', href: '/analytics', icon: BarChart3, category: 'Análisis' },
    
    // === ESPECIALES ===
    { name: 'Asistente AI', href: '/ai-assistant', icon: Brain, category: 'Especial', highlight: true },
    { name: 'Configuración', href: '/settings', icon: Settings, category: 'Sistema' },
  ];

  // Filtrar elementos de acceso rápido
  const filteredQuickAccess = quickAccessItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por categoría
  const groupedItems = filteredQuickAccess.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  // Cerrar drawer al navegar
  useEffect(() => {
    setShowQuickAccess(false);
  }, [location.pathname]);

  return (
    <>
      {/* Quick Access Drawer */}
      <AnimatePresence>
        {showQuickAccess && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowQuickAccess(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Acceso Rápido</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Navega rápidamente a cualquier sección</p>
                </div>
                <button
                  onClick={() => setShowQuickAccess(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar páginas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Quick Access Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            className={clsx(
                              'flex items-center gap-3 p-4 rounded-xl transition-all duration-200',
                              'border border-gray-200 dark:border-gray-700',
                              'active:scale-95',
                              item.highlight && !isActive && 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200/50 dark:border-purple-700/50',
                              isActive
                                ? item.highlight
                                  ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-blue-900/50 dark:text-purple-300 border-purple-300 dark:border-purple-600'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300 dark:border-blue-600'
                                : item.highlight
                                  ? 'text-purple-700 dark:text-purple-300'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            )}
                          >
                            <item.icon className={clsx(
                              'h-5 w-5 flex-shrink-0',
                              isActive
                                ? item.highlight
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-blue-600 dark:text-blue-400'
                                : item.highlight
                                  ? 'text-purple-500 dark:text-purple-400'
                                  : 'text-gray-500 dark:text-gray-400'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {item.name}
                              </p>
                              {item.highlight && (
                                <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold mt-1">
                                  NEW
                                </span>
                              )}
                            </div>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowQuickAccess(false);
                      onMenuClick();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <Menu className="h-5 w-5" />
                    Menú Completo
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickAccess(false);
                      // Trigger global search
                      const event = new CustomEvent('keyboardShortcut', { 
                        detail: { type: 'search', action: 'open' } 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center justify-center p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 lg:hidden safe-area-inset-bottom">
        {/* Contenedor principal con padding optimizado para pulgar */}
        <div className="flex items-center justify-center px-2 py-3">
          <div className="flex items-center justify-around w-full max-w-md mx-auto">
            {primaryItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      'relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                      'touch-target min-w-[60px] min-h-[60px]', // Área táctil más grande
                      'active:scale-95', // Feedback táctil
                      item.highlight && !isActive && 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20',
                      isActive
                        ? item.highlight
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-blue-600 dark:text-blue-400'
                        : item.highlight
                          ? 'text-purple-500 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Indicador activo con animación suave */}
                      {isActive && (
                        <motion.div
                          layoutId="mobileActiveIndicator"
                          className={clsx(
                            "absolute inset-0 rounded-xl shadow-sm",
                            item.highlight
                              ? "bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30"
                              : "bg-blue-50 dark:bg-blue-900/30"
                          )}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30
                          }}
                        />
                      )}
                      
                      {/* Ícono con animación de pulso en activo */}
                      <motion.div 
                        className="relative z-10"
                        animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon className={clsx(
                          'h-6 w-6 transition-colors',
                          isActive
                            ? item.highlight
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-blue-600 dark:text-blue-400'
                            : item.highlight
                              ? 'text-purple-500 dark:text-purple-400'
                              : 'text-gray-500 dark:text-gray-400'
                        )} />
                      </motion.div>
                      
                      {/* Label más pequeño para ahorrar espacio */}
                      <span className={clsx(
                        'text-xs font-medium truncate relative z-10 max-w-[50px]',
                        isActive
                          ? item.highlight
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                          : item.highlight
                            ? 'text-purple-500 dark:text-purple-400'
                            : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {item.name}
                      </span>
                      
                      {/* Indicador NEW para elementos destacados */}
                      {item.highlight && !isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
            
            {/* Botón de acceso rápido mejorado */}
            <button
              onClick={() => setShowQuickAccess(true)}
              className={clsx(
                'relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                'touch-target min-w-[60px] min-h-[60px]',
                'text-gray-600 dark:text-gray-400',
                'active:scale-95 active:bg-gray-100 dark:active:bg-gray-700',
                'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              aria-label="Acceso rápido a todas las secciones"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative z-10"
              >
                <Menu className="h-6 w-6" />
              </motion.div>
              <span className="text-xs font-medium truncate relative z-10 max-w-[50px]">
                Más
              </span>
              
              {/* Indicador de nuevas funcionalidades */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              />
            </button>
          </div>
        </div>

        {/* Indicador de arrastre para devices con home indicator */}
        <div className="flex justify-center pb-1">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50" />
        </div>
      </div>
    </>
  );
};

export default MobileNavigation; 