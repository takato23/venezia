import { useState, useCallback, useEffect } from 'react';

const useVoiceRecognition = (onTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Detectar soporte de voz
  const voiceSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (!voiceSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.lang = 'es-AR';
    recognitionInstance.interimResults = false;
    recognitionInstance.maxAlternatives = 1;
    recognitionInstance.continuous = false;

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      if (onTranscript) {
        onTranscript(transcript);
      }
      
      // Disparar evento personalizado para otros componentes
      window.dispatchEvent(new CustomEvent('voiceTranscript', { 
        detail: { transcript, confidence } 
      }));
    };

    recognitionInstance.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      setIsListening(false);
      
      // Notificar error al usuario
      window.dispatchEvent(new CustomEvent('voiceError', { 
        detail: { error: event.error } 
      }));
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [voiceSupported, onTranscript]);

  // Función para iniciar reconocimiento
  const startVoiceCommand = useCallback(() => {
    if (!voiceSupported || !recognition) {
      console.warn('Reconocimiento de voz no soportado');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
      }
    }
  }, [voiceSupported, recognition, isListening]);

  // Función para detener reconocimiento
  const stopVoiceCommand = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  return {
    isListening,
    startVoiceCommand,
    stopVoiceCommand,
    voiceSupported
  };
};

export default useVoiceRecognition;