import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
  Star,
  Leaf,
  AlertCircle
} from 'lucide-react';

const FlavorCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week o month
  
  // Sabores disponibles (esto vendría de la base de datos)
  const allFlavors = [
    { id: 1, name: 'Chocolate Belga', type: 'Clásico', vegan: false },
    { id: 2, name: 'Vainilla Madagascar', type: 'Clásico', vegan: false },
    { id: 3, name: 'Dulce de Leche', type: 'Clásico', vegan: false },
    { id: 4, name: 'Frutilla Natural', type: 'Frutal', vegan: true },
    { id: 5, name: 'Limón Siciliano', type: 'Frutal', vegan: true },
    { id: 6, name: 'Pistacho', type: 'Premium', vegan: false },
    { id: 7, name: 'Maracuyá', type: 'Frutal', vegan: true },
    { id: 8, name: 'Cookies & Cream', type: 'Especial', vegan: false },
    { id: 9, name: 'Coco Rallado', type: 'Tropical', vegan: true },
    { id: 10, name: 'Banana Split', type: 'Especial', vegan: false },
    { id: 11, name: 'Menta Granizada', type: 'Refrescante', vegan: true },
    { id: 12, name: 'Tiramisú', type: 'Premium', vegan: false }
  ];
  
  // Generar calendario de sabores (simulado - en producción vendría del backend)
  const generateFlavorSchedule = (date) => {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    // Lógica simple: rotar sabores basándose en el día
    const baseIndex = (dayOfMonth + dayOfWeek) % allFlavors.length;
    const flavorCount = 8; // Número de sabores disponibles por día
    
    const flavors = [];
    for (let i = 0; i < flavorCount; i++) {
      flavors.push(allFlavors[(baseIndex + i) % allFlavors.length]);
    }
    
    // Agregar sabor especial los fines de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      flavors.push({ 
        id: 99, 
        name: 'Sabor Sorpresa del Chef', 
        type: 'Exclusivo', 
        vegan: false,
        special: true 
      });
    }
    
    return flavors;
  };
  
  // Obtener días de la semana
  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    
    return week;
  };
  
  // Navegación de fechas
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };
  
  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('es-AR', options);
  };
  
  const weekDays = getWeekDays(currentDate);
  const selectedFlavors = generateFlavorSchedule(selectedDate);
  
  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-yellow-100 px-4 py-2 rounded-full mb-4">
            <Calendar className="h-5 w-5 text-orange-600" />
            <span className="text-orange-700 font-medium">Calendario de Sabores</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Descubrí los sabores de
            <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent"> cada día</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Planificá tu visita conociendo qué sabores estarán disponibles
          </p>
        </motion.div>
        
        {/* Navegación de semana */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              
              <h3 className="text-white font-semibold text-lg">
                {weekDays[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Días de la semana */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-6">
              {weekDays.map((day, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isSameDay(day, selectedDate)
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                      : isToday(day)
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="text-xs font-medium">
                    {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                  </p>
                  <p className="text-2xl font-bold">{day.getDate()}</p>
                  {isToday(day) && (
                    <p className="text-xs mt-1">Hoy</p>
                  )}
                </motion.button>
              ))}
            </div>
            
            {/* Sabores del día seleccionado */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Sabores del {formatDate(selectedDate)}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Disponibles todo el día</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="wait">
                  {selectedFlavors.map((flavor, index) => (
                    <motion.div
                      key={`${selectedDate}-${flavor.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border-2 ${
                        flavor.special 
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      } transition-all`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            {flavor.name}
                            {flavor.special && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{flavor.type}</p>
                        </div>
                        {flavor.vegan && (
                          <div className="bg-green-100 p-1.5 rounded-lg" title="Opción vegana">
                            <Leaf className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      {flavor.special && (
                        <p className="text-xs text-orange-600 mt-2">
                          ¡Solo fines de semana!
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Información adicional */}
              <div className="mt-6 bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> Los sabores pueden variar según disponibilidad. 
                    Te recomendamos llamar al 11-1234-5678 para confirmar tu sabor favorito.
                  </span>
                </p>
              </div>
              
              {/* Leyenda */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded"></div>
                  <span className="text-gray-600">Sabor especial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Opción vegana</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-600">Sujeto a disponibilidad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlavorCalendar;