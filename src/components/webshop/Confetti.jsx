import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Confetti = ({ trigger }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (trigger) {
      const colors = ['#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360
      }));
      
      setParticles(newParticles);
      
      setTimeout(() => {
        setParticles([]);
      }, 2000);
    }
  }, [trigger]);
  
  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: particle.x,
            y: window.innerHeight / 2,
            scale: 0,
            rotate: 0
          }}
          animate={{
            y: -100,
            scale: [0, 1, 1, 0],
            rotate: particle.rotation,
            x: particle.x + (Math.random() - 0.5) * 200
          }}
          exit={{
            opacity: 0
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut"
          }}
          style={{
            position: 'fixed',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            zIndex: 100,
            pointerEvents: 'none'
          }}
        />
      ))}
    </AnimatePresence>
  );
};

export default Confetti;