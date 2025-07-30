import { useEffect, useState } from 'react';

const useAutoTheme = (currentDarkMode, setDarkMode) => {
  const [autoMode, setAutoMode] = useState(() => {
    return localStorage.getItem('venezia-auto-theme') === 'true';
  });

  // Determinar si debe ser modo oscuro basado en la hora
  const getShouldBeDark = () => {
    const hour = new Date().getHours();
    // Modo oscuro entre las 7 PM (19:00) y 7 AM (07:00)
    return hour >= 19 || hour < 7;
  };

  // Verificar y actualizar tema automáticamente
  const checkAndUpdateTheme = () => {
    if (!autoMode) return;
    
    const shouldBeDark = getShouldBeDark();
    if (shouldBeDark !== currentDarkMode) {
      setDarkMode(shouldBeDark);
      
      // Mostrar notificación
      const event = new CustomEvent('themeAutoChange', {
        detail: {
          newTheme: shouldBeDark ? 'dark' : 'light',
          time: new Date().toLocaleTimeString(),
          reason: 'automatic'
        }
      });
      window.dispatchEvent(event);
    }
  };

  // Configurar verificación automática cada minuto
  useEffect(() => {
    if (!autoMode) return;

    // Verificar inmediatamente
    checkAndUpdateTheme();

    // Configurar intervalo para verificar cada minuto
    const interval = setInterval(checkAndUpdateTheme, 60000);

    return () => clearInterval(interval);
  }, [autoMode, currentDarkMode, setDarkMode]);

  // Guardar preferencia de modo automático
  useEffect(() => {
    localStorage.setItem('venezia-auto-theme', autoMode.toString());
  }, [autoMode]);

  // Configurar listener para cambios de hora del sistema
  useEffect(() => {
    if (!autoMode) return;

    const handleTimeChange = () => {
      setTimeout(checkAndUpdateTheme, 1000); // Delay para asegurar que la hora se actualizó
    };

    // Escuchar eventos de cambio de foco (cuando el usuario vuelve a la ventana)
    window.addEventListener('focus', handleTimeChange);
    window.addEventListener('visibilitychange', handleTimeChange);

    return () => {
      window.removeEventListener('focus', handleTimeChange);
      window.removeEventListener('visibilitychange', handleTimeChange);
    };
  }, [autoMode]);

  const toggleAutoMode = () => {
    const newAutoMode = !autoMode;
    setAutoMode(newAutoMode);
    
    if (newAutoMode) {
      // Si se activa el modo automático, aplicar inmediatamente
      checkAndUpdateTheme();
    }
    
    return newAutoMode;
  };

  const getNextThemeChange = () => {
    if (!autoMode) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    let nextChangeHour;
    let nextChangeType;
    
    if (currentHour >= 7 && currentHour < 19) {
      // Estamos en horario diurno, próximo cambio a oscuro a las 19:00
      nextChangeHour = 19;
      nextChangeType = 'dark';
    } else {
      // Estamos en horario nocturno, próximo cambio a claro a las 07:00
      nextChangeHour = 7;
      nextChangeType = 'light';
    }
    
    const nextChange = new Date(now);
    nextChange.setHours(nextChangeHour, 0, 0, 0);
    
    // Si la hora ya pasó hoy, programar para mañana
    if (nextChange <= now) {
      nextChange.setDate(nextChange.getDate() + 1);
    }
    
    return {
      time: nextChange,
      type: nextChangeType,
      timeString: nextChange.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getCurrentPeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  const getPeriodIcon = () => {
    const period = getCurrentPeriod();
    switch (period) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
      default: return '🕐';
    }
  };

  return {
    autoMode,
    toggleAutoMode,
    getShouldBeDark,
    getNextThemeChange,
    getCurrentPeriod,
    getPeriodIcon,
    checkAndUpdateTheme
  };
};

export default useAutoTheme;