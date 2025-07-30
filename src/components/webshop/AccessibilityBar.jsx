import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye,
  Minus,
  Plus,
  Type,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Accessibility,
  X
} from 'lucide-react';

const AccessibilityBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100); // Porcentaje
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Aplicar cambios de accesibilidad
  useEffect(() => {
    // Tamaño de fuente
    document.documentElement.style.fontSize = `${fontSize}%`;
    
    // Alto contraste
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Reducir movimiento
    if (reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
    
    // Guardar preferencias
    localStorage.setItem('accessibility', JSON.stringify({
      fontSize,
      highContrast,
      reducedMotion
    }));
  }, [fontSize, highContrast, reducedMotion]);
  
  // Cargar preferencias guardadas
  useEffect(() => {
    const saved = localStorage.getItem('accessibility');
    if (saved) {
      const prefs = JSON.parse(saved);
      setFontSize(prefs.fontSize || 100);
      setHighContrast(prefs.highContrast || false);
      setReducedMotion(prefs.reducedMotion || false);
    }
  }, []);
  
  const resetSettings = () => {
    setFontSize(100);
    setHighContrast(false);
    setReducedMotion(false);
  };
  
  return (
    <>
      {/* Botón de accesibilidad */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:shadow-xl transition-all z-40 group"
        aria-label="Opciones de accesibilidad"
      >
        <Accessibility className="h-6 w-6 text-gray-700" />
        <span className="absolute right-full mr-3 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Accesibilidad
        </span>
      </motion.button>
      
      {/* Panel de accesibilidad */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50"
            >
              <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Accessibility className="h-6 w-6" />
                    Accesibilidad
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Cerrar panel"
                  >
                    <X className="h-6 w-6 text-gray-600" />
                  </button>
                </div>
                
                {/* Controles */}
                <div className="flex-1 space-y-6">
                  {/* Tamaño de texto */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Tamaño del texto
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setFontSize(Math.max(75, fontSize - 10))}
                        className="w-12 h-12 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                        aria-label="Reducir tamaño de texto"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{fontSize}%</p>
                        <p className="text-sm text-gray-600">Tamaño actual</p>
                      </div>
                      
                      <button
                        onClick={() => setFontSize(Math.min(150, fontSize + 10))}
                        className="w-12 h-12 bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                        aria-label="Aumentar tamaño de texto"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[75, 100, 125, 150].map((size) => (
                        <button
                          key={size}
                          onClick={() => setFontSize(size)}
                          className={`py-2 rounded-lg font-medium transition-all ${
                            fontSize === size
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {size}%
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Alto contraste */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          {highContrast ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                          Alto contraste
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Mejora la visibilidad con colores más definidos
                        </p>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={highContrast}
                          onChange={(e) => setHighContrast(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-14 h-7 rounded-full transition-colors ${
                          highContrast ? 'bg-purple-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                            highContrast ? 'translate-x-7' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* Reducir movimiento */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Reducir movimiento
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Minimiza las animaciones y transiciones
                        </p>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={reducedMotion}
                          onChange={(e) => setReducedMotion(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-14 h-7 rounded-full transition-colors ${
                          reducedMotion ? 'bg-purple-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                            reducedMotion ? 'translate-x-7' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* Ejemplo de vista previa */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Vista previa</h3>
                    <div className={`p-4 rounded-lg ${highContrast ? 'bg-black text-white' : 'bg-white'}`}>
                      <p className="mb-2" style={{ fontSize: `${fontSize}%` }}>
                        Este es un ejemplo de cómo se ve el texto con tu configuración actual.
                      </p>
                      <button className={`px-4 py-2 rounded font-medium ${
                        highContrast 
                          ? 'bg-white text-black' 
                          : 'bg-purple-600 text-white'
                      }`}>
                        Botón de ejemplo
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="pt-6 border-t">
                  <button
                    onClick={resetSettings}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                  >
                    Restablecer configuración
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Estilos para alto contraste */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(1.5) !important;
        }
        
        .high-contrast * {
          border-color: currentColor !important;
        }
        
        .high-contrast button,
        .high-contrast a {
          outline: 2px solid currentColor !important;
          outline-offset: 2px !important;
        }
        
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `}</style>
    </>
  );
};

export default AccessibilityBar;