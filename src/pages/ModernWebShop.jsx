import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  Heart,
  Plus,
  Minus,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  List,
  Sparkles,
  Leaf,
  Award,
  MessageCircle,
  ArrowRight,
  Check,
  Info,
  Truck,
  Store,
  Camera,
  Settings
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Checkout from '../components/webshop/Checkout';
import InstagramFeed from '../components/webshop/InstagramFeed';
import Testimonials from '../components/webshop/Testimonials';
import WhatsAppButton from '../components/webshop/WhatsAppButton';
import ProcessSection from '../components/webshop/ProcessSection';
import Confetti from '../components/webshop/Confetti';
import FlavorShowcase from '../components/webshop/FlavorShowcase';
import AIRecommendations from '../components/webshop/AIRecommendations';
import ARExperience from '../components/webshop/ARExperience';
import StoreMap3D from '../components/webshop/StoreMap3D';
import SimpleLoyalty from '../components/webshop/SimpleLoyalty';
import SimpleConfig from '../components/webshop/SimpleConfig';
import AccessibilityBar from '../components/webshop/AccessibilityBar';
import MobileOptimized, { OptimizedImage } from '../components/webshop/MobileOptimized';
import WhatsAppOrder from '../components/webshop/WhatsAppOrder';
import FlavorCalendar from '../components/webshop/FlavorCalendar';
import PriceCalculator from '../components/webshop/PriceCalculator';

