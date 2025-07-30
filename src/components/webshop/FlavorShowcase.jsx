import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Info } from 'lucide-react';

const flavors = [
  {
    id: 1,
    name: 'Pistacho Siciliano',
    description: 'Auténtico pistacho de Sicilia con un toque de sal marina',
    color: 'from-green-300 to-green-500',
    ingredients: ['Pistachos sicilianos', 'Crema de leche', 'Azúcar orgánica', 'Sal marina'],
    calories: 180,
    tags: ['Premium', 'Sin Gluten']
  },
  {
    id: 2,
    name: 'Chocolate Belga 70%',
    description: 'Intenso chocolate belga con chips de cacao',
    color: 'from-amber-700 to-amber-900',
    ingredients: ['Chocolate belga 70%', 'Cacao en polvo', 'Leche entera', 'Vainilla'],
    calories: 220,
    tags: ['Bestseller', 'Intenso']
  },
  {
    id: 3,
    name: 'Frutos Rojos Silvestres',
    description: 'Mix de frutos rojos frescos con un toque de menta',
    color: 'from-pink-400 to-red-500',
    ingredients: ['Frutillas', 'Frambuesas', 'Arándanos', 'Menta fresca'],
    calories: 150,
    tags: ['Vegano', 'Sin Azúcar']
  },
  {
    id: 4,
    name: 'Dulce de Leche Granizado',
    description: 'Clásico dulce de leche argentino con cookies',
    color: 'from-yellow-400 to-orange-500',
    ingredients: ['Dulce de leche', 'Cookies caseras', 'Crema', 'Caramelo'],
    calories: 240,
    tags: ['Favorito', 'Argentino']
  },
  {
    id: 5,
    name: 'Matcha Ceremonial',
    description: 'Té matcha japonés premium con leche de almendras',
    color: 'from-green-400 to-emerald-600',
    ingredients: ['Matcha ceremonial', 'Leche de almendras', 'Miel orgánica'],
    calories: 160,
    tags: ['Vegano', 'Energizante']
  }
];

const FlavorShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };
  
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };
  
  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = flavors.length - 1;
      if (nextIndex >= flavors.length) nextIndex = 0;
      return nextIndex;
    });
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700 font-medium">Sabores Exclusivos</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Descubre nuestros
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"> sabores estrella</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Cada sabor es una experiencia única, creada con los mejores ingredientes
          </p>
        </motion.div>
        
        <div className="relative h-[600px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute w-full max-w-4xl"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-2">
                  {/* Visual del sabor */}
                  <div className={`h-96 md:h-full bg-gradient-to-br ${flavors[currentIndex].color} relative overflow-hidden`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="w-64 h-64 bg-white/20 rounded-full blur-3xl"
                      />
                    </div>
                    <div className="relative z-10 h-full flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="text-white text-center"
                      >
                        <div className="text-8xl mb-4">🍨</div>
                        <h3 className="text-3xl font-bold">{flavors[currentIndex].name}</h3>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Información del sabor */}
                  <div className="p-8 md:p-12">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex flex-wrap gap-2 mb-6">
                        {flavors[currentIndex].tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        {flavors[currentIndex].name}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 text-lg">
                        {flavors[currentIndex].description}
                      </p>
                      
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Info className="h-5 w-5 text-purple-600" />
                          Ingredientes principales
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {flavors[currentIndex].ingredients.map((ingredient, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                              className="flex items-center gap-2"
                            >
                              <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" />
                              <span className="text-sm text-gray-600">{ingredient}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t">
                        <div>
                          <p className="text-sm text-gray-500">Calorías por porción</p>
                          <p className="text-2xl font-bold text-gray-800">{flavors[currentIndex].calories} cal</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
                        >
                          Ordenar ahora
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Controles de navegación */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        
        {/* Indicadores */}
        <div className="flex justify-center gap-2 mt-8">
          {flavors.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`transition-all ${
                index === currentIndex
                  ? 'w-8 h-2 bg-gradient-to-r from-pink-500 to-purple-600'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              } rounded-full`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlavorShowcase;