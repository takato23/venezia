import { useEffect, useRef } from 'react';
import { useToast } from './useToast';

export const useProductionNotifications = (batches = [], orders = []) => {
  const { info, success, warning } = useToast();
  const prevBatchesRef = useRef([]);
  const prevOrdersRef = useRef([]);

  useEffect(() => {
    // Check for batch status changes
    const prevBatches = prevBatchesRef.current;
    
    batches.forEach(batch => {
      const prevBatch = prevBatches.find(b => b.id === batch.id);
      
      if (prevBatch && prevBatch.status !== batch.status) {
        // Status changed
        switch (batch.status) {
          case 'in_progress':
            info(
              `Lote ${batch.batch_number} iniciado`,
              `El lote ha comenzado producción`
            );
            break;
            
          case 'completed':
            success(
              `Lote ${batch.batch_number} completado`,
              `La producción del lote ha finalizado exitosamente`
            );
            
            // Play completion sound
            playNotificationSound();
            break;
            
          case 'paused':
            warning(
              `Lote ${batch.batch_number} pausado`,
              `La producción ha sido pausada temporalmente`
            );
            break;
            
          case 'cancelled':
            warning(
              `Lote ${batch.batch_number} cancelado`,
              `La producción del lote ha sido cancelada`
            );
            break;
        }
      }
    });
    
    // Check for order completions
    const prevOrders = prevOrdersRef.current;
    
    orders.forEach(order => {
      const prevOrder = prevOrders.find(o => o.id === order.id);
      
      if (prevOrder && prevOrder.status !== 'completed' && order.status === 'completed') {
        success(
          `Orden #${order.order_number || order.id} completada`,
          `Todos los lotes han sido producidos exitosamente`
        );
      }
    });
    
    // Update refs
    prevBatchesRef.current = [...batches];
    prevOrdersRef.current = [...orders];
  }, [batches, orders, info, success, warning]);

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound');
    }
  };

  return {
    playNotificationSound
  };
};