const ModernWebShop = () => {
  const { success, error: showError, info } = useToast();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [shopConfig, setShopConfig] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sortBy, setSortBy] = useState('featured');
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showARExperience, setShowARExperience] = useState(false);
  const [arProduct, setARProduct] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [userPoints, setUserPoints] = useState(75); // Simulación de puntos del usuario
  const [showWhatsAppOrder, setShowWhatsAppOrder] = useState(false);
  
  // Referencias
  const heroRef = useRef(null);
  const productsRef = useRef(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    loadShopData();
    loadCartFromStorage();
    loadFavoritesFromStorage();
    
    // Escuchar evento para abrir WhatsApp Order
    const handleOpenWhatsAppOrder = () => {
      setShowWhatsAppOrder(true);
    };
    
    window.addEventListener('openWhatsAppOrder', handleOpenWhatsAppOrder);
    
    return () => {
      window.removeEventListener('openWhatsAppOrder', handleOpenWhatsAppOrder);
    };
  }, []);
  
  // Filtrar y ordenar productos
  useEffect(() => {
    filterAndSortProducts();
  }, [selectedCategory, searchTerm, products, priceRange, sortBy]);
  
  const loadShopData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, configRes] = await Promise.all([
        fetch('/api/public/shop/products'),
        fetch('/api/public/shop/config')
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        const activeProducts = data.products?.filter(p => p.isActive) || [];
        setProducts(activeProducts);
        
        const uniqueCategories = [...new Set(activeProducts.map(p => p.product?.category || p.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }
      
      if (configRes.ok) {
        const data = await configRes.json();
        setShopConfig(data.config || {});
      }
    } catch (error) {
      showError('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };
  
  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('venezia_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };
  
  const loadFavoritesFromStorage = () => {
    const savedFavorites = localStorage.getItem('venezia_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };
  
  const saveCartToStorage = (cartItems) => {
    localStorage.setItem('venezia_cart', JSON.stringify(cartItems));
  };
  
  const saveFavoritesToStorage = (favoriteItems) => {
    localStorage.setItem('venezia_favorites', JSON.stringify(favoriteItems));
  };
  
  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        (p.product?.category || p.category) === selectedCategory
      );
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const productName = (p.product?.name || p.name || '').toLowerCase();
        const productDescription = (p.webDescription || p.description || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return productName.includes(searchLower) || productDescription.includes(searchLower);
      });
    }
    
    // Filtrar por rango de precio
    filtered = filtered.filter(p => {
      const price = p.webPrice || p.price || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Ordenar
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.webPrice || a.price || 0) - (b.webPrice || b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.webPrice || b.price || 0) - (a.webPrice || a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.product?.name || a.name || '').localeCompare(b.product?.name || b.name || ''));
        break;
      default:
        break;
    }
    
    setFilteredProducts(filtered);
  };
  
  const addToCart = (product, quantity = 1) => {
    const newCart = [...cart];
    const existingItem = newCart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      newCart.push({
        ...product,
        quantity
      });
    }
    
    setCart(newCart);
    saveCartToStorage(newCart);
    success('Agregado al carrito', `${product.product?.name || product.name} x${quantity}`);
    
    // Activar confetti
    setConfettiTrigger(prev => prev + 1);
    
    // Vibración en móvil
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };
  
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    
    setCart(newCart);
    saveCartToStorage(newCart);
  };
  
  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    saveCartToStorage(newCart);
    info('Producto eliminado', 'Producto eliminado del carrito');
  };
  
  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    saveFavoritesToStorage(newFavorites);
  };
  
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.webPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const handleOrderComplete = (order) => {
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
  };
  
  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando deliciosos helados...</p>
        </motion.div>
      </div>
    );
  }
  
  // Si estamos en checkout
  if (showCheckout && cart.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Checkout
            cart={cart}
            shopConfig={shopConfig}
            onBack={() => setShowCheckout(false)}
            onOrderComplete={handleOrderComplete}
          />
        </div>
      </div>
    );
  }
  
  return (
    <MobileOptimized>
      <div className="min-h-screen bg-white">
        {/* Accessibility Bar */}
        <AccessibilityBar />
        
        {/* Header moderno y minimalista */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Venezia
                </h1>
                <p className="text-xs text-gray-500">Gelato Artesanal</p>
              </div>
            </motion.div>
            
            {/* Navegación central */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={scrollToProducts}
                className="text-gray-700 hover:text-pink-600 transition-colors font-medium"
              >
                Productos
              </button>
              <a href="#about" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
                Nosotros
              </a>
              <a href="#location" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
                Ubicación
              </a>
            </nav>
            
            {/* Acciones */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
              >
                <Search className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {getCartItemsCount()}
                  </motion.span>
                )}
              </motion.button>
              
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://cdn.pixabay.com/vimeo/458843091/ice-cream-49514.mp4?width=1280&hash=8a4e8d8c8f5e8a9b9c8d8e8f8g8h8i8j8k8l8m8n" type="video/mp4" />
          </video>
          {/* Fallback gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          </div>
        </div>
        
        {/* Formas decorativas animadas */}
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        
        {/* Contenido del Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent gradient-text-animated">
                Helados que
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent gradient-text-animated">
                cuentan historias
              </span>
            </motion.h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Sabores artesanales únicos, creados con pasión y los mejores ingredientes naturales
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToProducts}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ver Productos
                <ArrowRight className="inline-block ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-gray-800 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all border border-gray-200"
              >
                <MessageCircle className="inline-block mr-2 h-5 w-5" />
                WhatsApp
              </motion.button>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg"
              >
                <Sparkles className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Premium</p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg"
              >
                <Leaf className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Natural</p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg"
              >
                <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Artesanal</p>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg"
              >
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Con Amor</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronLeft className="h-8 w-8 text-gray-400 rotate-90" />
        </motion.div>
      </section>
      
      {/* Barra de búsqueda y filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sticky top-20 z-40 bg-white border-b border-gray-100 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar sabores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    />
                  </div>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-low">Menor precio</option>
                  <option value="price-high">Mayor precio</option>
                  <option value="name">Nombre A-Z</option>
                </select>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Categorías */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Categorías</h2>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              Ver todas
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.button
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory('all')}
              className={`relative overflow-hidden rounded-2xl p-6 text-center transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:shadow-md'
              }`}
            >
              <div className="text-3xl mb-2">🍨</div>
              <p className="font-semibold">Todos</p>
              <p className="text-xs opacity-75">{products.length} productos</p>
            </motion.button>
            
            {categories.map((category, index) => {
              const icons = {
                'Helados': '🍦',
                'Sorbetes': '🍧',
                'Postres': '🍰',
                'Especiales': '✨'
              };
              
              return (
                <motion.button
                  key={category}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`relative overflow-hidden rounded-2xl p-6 text-center transition-all ${
                    selectedCategory === category 
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-white text-gray-700 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">{icons[category] || '🍨'}</div>
                  <p className="font-semibold">{category}</p>
                  <p className="text-xs opacity-75">
                    {products.filter(p => (p.product?.category || p.category) === category).length} productos
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Productos */}
      <section ref={productsRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Nuestros Productos
          </motion.h2>
          
          {filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No encontramos productos
              </h3>
              <p className="text-gray-500">
                Intenta con otra búsqueda o categoría
              </p>
            </motion.div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    viewMode={viewMode}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                    onAddToCart={addToCart}
                    onViewDetails={() => setSelectedProduct(product)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
      
      {/* Modal de producto */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={addToCart}
            isFavorite={favorites.includes(selectedProduct.id)}
            onToggleFavorite={() => toggleFavorite(selectedProduct.id)}
            onShowAR={(product) => {
              setARProduct(product);
              setShowARExperience(true);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Carrito */}
      <AnimatePresence>
        {showCart && (
          <Cart
            cart={cart}
            showCart={showCart}
            onClose={() => setShowCart(false)}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={() => setShowCheckout(true)}
            shopConfig={shopConfig}
          />
        )}
      </AnimatePresence>
      
      {/* Instagram Feed */}
      <InstagramFeed />
      
      {/* Simple Loyalty Program */}
      <SimpleLoyalty userPoints={userPoints} />
      
      {/* Price Calculator */}
      <PriceCalculator 
        products={products}
        onAddToCart={addToCart}
      />
      
      {/* Flavor Calendar */}
      <FlavorCalendar />
      
      {/* Testimonials */}
      <Testimonials />
      
      {/* Flavor Showcase */}
      <FlavorShowcase />
      
      {/* AI Recommendations */}
      <AIRecommendations 
        onProductSelect={(product) => {
          const productData = products.find(p => 
            (p.product?.name || p.name) === product.name
          );
          if (productData) {
            setSelectedProduct(productData);
          }
        }}
        userPreferences={{}}
      />
      
      {/* Process Section */}
      <ProcessSection />
      
      {/* Store Map 3D */}
      <StoreMap3D />
      
      {/* WhatsApp Button */}
      <WhatsAppButton phoneNumber="5491123456789" />
      
      {/* Confetti Effect */}
      <Confetti trigger={confettiTrigger} />
      
      {/* AR Experience */}
      <AnimatePresence>
        {showARExperience && arProduct && (
          <ARExperience 
            product={arProduct}
            onClose={() => {
              setShowARExperience(false);
              setARProduct(null);
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <SimpleConfig 
            onClose={() => setShowConfig(false)}
          />
        )}
      </AnimatePresence>
      
      {/* WhatsApp Order */}
      <WhatsAppOrder 
        cart={cart}
        isOpen={showWhatsAppOrder}
        onClose={() => setShowWhatsAppOrder(false)}
        shopConfig={shopConfig}
      />
      
      {/* Floating Config Button (for employees) */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConfig(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30 group"
        title="Configuración (Solo empleados)"
      >
        <Settings className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Configuración
        </span>
      </motion.button>
      
      {/* Footer moderno */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">V</span>
                </div>
                <h3 className="text-xl font-bold">Venezia Gelato</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Creando momentos dulces desde 1985. Helados artesanales con los mejores ingredientes.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <a href="#" className="flex items-center hover:text-white transition-colors">
                  <Phone className="h-4 w-4 mr-2" />
                  {shopConfig.storePhone}
                </a>
                <a href="#" className="flex items-center hover:text-white transition-colors">
                  <Mail className="h-4 w-4 mr-2" />
                  {shopConfig.storeEmail}
                </a>
                <a href="#" className="flex items-center hover:text-white transition-colors">
                  <MapPin className="h-4 w-4 mr-2" />
                  {shopConfig.storeAddress}
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Horarios</h4>
              <div className="space-y-1 text-gray-400 text-sm">
                <p>Lun - Jue: 12:00 - 23:00</p>
                <p>Vie - Sáb: 12:00 - 00:00</p>
                <p>Domingo: 11:00 - 23:00</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </motion.a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Venezia Gelato. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
      </div>
    </MobileOptimized>
  );
};

// Componente de tarjeta de producto
const ProductCard = ({ product, index, viewMode, isFavorite, onToggleFavorite, onAddToCart, onViewDetails }) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-4 flex gap-4"
      >
        <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <OptimizedImage 
            src={`https://source.unsplash.com/400x400/?ice-cream,${product.product?.name || product.name}`}
            alt={product.product?.name || product.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {product.product?.name || product.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {product.webDescription || product.description || 'Delicioso helado artesanal'}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-2xl font-bold text-pink-600">
              ${(product.webPrice || product.price || 0).toFixed(2)}
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAddToCart(product, 1)}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
              >
                Agregar
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all overflow-hidden"
    >
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
        {/* Imagen de producto */}
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: imageLoaded ? 1 : 1.2, opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <OptimizedImage
            src={`https://source.unsplash.com/400x400/?ice-cream,${product.product?.name || product.name}`}
            alt={product.product?.name || product.name}
            onLoad={() => setImageLoaded(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </motion.div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isFeatured && (
            <motion.div
              initial={{ x: -50 }}
              animate={{ x: 0 }}
              className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg"
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              Destacado
            </motion.div>
          )}
          {(product.product?.name || product.name || '').toLowerCase().includes('vegan') && (
            <motion.div
              initial={{ x: -50 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
            >
              🌱 Vegano
            </motion.div>
          )}
        </div>
        
        {/* Botón favorito */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </motion.button>
        
        {/* Quick view */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={onViewDetails}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="bg-white text-gray-800 px-6 py-3 rounded-full font-semibold">
            Ver detalles
          </span>
        </motion.button>
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-xl text-gray-800 mb-2">
          {product.product?.name || product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.webDescription || product.description || 'Elaborado con ingredientes premium'}
        </p>
        
        {/* Tamaños */}
        {(product.product?.category || product.category) === 'Helados' && (
          <div className="flex gap-2 mb-4">
            {['1/4 kg', '1/2 kg', '1 kg'].map((size) => (
              <span key={size} className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                {size}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Desde</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              ${(product.webPrice || product.price || 0).toFixed(2)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-3 font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAddToCart(product, quantity)}
              className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Modal de producto
const ProductModal = ({ product, onClose, onAddToCart, isFavorite, onToggleFavorite, onShowAR }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('1/2 kg');
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="grid md:grid-cols-2">
          {/* Imagen */}
          <div className="h-96 md:h-full relative overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100">
            <OptimizedImage
              src={`https://source.unsplash.com/800x800/?ice-cream,${product.product?.name || product.name}`}
              alt={product.product?.name || product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Información */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {product.product?.name || product.name}
                </h2>
                <p className="text-gray-600">
                  {product.product?.category || product.category}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleFavorite}
                className="p-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </motion.button>
            </div>
            
            <p className="text-gray-600 mb-6">
              {product.webDescription || product.description || 'Elaborado artesanalmente con los mejores ingredientes naturales. Cada cucharada es una experiencia única.'}
            </p>
            
            {/* Características */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">100% Natural</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Sin conservantes</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Ingredientes premium</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Hecho a diario</span>
              </div>
            </div>
            
            {/* Tamaños */}
            {(product.product?.category || product.category) === 'Helados' && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Elige el tamaño:</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['1/4 kg', '1/2 kg', '1 kg'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cantidad y precio */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Precio</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ${(product.webPrice || product.price || 0).toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="px-4 font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Agregar al carrito
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onShowAR(product);
                  onClose();
                }}
                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all"
                title="Ver en Realidad Aumentada"
              >
                <Camera className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente del carrito
const Cart = ({ cart, showCart, onClose, onUpdateQuantity, onRemoveItem, onCheckout, shopConfig }) => {
  const getTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.webPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      
      {/* Carrito */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Mi Carrito</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6">Tu carrito está vacío</p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="mb-6 pb-6 border-b last:border-0"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <OptimizedImage
                        src={`https://source.unsplash.com/200x200/?ice-cream,${item.product?.name || item.name}`}
                        alt={item.product?.name || item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {item.product?.name || item.name}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        ${(item.webPrice || item.price || 0).toFixed(2)} c/u
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-gray-100 rounded-full">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Footer con total */}
        {cart.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Subtotal:</span>
              <span className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                ${getTotal().toFixed(2)}
              </span>
            </div>
            
            {shopConfig.deliveryEnabled && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Delivery disponible • Mínimo: ${shopConfig.minimumOrderAmount || 0}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose();
                  // Aquí iría el código para mostrar WhatsAppOrder
                  const event = new CustomEvent('openWhatsAppOrder');
                  window.dispatchEvent(event);
                }}
                className="py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCheckout}
                className="py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Pagar online
              </motion.button>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ModernWebShop;