import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Maximize2, 
  RotateCw, 
  Download,
  Share2,
  X,
  Smartphone,
  Move3d,
  Sparkles,
  Info,
  ChevronRight,
  Palette,
  Layers
} from 'lucide-react';

const ARExperience = ({ product, onClose }) => {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedView, setSelectedView] = useState('cone');
  const [selectedTopping, setSelectedTopping] = useState('none');
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  
  // Verificar soporte AR
  useEffect(() => {
    const checkARSupport = () => {
      // Verificar WebXR
      if ('xr' in navigator) {
        setIsARSupported(true);
      }
      // Verificar AR Quick Look en iOS
      else if (document.createElement('a').relList.supports('ar')) {
        setIsARSupported(true);
      }
      setIsLoading(false);
    };
    
    checkARSupport();
  }, []);
  
  // Simular carga del modelo 3D
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const views = [
    { id: 'cone', name: 'Cono', icon: '🍦' },
    { id: 'cup', name: 'Vaso', icon: '🥤' },
    { id: 'pint', name: 'Pote', icon: '🍨' }
  ];
  
  const toppings = [
    { id: 'none', name: 'Sin topping', color: 'transparent' },
    { id: 'chocolate', name: 'Chocolate', color: '#6B4226' },
    { id: 'caramel', name: 'Caramelo', color: '#D2691E' },
    { id: 'strawberry', name: 'Frutilla', color: '#FF69B4' },
    { id: 'sprinkles', name: 'Chispitas', color: 'rainbow' }
  ];
  
  const handleRotation = (e) => {
    if (e.type === 'mousemove' && e.buttons === 1) {
      setRotation({
        x: rotation.x + e.movementY * 0.5,
        y: rotation.y + e.movementX * 0.5
      });
    }
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setRotation({
        x: rotation.x + touch.clientY * 0.01,
        y: rotation.y + touch.clientX * 0.01
      });
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.product?.name || product.name} - Heladería`,
          text: '¡Mira este helado increíble!',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl h-[90vh] bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Vista AR - {product.product?.name || product.name}
                </h2>
                <p className="text-gray-300 text-sm">
                  Visualiza tu helado en realidad aumentada
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Instrucciones */}
          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 z-30 flex items-center justify-center p-8"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Move3d className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Controles AR
                    </h3>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <span>Arrastra para rotar el modelo</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <Camera className="h-4 w-4" />
                        </div>
                        <span>Toca "Ver en AR" para realidad aumentada</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <Palette className="h-4 w-4" />
                        </div>
                        <span>Personaliza tu helado con toppings</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Área de visualización 3D */}
          <div 
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center"
            onMouseMove={handleRotation}
            onTouchMove={handleTouchMove}
          >
            {/* Simulación del modelo 3D */}
            <motion.div
              animate={{
                rotateX: rotation.x,
                rotateY: rotation.y,
                scale: scale
              }}
              transition={{ type: "spring", stiffness: 100 }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="w-64 h-80 relative">
                {/* Base del helado */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[200px] filter drop-shadow-2xl">
                    {selectedView === 'cone' ? '🍦' : selectedView === 'cup' ? '🥤' : '🍨'}
                  </div>
                </div>
                
                {/* Efectos de brillo */}
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full blur-3xl"
                />
                
                {/* Partículas flotantes */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [-20, -60, -20],
                      x: [0, (i % 2 === 0 ? 20 : -20), 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.5,
                      repeat: Infinity
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Controles inferiores */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            {/* Selector de vista */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Tipo de presentación
              </h4>
              <div className="flex gap-3">
                {views.map((view) => (
                  <motion.button
                    key={view.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedView(view.id)}
                    className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
                      selectedView === view.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-2xl">{view.icon}</span>
                    <span className="font-medium">{view.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Selector de toppings */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Toppings
              </h4>
              <div className="flex gap-2 flex-wrap">
                {toppings.map((topping) => (
                  <motion.button
                    key={topping.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTopping(topping.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedTopping === topping.id
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {topping.name}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                onClick={() => {
                  if (isARSupported) {
                    // Aquí iría la lógica para iniciar AR real
                    alert('Función AR disponible en dispositivos compatibles');
                  }
                }}
              >
                <Camera className="h-5 w-5" />
                Ver en tu espacio
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="px-6 py-4 bg-white/10 backdrop-blur text-white rounded-full hover:bg-white/20 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScale(1)}
                className="px-6 py-4 bg-white/10 backdrop-blur text-white rounded-full hover:bg-white/20 transition-colors"
              >
                <RotateCw className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
          
          {/* Controles de zoom */}
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 space-y-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setScale(Math.min(scale + 0.2, 2))}
              className="w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <span className="text-white text-xl">+</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setScale(Math.max(scale - 0.2, 0.5))}
              className="w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <span className="text-white text-xl">−</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ARExperience;