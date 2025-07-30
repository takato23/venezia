import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'María García',
    avatar: 'https://source.unsplash.com/100x100/?portrait,woman,1',
    rating: 5,
    text: 'Los mejores helados de la ciudad! El sabor a pistacho es increíble, se nota que usan ingredientes de primera calidad. Mi familia y yo somos clientes hace años.',
    date: 'Hace 2 semanas',
    verified: true
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    avatar: 'https://source.unsplash.com/100x100/?portrait,man,2',
    rating: 5,
    text: 'Excelente atención y sabores únicos. El helado de dulce de leche con brownies es espectacular. Además tienen opciones veganas muy ricas.',
    date: 'Hace 1 mes',
    verified: true
  },
  {
    id: 3,
    name: 'Ana Martínez',
    avatar: 'https://source.unsplash.com/100x100/?portrait,woman,3',
    rating: 5,
    text: 'Me encanta que tengan opciones sin azúcar que realmente saben bien. El servicio de delivery siempre llega a tiempo y bien empacado.',
    date: 'Hace 3 semanas',
    verified: true
  },
  {
    id: 4,
    name: 'Diego López',
    avatar: 'https://source.unsplash.com/100x100/?portrait,man,4',
    rating: 5,
    text: 'Pedimos helado para un evento y fue un éxito total. Muy profesionales y los sabores son artesanales de verdad. 100% recomendable.',
    date: 'Hace 2 meses',
    verified: true
  },
  {
    id: 5,
    name: 'Lucía Fernández',
    avatar: 'https://source.unsplash.com/100x100/?portrait,woman,5',
    rating: 5,
    text: 'Los helados más cremosos que he probado! Mi favorito es el de chocolate belga. El local es hermoso y siempre está impecable.',
    date: 'Hace 1 semana',
    verified: true
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };
  
  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            Lo que dicen nuestros
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"> clientes</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Miles de personas disfrutan nuestros helados cada día
          </p>
        </motion.div>
        
        <div className="relative">
          {/* Testimonial principal */}
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonials[currentIndex].id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 md:p-12 relative"
              >
                <Quote className="absolute top-4 left-4 h-12 w-12 text-pink-200" />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <img
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {testimonials[currentIndex].name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        {testimonials[currentIndex].verified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Cliente verificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    "{testimonials[currentIndex].text}"
                  </p>
                  
                  <p className="text-sm text-gray-500">
                    {testimonials[currentIndex].date}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Controles */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prev}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </motion.button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-gradient-to-r from-pink-500 to-purple-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={next}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </motion.button>
            </div>
          </div>
          
          {/* Mini testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;