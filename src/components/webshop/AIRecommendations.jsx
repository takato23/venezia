import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Clock, 
  Sun, 
  CloudRain,
  Heart,
  Coffee,
  Moon,
  Zap,
  RefreshCw
} from 'lucide-react';

const AIRecommendations = ({ onProductSelect, userPreferences = {} }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({
    timeOfDay: '',
    weather: '',
    mood: '',
    season: ''
  });
  
  // Detectar contexto del usuario
  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDay = 'tarde';
    if (hour < 12) timeOfDay = 'mañana';
    else if (hour < 18) timeOfDay = 'tarde';
    else timeOfDay = 'noche';
    
    // Simular detección de clima (en producción usaríamos una API)
    const weather = ['soleado', 'nublado', 'lluvioso'][Math.floor(Math.random() * 3)];
    
    // Detectar estación
    const month = new Date().getMonth();
    let season = 'verano';
    if (month >= 3 && month <= 5) season = 'otoño';
    else if (month >= 6 && month <= 8) season = 'invierno';
    else if (month >= 9 && month <= 11) season = 'primavera';
    
    setContext({ timeOfDay, weather, season, mood: 'feliz' });
  }, []);
  
  // Generar recomendaciones basadas en contexto
  useEffect(() => {
    generateRecommendations();
  }, [context]);
  
  const generateRecommendations = () => {
    setLoading(true);
    
    // Simular IA generando recomendaciones
    setTimeout(() => {
      const recs = [];
      
      // Recomendación por hora del día
      if (context.timeOfDay === 'mañana') {
        recs.push({
          id: 1,
          type: 'time',
          icon: Coffee,
          title: 'Despertar Perfecto',
          description: 'Café Espresso Italiano con un toque de caramelo',
          reason: 'Ideal para empezar el día con energía',
          product: { name: 'Espresso Caramel', price: 450, category: 'Helados' },
          confidence: 95
        });
      } else if (context.timeOfDay === 'tarde') {
        recs.push({
          id: 2,
          type: 'time',
          icon: Sun,
          title: 'Refrescante Tarde',
          description: 'Sorbete de Limón con Menta fresca',
          reason: 'Perfecto para combatir el calor de la tarde',
          product: { name: 'Limón Menta', price: 380, category: 'Sorbetes' },
          confidence: 88
        });
      } else {
        recs.push({
          id: 3,
          type: 'time',
          icon: Moon,
          title: 'Dulce Noche',
          description: 'Chocolate Belga 70% con Brownies',
          reason: 'El postre perfecto para cerrar el día',
          product: { name: 'Chocolate Supreme', price: 520, category: 'Helados' },
          confidence: 92
        });
      }
      
      // Recomendación por clima
      if (context.weather === 'soleado') {
        recs.push({
          id: 4,
          type: 'weather',
          icon: Sun,
          title: 'Día Soleado',
          description: 'Tropical Mix: Mango, Maracuyá y Coco',
          reason: 'Sabores tropicales para un día radiante',
          product: { name: 'Tropical Paradise', price: 420, category: 'Sorbetes' },
          confidence: 90
        });
      } else if (context.weather === 'lluvioso') {
        recs.push({
          id: 5,
          type: 'weather',
          icon: CloudRain,
          title: 'Día Lluvioso',
          description: 'Dulce de Leche con Cookies caseras',
          reason: 'Comfort food para días grises',
          product: { name: 'Dulce Comfort', price: 480, category: 'Helados' },
          confidence: 87
        });
      }
      
      // Recomendación trending
      recs.push({
        id: 6,
        type: 'trending',
        icon: TrendingUp,
        title: 'Lo Más Pedido',
        description: 'Pistacho Siciliano - El favorito de la semana',
        reason: '⭐ 4.9/5 - Elegido por el 73% de nuestros clientes',
        product: { name: 'Pistacho Premium', price: 550, category: 'Helados' },
        confidence: 98
      });
      
      // Recomendación personalizada
      recs.push({
        id: 7,
        type: 'personal',
        icon: Heart,
        title: 'Hecho Para Ti',
        description: 'Frutos Rojos Silvestres - Basado en tus gustos',
        reason: 'Sabemos que te encantan los sabores frutales y naturales',
        product: { name: 'Berry Blast', price: 410, category: 'Sorbetes' },
        confidence: 85
      });
      
      setRecommendations(recs);
      setLoading(false);
    }, 1500);
  };
  
  const getIconColor = (type) => {
    switch(type) {
      case 'time': return 'text-blue-500';
      case 'weather': return 'text-orange-500';
      case 'trending': return 'text-green-500';
      case 'personal': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full mb-4">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700 font-medium">Recomendaciones con IA</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Tu helado perfecto,
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> ahora mismo</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Nuestra IA analiza el momento, el clima y tus preferencias para sugerirte el sabor ideal
          </p>
        </motion.div>
        
        {/* Contexto actual */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 capitalize">{context.timeOfDay}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            {context.weather === 'soleado' ? <Sun className="h-4 w-4 text-yellow-500" /> : 
             context.weather === 'lluvioso' ? <CloudRain className="h-4 w-4 text-blue-500" /> :
             <Sun className="h-4 w-4 text-gray-400" />}
            <span className="text-sm text-gray-700 capitalize">{context.weather}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <Zap className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-700 capitalize">{context.season}</span>
          </div>
        </motion.div>
        
        {/* Botón de regenerar */}
        <div className="text-center mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateRecommendations}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-medium">Nuevas recomendaciones</span>
          </motion.button>
        </div>
        
        {/* Grid de recomendaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="wait">
            {loading ? (
              // Loading skeleton
              [...Array(4)].map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </motion.div>
              ))
            ) : (
              recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => onProductSelect(rec.product)}
                  >
                    {/* Confidence indicator */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${getIconColor(rec.type)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Confianza</div>
                        <div className="text-sm font-bold text-green-600">{rec.confidence}%</div>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-1">{rec.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-3">{rec.reason}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-pink-600">
                          ${rec.product.price}
                        </span>
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="text-sm text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Ver más →
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Sparkle animation on hover */}
                    <motion.div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                    </motion.div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default AIRecommendations;