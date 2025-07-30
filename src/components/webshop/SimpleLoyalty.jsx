import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Info } from 'lucide-react';

const SimpleLoyalty = ({ userPoints = 0 }) => {
  const pointsNeeded = 100; // Configurable desde SimpleConfig
  const pointsPerPurchase = 10; // Configurable desde SimpleConfig
  const progress = (userPoints % pointsNeeded) / pointsNeeded * 100;
  const completedRewards = Math.floor(userPoints / pointsNeeded);
  const pointsToNext = pointsNeeded - (userPoints % pointsNeeded);
  
  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          {/* Header simple */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
              <Gift className="h-5 w-5 text-purple-600" />
              <span className="text-purple-700 font-medium">Programa de Puntos</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              ¡Acumulá puntos y ganá helados gratis!
            </h2>
            <p className="text-gray-600">
              Por cada compra sumás {pointsPerPurchase} puntos
            </p>
          </div>
          
          {/* Visual grande y claro del progreso */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Tus puntos actuales</p>
                <p className="text-4xl font-bold text-purple-600">{userPoints}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Te faltan</p>
                <p className="text-3xl font-bold text-gray-800">{pointsToNext} puntos</p>
              </div>
            </div>
            
            {/* Barra de progreso grande */}
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-white mix-blend-difference">
                  {Math.round(progress)}% completado
                </span>
              </div>
            </div>
          </div>
          
          {/* Premio claro y grande */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">🍦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Al completar {pointsNeeded} puntos
            </h3>
            <p className="text-lg text-purple-600 font-semibold">
              ¡Helado simple GRATIS!
            </p>
          </div>
          
          {/* Historial simple */}
          {completedRewards > 0 && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Ya canjeaste <span className="font-bold text-purple-600">{completedRewards}</span> helados gratis 🎉
              </p>
            </div>
          )}
          
          {/* Información clara */}
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>¿Cómo funciona?</strong> Cada vez que comprás, sumás {pointsPerPurchase} puntos automáticamente. 
                Al llegar a {pointsNeeded} puntos, tu próximo helado simple es gratis. ¡Es así de fácil!
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SimpleLoyalty;