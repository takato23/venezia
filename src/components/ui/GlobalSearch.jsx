import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Command, Zap, FileText, Package, Users, BarChart3, 
  Factory, Store, ChefHat, History, Truck, Tag, Settings, ShoppingCart,
  Home, Brain, Calendar, DollarSign, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiCache } from '../../hooks/useApiCache';
import SmartAutocomplete from './SmartAutocomplete';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // API Data for real-time search
  const { data: productsResponse } = useApiCache('/api/products');
  const { data: ingredientsResponse } = useApiCache('/api/ingredients');
  const { data: recipesResponse } = useApiCache('/api/recipes');
  const { data: storesResponse } = useApiCache('/api/stores');
  const { data: usersResponse } = useApiCache('/api/users');

  // Extract arrays from API responses
  const products = productsResponse?.data || productsResponse || [];
  const ingredients = ingredientsResponse?.data || ingredientsResponse || [];
  const recipes = recipesResponse?.data || recipesResponse || [];
  const stores = storesResponse?.data || storesResponse || [];
  const users = usersResponse?.data || usersResponse || [];

  // Funciones de comando (movidas antes del useMemo para evitar errores de inicialización)
  const toggleTheme = () => {
    const event = new CustomEvent('keyboardShortcut', { 
      detail: { type: 'theme', action: 'toggle' } 
    });
    window.dispatchEvent(event);
    onClose();
  };

  const openAIChat = () => {
    const event = new CustomEvent('chatControl', { 
      detail: { action: 'open' } 
    });
    window.dispatchEvent(event);
    onClose();
  };

  // Comprehensive searchable data
  const searchableData = useMemo(() => [
    // === PÁGINAS PRINCIPALES ===
    { type: 'page', title: 'Dashboard', path: '/', icon: Home, description: 'Panel principal con métricas y resúmenes', category: 'Principal' },
    { type: 'page', title: 'Asistente AI', path: '/ai-assistant', icon: Brain, description: 'Asistente inteligente para consultas', category: 'Principal' },
    
    // === VENTAS & POS ===
    { type: 'page', title: 'Punto de Venta', path: '/pos', icon: ShoppingCart, description: 'Sistema POS para ventas directas', category: 'Ventas' },
    { type: 'page', title: 'Ventas', path: '/sales', icon: DollarSign, description: 'Gestión de ventas y facturas', category: 'Ventas' },
    { type: 'page', title: 'Tienda Web', path: '/shop', icon: Store, description: 'Tienda online para clientes', category: 'Ventas' },
    { type: 'page', title: 'Entregas', path: '/deliveries', icon: Truck, description: 'Gestión de entregas y envíos', category: 'Ventas' },
    
    // === INVENTARIO ===
    { type: 'page', title: 'Stock General', path: '/stock', icon: Package, description: 'Control general de inventario', category: 'Inventario' },
    { type: 'page', title: 'Ingredientes', path: '/ingredients', icon: Package, description: 'Gestión de materias primas', category: 'Inventario' },
    { type: 'page', title: 'Transacciones', path: '/transactions', icon: History, description: 'Historial de movimientos de stock', category: 'Inventario' },
    { type: 'page', title: 'Inventario', path: '/inventory', icon: Package, description: 'Vista completa del inventario', category: 'Inventario' },
    
    // === PRODUCCIÓN ===
    { type: 'page', title: 'Recetas', path: '/recipes', icon: ChefHat, description: 'Gestión de recetas y formulaciones', category: 'Producción' },
    { type: 'page', title: 'Producción', path: '/production', icon: Factory, description: 'Gestión de producción general', category: 'Producción' },
    { type: 'page', title: 'Órdenes de Producción', path: '/production-orders', icon: Factory, description: 'Órdenes y planificación de producción', category: 'Producción' },
    { type: 'page', title: 'Asignar Lote', path: '/batch-assignment', icon: Factory, description: 'Asignación de lotes a operarios', category: 'Producción' },
    
    // === GESTIÓN ===
    { type: 'page', title: 'Productos', path: '/products', icon: Tag, description: 'Catálogo de productos terminados', category: 'Gestión' },
    { type: 'page', title: 'Proveedores', path: '/providers', icon: Users, description: 'Gestión de proveedores', category: 'Gestión' },
    { type: 'page', title: 'Tiendas', path: '/stores', icon: Store, description: 'Gestión de sucursales', category: 'Gestión' },
    { type: 'page', title: 'Usuarios Web', path: '/web-users', icon: Users, description: 'Gestión de usuarios del sistema', category: 'Gestión' },
    
    // === ANÁLISIS ===
    { type: 'page', title: 'Reportes', path: '/reports', icon: FileText, description: 'Reportes y documentos', category: 'Análisis' },
    { type: 'page', title: 'Analíticas', path: '/analytics', icon: BarChart3, description: 'Métricas y análisis avanzado', category: 'Análisis' },
    
    // === SISTEMA ===
    { type: 'page', title: 'Configuración', path: '/settings', icon: Settings, description: 'Configuración del sistema', category: 'Sistema' },
    
    // === ACCIONES RÁPIDAS ===
    { type: 'action', title: 'Nueva Venta', action: () => navigate('/pos'), icon: Zap, description: 'Abrir punto de venta', category: 'Acciones' },
    { type: 'action', title: 'Agregar Producto', action: () => navigate('/products'), icon: Zap, description: 'Crear nuevo producto', category: 'Acciones' },
    { type: 'action', title: 'Nueva Orden de Producción', action: () => navigate('/production-orders'), icon: Zap, description: 'Crear orden de producción', category: 'Acciones' },
    { type: 'action', title: 'Agregar Ingrediente', action: () => navigate('/ingredients'), icon: Zap, description: 'Registrar nuevo ingrediente', category: 'Acciones' },
    { type: 'action', title: 'Nueva Receta', action: () => navigate('/recipes'), icon: Zap, description: 'Crear nueva receta', category: 'Acciones' },
    { type: 'action', title: 'Ver Stock Bajo', action: () => navigate('/stock?filter=low'), icon: AlertTriangle, description: 'Productos con stock bajo', category: 'Alertas' },
    { type: 'action', title: 'Órdenes Pendientes', action: () => navigate('/production-orders?status=pending'), icon: AlertTriangle, description: 'Órdenes pendientes de producción', category: 'Alertas' },
    { type: 'action', title: 'Entregas del Día', action: () => navigate('/deliveries?date=today'), icon: Truck, description: 'Entregas programadas para hoy', category: 'Alertas' },
    
    // === COMANDOS DE SISTEMA ===
    { type: 'command', title: 'Cambiar Tema', action: toggleTheme, icon: Command, description: 'Alternar modo oscuro/claro', category: 'Comandos' },
    { type: 'command', title: 'Abrir Chat AI', action: openAIChat, icon: Brain, description: 'Activar asistente virtual', category: 'Comandos' },
    { type: 'command', title: 'Actualizar Datos', action: () => window.location.reload(), icon: Command, description: 'Refrescar toda la información', category: 'Comandos' },
    { type: 'command', title: 'Buscar en Todo', action: () => setQuery(''), icon: Search, description: 'Limpiar búsqueda actual', category: 'Comandos' },
    
    // === DATOS DINÁMICOS ===
    // Products
    ...(Array.isArray(products) ? products : []).map(product => ({
      type: 'product',
      title: product.name,
      path: `/products/${product.id}`,
      icon: Tag,
      description: `Precio: $${product.price} - Stock: ${product.stock || 0} unidades`,
      category: 'Productos',
      data: product
    })),
    
    // Ingredients
    ...(Array.isArray(ingredients) ? ingredients : []).map(ingredient => ({
      type: 'ingredient',
      title: ingredient.name,
      path: `/ingredients/${ingredient.id}`,
      icon: Package,
      description: `Stock: ${ingredient.current_stock || 0} ${ingredient.unit} - Proveedor: ${ingredient.supplier_name || 'N/A'}`,
      category: 'Ingredientes',
      data: ingredient
    })),
    
    // Recipes
    ...(Array.isArray(recipes) ? recipes : []).map(recipe => ({
      type: 'recipe',
      title: recipe.name,
      path: `/recipes/${recipe.id}`,
      icon: ChefHat,
      description: `Rendimiento: ${recipe.yield || 0} - Ingredientes: ${recipe.ingredients_count || 0}`,
      category: 'Recetas',
      data: recipe
    })),
    
    // Stores
    ...(Array.isArray(stores) ? stores : []).map(store => ({
      type: 'store',
      title: store.name,
      path: `/stores/${store.id}`,
      icon: Store,
      description: `${store.address} - ${store.active ? 'Activa' : 'Inactiva'}`,
      category: 'Tiendas',
      data: store
    })),
    
    // Users
    ...(Array.isArray(users) ? users : []).map(user => ({
      type: 'user',
      title: user.name,
      path: `/users/${user.id}`,
      icon: Users,
      description: `${user.role || 'Usuario'} - ${user.email || ''}`,
      category: 'Usuarios',
      data: user
    }))
  ], [products, ingredients, recipes, stores, users]);

  // Buscar en datos
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simular delay de búsqueda
    await new Promise(resolve => setTimeout(resolve, 150));

    const queryLower = searchQuery.toLowerCase();
    const filtered = searchableData.filter(item => 
      item.title.toLowerCase().includes(queryLower) ||
      item.description.toLowerCase().includes(queryLower) ||
      item.type.toLowerCase().includes(queryLower)
    );

    // Ordenar por relevancia
    const sorted = filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // Coincidencias exactas al principio
      if (aTitle === queryLower) return -1;
      if (bTitle === queryLower) return 1;
      
      // Coincidencias que empiezan con la query
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
      if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;
      
      // Por tipo: páginas, luego acciones, luego productos, luego comandos
      const typeOrder = { page: 0, action: 1, product: 2, command: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    setResults(sorted.slice(0, 10));
    setIsLoading(false);
  };

  // Manejar búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Manejar selección
  const handleSelect = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  // Manejar teclas globales
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'page': return BarChart3;
      case 'action': return Zap;
      case 'product': return Package;
      case 'command': return Command;
      default: return Search;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'page': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'action': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'product': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'command': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'page': return 'Página';
      case 'action': return 'Acción';
      case 'product': return 'Producto';
      case 'command': return 'Comando';
      default: return 'Resultado';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Search size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Búsqueda Global</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Busca páginas, productos, acciones y comandos
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search 
                  size={20} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Escribe para buscar..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                  autoComplete="off"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="text-center py-8">
                  <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron resultados para "{query}"
                  </p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="p-2">
                  {results.map((item, index) => {
                    const IconComponent = getTypeIcon(item.type);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex-shrink-0">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <IconComponent size={20} className="text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {item.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                              {getTypeName(item.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {item.description}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            Enter
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!query && (
                <div className="p-4">
                  <div className="text-center py-4">
                    <Command size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      Comienza a escribir para buscar
                    </p>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>• Usa <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</kbd> para abrir búsqueda</p>
                      <p>• Busca páginas, productos, acciones y comandos</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>↑↓ navegar • Enter seleccionar • Esc cerrar</span>
                {results.length > 0 && (
                  <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;