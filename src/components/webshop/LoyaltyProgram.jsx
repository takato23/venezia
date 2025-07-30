import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy,
  Star,
  Gift,
  Target,
  Zap,
  Award,
  TrendingUp,
  Lock,
  Unlock,
  ChevronRight,
  Coins,
  Crown,
  Medal,
  Sparkles,
  CheckCircle,
  X,
  Plus,
  Info,
  Share2,
  Heart
} from 'lucide-react';

const LoyaltyProgram = ({ userPoints = 0, userId = null }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [points, setPoints] = useState(userPoints);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  
  // Niveles del programa
  const levels = [
    { level: 1, name: 'Principiante', minPoints: 0, maxPoints: 100, color: 'from-gray-400 to-gray-600', icon: '🍨' },
    { level: 2, name: 'Aficionado', minPoints: 101, maxPoints: 300, color: 'from-blue-400 to-blue-600', icon: '🍦' },
    { level: 3, name: 'Experto', minPoints: 301, maxPoints: 600, color: 'from-purple-400 to-purple-600', icon: '🍧' },
    { level: 4, name: 'Maestro', minPoints: 601, maxPoints: 1000, color: 'from-pink-400 to-pink-600', icon: '🎂' },
    { level: 5, name: 'Leyenda', minPoints: 1001, maxPoints: Infinity, color: 'from-yellow-400 to-orange-600', icon: '👑' }
  ];
  
  // Recompensas disponibles
  const rewards = [
    {
      id: 1,
      name: 'Topping Gratis',
      description: 'Agrega cualquier topping sin costo',
      points: 50,
      icon: Sparkles,
      color: 'from-green-400 to-green-600',
      available: true
    },
    {
      id: 2,
      name: '10% Descuento',
      description: 'En tu próxima compra',
      points: 100,
      icon: Gift,
      color: 'from-blue-400 to-blue-600',
      available: true
    },
    {
      id: 3,
      name: 'Helado Gratis',
      description: 'Un helado simple de regalo',
      points: 200,
      icon: Award,
      color: 'from-purple-400 to-purple-600',
      available: true
    },
    {
      id: 4,
      name: 'Combo Familiar',
      description: '20% off en combos familiares',
      points: 300,
      icon: Heart,
      color: 'from-pink-400 to-pink-600',
      available: true
    },
    {
      id: 5,
      name: 'VIP por un Mes',
      description: 'Beneficios exclusivos y prioridad',
      points: 500,
      icon: Crown,
      color: 'from-yellow-400 to-orange-600',
      available: true
    }
  ];
  
  // Logros/Achievements
  const achievements = [
    {
      id: 'first_purchase',
      name: 'Primera Compra',
      description: 'Realiza tu primera compra',
      icon: CheckCircle,
      points: 20,
      unlocked: true
    },
    {
      id: 'flavor_explorer',
      name: 'Explorador de Sabores',
      description: 'Prueba 5 sabores diferentes',
      icon: Target,
      points: 50,
      progress: 3,
      total: 5,
      unlocked: false
    },
    {
      id: 'social_sharer',
      name: 'Influencer',
      description: 'Comparte en redes sociales',
      icon: Share2,
      points: 30,
      unlocked: false
    },
    {
      id: 'weekend_warrior',
      name: 'Guerrero del Fin de Semana',
      description: 'Compra 3 fines de semana seguidos',
      icon: Zap,
      points: 40,
      progress: 1,
      total: 3,
      unlocked: false
    },
    {
      id: 'big_spender',
      name: 'Gran Comprador',
      description: 'Gasta más de $5000 en un mes',
      icon: Coins,
      points: 100,
      unlocked: false
    }
  ];
  
  // Calcular nivel actual basado en puntos
  useEffect(() => {
    const level = levels.find(l => points >= l.minPoints && points <= l.maxPoints);
    if (level && level.level !== currentLevel) {
      setCurrentLevel(level.level);
      if (level.level > currentLevel) {
        setShowLevelUpAnimation(true);
        setTimeout(() => setShowLevelUpAnimation(false), 3000);
      }
    }
  }, [points]);
  
  const getCurrentLevelInfo = () => {
    return levels.find(l => l.level === currentLevel) || levels[0];
  };
  
  const getNextLevelInfo = () => {
    return levels.find(l => l.level === currentLevel + 1) || null;
  };
  
  const getProgressToNextLevel = () => {
    const current = getCurrentLevelInfo();
    const next = getNextLevelInfo();
    if (!next) return 100;
    
    const currentProgress = points - current.minPoints;
    const totalNeeded = next.minPoints - current.minPoints;
    return (currentProgress / totalNeeded) * 100;
  };
  
  const handleRedeemReward = (reward) => {
    if (points >= reward.points) {
      setSelectedReward(reward);
      setShowRewardModal(true);
    }
  };
  
  const confirmRedeem = () => {
    if (selectedReward && points >= selectedReward.points) {
      setPoints(points - selectedReward.points);
      // Aquí se enviaría la información al backend
      setShowRewardModal(false);
      setSelectedReward(null);
    }
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full mb-4">
            <Trophy className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700 font-medium">Programa de Lealtad</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Gana puntos y
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> desbloquea recompensas</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Cada compra te acerca a increíbles beneficios exclusivos
          </p>
        </motion.div>
        
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full shadow-md p-1 inline-flex">
            {['overview', 'rewards', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab === 'overview' ? 'Mi Progreso' : tab === 'rewards' ? 'Recompensas' : 'Logros'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Contenido según tab activa */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Tarjeta de nivel actual */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden">
                  {/* Fondo decorativo */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-50" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-gray-600 mb-2">Nivel actual</p>
                        <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                          {getCurrentLevelInfo().name}
                          <span className="text-4xl">{getCurrentLevelInfo().icon}</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600 mb-2">Puntos totales</p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {points}
                        </p>
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    {getNextLevelInfo() && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progreso al siguiente nivel</span>
                          <span className="text-sm font-medium text-gray-800">
                            {getNextLevelInfo().minPoints - points} puntos restantes
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressToNextLevel()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${getCurrentLevelInfo().color}`}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Beneficios del nivel */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                        <Medal className="h-8 w-8 text-purple-600 mb-2" />
                        <p className="text-sm font-medium text-gray-800">Descuento permanente</p>
                        <p className="text-lg font-bold text-purple-600">{currentLevel * 2}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                        <Zap className="h-8 w-8 text-blue-600 mb-2" />
                        <p className="text-sm font-medium text-gray-800">Puntos por compra</p>
                        <p className="text-lg font-bold text-blue-600">x{currentLevel}.5</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Próximo nivel */}
              <div className="space-y-6">
                {getNextLevelInfo() && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-6"
                  >
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Próximo Nivel
                    </h4>
                    <div className="text-center mb-4">
                      <p className="text-4xl mb-2">{getNextLevelInfo().icon}</p>
                      <p className="text-xl font-bold">{getNextLevelInfo().name}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Descuento del {(currentLevel + 1) * 2}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Puntos x{currentLevel + 1}.5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Acceso a recompensas VIP</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Cómo ganar puntos */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-6"
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-600" />
                    Gana más puntos
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Por cada $100</span>
                      <span className="font-medium text-gray-800">+10 pts</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Referir amigo</span>
                      <span className="font-medium text-gray-800">+50 pts</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reseña verificada</span>
                      <span className="font-medium text-gray-800">+20 pts</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Cumpleaños</span>
                      <span className="font-medium text-gray-800">+100 pts</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {rewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-xl p-6 relative overflow-hidden ${
                    points >= reward.points ? 'cursor-pointer hover:shadow-2xl' : 'opacity-75'
                  } transition-all`}
                  onClick={() => points >= reward.points && handleRedeemReward(reward)}
                >
                  {/* Estado de disponibilidad */}
                  <div className="absolute top-4 right-4">
                    {points >= reward.points ? (
                      <Unlock className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Ícono y contenido */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${reward.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <reward.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{reward.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-600" />
                      <span className="text-lg font-bold text-gray-800">{reward.points} pts</span>
                    </div>
                    
                    {points >= reward.points && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium"
                      >
                        Canjear
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-xl p-6 relative ${
                    achievement.unlocked ? '' : 'opacity-75'
                  }`}
                >
                  {/* Badge de estado */}
                  {achievement.unlocked && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Ícono del logro */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-gray-200'
                  }`}>
                    <achievement.icon className={`h-8 w-8 ${
                      achievement.unlocked ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{achievement.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                  
                  {/* Progreso si aplica */}
                  {achievement.progress !== undefined && !achievement.unlocked && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-medium">{achievement.progress}/{achievement.total}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Puntos del logro */}
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-800">{achievement.points} puntos</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Modal de canje de recompensa */}
        <AnimatePresence>
          {showRewardModal && selectedReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRewardModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-md w-full p-6"
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmar canje</h3>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${selectedReward.color} rounded-2xl flex items-center justify-center mb-4`}>
                    <selectedReward.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{selectedReward.name}</h4>
                  <p className="text-gray-600">{selectedReward.description}</p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Se descontarán {selectedReward.points} puntos de tu cuenta. Esta acción no se puede deshacer.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmRedeem}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
                  >
                    Confirmar canje
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRewardModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Animación de level up */}
        <AnimatePresence>
          {showLevelUpAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 1,
                    repeat: 2
                  }}
                  className="text-8xl mb-4"
                >
                  {getCurrentLevelInfo().icon}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-white drop-shadow-lg mb-2"
                >
                  ¡Nivel {currentLevel}!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl text-white drop-shadow-lg"
                >
                  {getCurrentLevelInfo().name}
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LoyaltyProgram;