import React from 'react';
import { motion } from 'framer-motion';
import { 
  Milk, 
  Snowflake, 
  Heart, 
  Truck,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const ProcessSection = () => {
  const steps = [
    {
      icon: Milk,
      title: 'Ingredientes Premium',
      description: 'Seleccionamos cuidadosamente los mejores ingredientes naturales',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: Snowflake,
      title: 'Proceso Artesanal',
      description: 'Elaboramos cada helado con técnicas tradicionales italianas',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Heart,
      title: 'Hecho con Amor',
      description: 'Cada batch es preparado con dedicación y pasión',
      color: 'from-pink-400 to-pink-600'
    },
    {
      icon: Truck,
      title: 'Directo a tu Casa',
      description: 'Entregamos tu pedido perfectamente conservado',
      color: 'from-green-400 to-green-600'
    }
  ];
  
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            Nuestro 
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"> Proceso</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            De la selección de ingredientes a tu mesa, cada paso está cuidadosamente diseñado para ofrecerte la mejor experiencia
          </p>
        </motion.div>
        
        {/* Desktop Timeline */}
        <div className="hidden md:block relative">
          {/* Línea conectora */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 transform -translate-y-1/2" />
          
          <div className="grid grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative"
                  >
                    {/* Círculo de fondo */}
                    <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-xl flex items-center justify-center relative z-10">
                      <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center`}>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    
                    {/* Número del paso */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-20">
                      <span className="text-sm font-bold text-gray-700">{index + 1}</span>
                    </div>
                  </motion.div>
                  
                  <h3 className="mt-6 text-lg font-semibold text-gray-800">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto">
                    {step.description}
                  </p>
                  
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + 0.3 }}
                      className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20"
                    >
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Timeline */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700 font-medium">
              Calidad garantizada en cada paso
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSection;