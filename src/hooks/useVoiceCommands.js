import { useState, useEffect, useRef, useCallback } from 'react';

const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Comandos de voz específicos para heladería
  const voiceCommands = {
    // Navegación
    'abrir dashboard': () => ({ type: 'navigate', target: '/dashboard' }),
    'ir a ventas': () => ({ type: 'navigate', target: '/sales' }),
    'mostrar inventario': () => ({ type: 'navigate', target: '/inventory' }),
    'ver productos': () => ({ type: 'navigate', target: '/products' }),
    'ir a reportes': () => ({ type: 'navigate', target: '/reports' }),
    
    // Chat AI
    'abrir chat': () => ({ type: 'chat', action: 'open' }),
    'cerrar chat': () => ({ type: 'chat', action: 'close' }),
    'expandir chat': () => ({ type: 'chat', action: 'expand' }),
    'minimizar chat': () => ({ type: 'chat', action: 'minimize' }),
    
    // Consultas rápidas
    'stock de vainilla': () => ({ type: 'query', text: 'Stock de vainilla' }),
    'ventas de hoy': () => ({ type: 'query', text: 'Ventas de hoy' }),
    'productos con stock bajo': () => ({ type: 'query', text: 'Productos con stock bajo' }),
    'reporte semanal': () => ({ type: 'query', text: 'Reporte semanal' }),
    
    // Comandos de sistema
    'modo oscuro': () => ({ type: 'theme', action: 'dark' }),
    'modo claro': () => ({ type: 'theme', action: 'light' }),
    'tema automático': () => ({ type: 'action', action: 'toggle_auto_theme' }),
    'activar tema automático': () => ({ type: 'action', action: 'toggle_auto_theme' }),
    'silenciar notificaciones': () => ({ type: 'notifications', action: 'mute' }),
    'activar notificaciones': () => ({ type: 'notifications', action: 'unmute' }),
  };

  // Verificar soporte del navegador
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 3;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('🎤 Escuchando comando de voz...');
        
        // Disparar evento para UI
        const startEvent = new CustomEvent('voiceStart');
        window.dispatchEvent(startEvent);
      };

      recognition.onresult = (event) => {
        const result = event.results[0];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;
        
        setTranscript(transcript);
        setConfidence(confidence);
        
        console.log(`🎯 Comando reconocido: "${transcript}" (${Math.round(confidence * 100)}%)`);
        
        // Buscar comando exacto o similar
        const command = findBestCommand(transcript);
        if (command) {
          executeCommand(command, transcript);
        } else {
          // Si no es un comando, enviarlo al chat AI
          executeCommand({ type: 'query', text: transcript }, transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Error en reconocimiento de voz:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('🎤 Permisos de micrófono denegados. Habilita el micrófono para usar comandos de voz.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        
        // Disparar evento para UI
        const endEvent = new CustomEvent('voiceEnd');
        window.dispatchEvent(endEvent);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Encontrar el mejor comando usando similitud
  const findBestCommand = useCallback((transcript) => {
    const commands = Object.keys(voiceCommands);
    
    // Buscar coincidencia exacta
    if (voiceCommands[transcript]) {
      return voiceCommands[transcript]();
    }
    
    // Buscar coincidencias parciales
    for (const command of commands) {
      if (transcript.includes(command) || command.includes(transcript)) {
        return voiceCommands[command]();
      }
    }
    
    // Buscar palabras clave
    if (transcript.includes('stock') || transcript.includes('inventario')) {
      if (transcript.includes('vainilla')) return voiceCommands['stock de vainilla']();
      if (transcript.includes('bajo')) return voiceCommands['productos con stock bajo']();
      return { type: 'navigate', target: '/inventory' };
    }
    
    if (transcript.includes('ventas') || transcript.includes('vender')) {
      if (transcript.includes('hoy')) return voiceCommands['ventas de hoy']();
      return { type: 'navigate', target: '/sales' };
    }
    
    if (transcript.includes('producto') || transcript.includes('helado')) {
      return { type: 'navigate', target: '/products' };
    }
    
    if (transcript.includes('reporte') || transcript.includes('análisis')) {
      return { type: 'navigate', target: '/reports' };
    }
    
    return null;
  }, []);

  // Ejecutar comando
  const executeCommand = useCallback((command, originalText) => {
    const event = new CustomEvent('voiceCommand', { 
      detail: { ...command, originalText, confidence } 
    });
    window.dispatchEvent(event);
  }, [confidence]);

  // Iniciar escucha
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        
        // Timeout de seguridad (10 segundos)
        timeoutRef.current = setTimeout(() => {
          if (isListening) {
            stopListening();
          }
        }, 10000);
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
      }
    }
  }, [isListening]);

  // Detener escucha
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isListening]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    voiceCommands: Object.keys(voiceCommands)
  };
};

export default useVoiceCommands;