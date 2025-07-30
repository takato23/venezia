import React, { useState } from 'react';
import { Gift, Star, TrendingUp, Award, Settings } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const LoyaltyProgram = ({ customers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Loyalty tiers configuration
  const tiers = [
    {
      id: 'bronze',
      name: 'Bronce',
      color: 'orange',
      minSpent: 0,
      maxSpent: 10000,
      benefits: ['5% de descuento', 'Promociones exclusivas'],
      icon: Award
    },
    {
      id: 'silver',
      name: 'Plata',
      color: 'gray',
      minSpent: 10000,
      maxSpent: 50000,
      benefits: ['10% de descuento', 'Envío gratis', 'Acceso anticipado'],
      icon: Award
    },
    {
      id: 'gold',
      name: 'Oro',
      color: 'yellow',
      minSpent: 50000,
      maxSpent: null,
      benefits: ['15% de descuento', 'Envío gratis prioritario', 'Regalos especiales', 'Atención VIP'],
      icon: Star
    }
  ];

  // Calculate customer distribution by tier
  const customersByTier = customers.reduce((acc, customer) => {
    const spent = customer.total_spent || 0;
    const tier = tiers.find(t => 
      spent >= t.minSpent && (t.maxSpent === null || spent < t.maxSpent)
    );
    
    if (tier) {
      if (!acc[tier.id]) {
        acc[tier.id] = { ...tier, customers: [] };
      }
      acc[tier.id].customers.push(customer);
    }
    
    return acc;
  }, {});

  const totalInProgram = Object.values(customersByTier).reduce(
    (sum, tier) => sum + tier.customers.length, 
    0
  );

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Gift className="h-4 w-4 mr-1" />
        Programa de Fidelización
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <div className="max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Programa de Fidelización
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {totalInProgram} clientes activos en el programa
                </p>
              </div>
              <Button variant="secondary" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Configurar
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Resumen' },
                { id: 'members', label: 'Miembros' },
                { id: 'rewards', label: 'Recompensas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Tier Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers.map(tier => {
                    const tierData = customersByTier[tier.id];
                    const customerCount = tierData?.customers.length || 0;
                    const percentage = totalInProgram > 0 
                      ? Math.round((customerCount / totalInProgram) * 100) 
                      : 0;
                    
                    return (
                      <div
                        key={tier.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={clsx(
                            'p-3 rounded-lg',
                            tier.id === 'bronze' && 'bg-orange-100 dark:bg-orange-900/20',
                            tier.id === 'silver' && 'bg-gray-100 dark:bg-gray-900/20',
                            tier.id === 'gold' && 'bg-yellow-100 dark:bg-yellow-900/20'
                          )}>
                            <tier.icon className={clsx(
                              'h-6 w-6',
                              tier.id === 'bronze' && 'text-orange-600 dark:text-orange-400',
                              tier.id === 'silver' && 'text-gray-600 dark:text-gray-400',
                              tier.id === 'gold' && 'text-yellow-600 dark:text-yellow-400'
                            )} />
                          </div>
                          <Badge variant={tier.color} size="sm">
                            {tier.name}
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {customerCount}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {percentage}% de miembros
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Requisito: ${tier.minSpent.toLocaleString()}
                            {tier.maxSpent && ` - $${tier.maxSpent.toLocaleString()}`}
                          </div>
                          
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            <div className="font-medium mb-1">Beneficios:</div>
                            <ul className="space-y-1">
                              {tier.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span className="text-green-500">•</span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Program Stats */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
                    Estadísticas del Programa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {totalInProgram}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Miembros activos
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Ingresos totales
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        12%
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Tasa de retención
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        $25,000
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Descuentos otorgados
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                {tiers.map(tier => {
                  const tierData = customersByTier[tier.id];
                  if (!tierData || tierData.customers.length === 0) return null;
                  
                  return (
                    <div key={tier.id} className="space-y-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <tier.icon className={clsx(
                          'h-5 w-5',
                          tier.id === 'bronze' && 'text-orange-500',
                          tier.id === 'silver' && 'text-gray-500',
                          tier.id === 'gold' && 'text-yellow-500'
                        )} />
                        {tier.name}
                        <Badge variant="gray" size="sm">
                          {tierData.customers.length}
                        </Badge>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tierData.customers.slice(0, 6).map(customer => (
                          <div
                            key={customer.id}
                            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ${(customer.total_spent || 0).toLocaleString()} gastados
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {customer.total_orders || 0} pedidos
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {tierData.customers.length > 6 && (
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          Ver {tierData.customers.length - 6} más
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-3">
                    Próximas Recompensas
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Sistema de recompensas automáticas próximamente disponible
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Cupón de Cumpleaños
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      20% de descuento automático en el mes de cumpleaños
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Bonus por Referidos
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      $500 de crédito por cada nuevo cliente referido
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LoyaltyProgram;