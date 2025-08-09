import { useCallback } from 'react';
import { usePosStore } from '../stores/posStore';

export default function useOfflineQueue() {
  const { pendingQueue, enqueue, dequeue } = usePosStore();

  const persist = useCallback((queue) => {
    localStorage.setItem('pos_pending', JSON.stringify(queue));
  }, []);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem('pos_pending');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const addToQueue = useCallback((payload) => {
    const current = load();
    const updated = [...current, { payload, ts: Date.now() }];
    persist(updated);
    enqueue(payload);
  }, [enqueue, load, persist]);

  const retryAll = useCallback(async () => {
    const current = load();
    const baseUrl = import.meta?.env?.VITE_API_URL || '/api';
    const remaining = [];
    for (const it of current) {
      try {
        const res = await fetch(`${baseUrl}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(it.payload)
        });
        const json = await res.json();
        if (!res.ok || json?.success === false) {
          remaining.push(it);
        }
      } catch (e) {
        remaining.push(it);
      }
    }
    persist(remaining);
    return { success: remaining.length === 0, remaining: remaining.length };
  }, [load, persist]);

  const queueSize = (pendingQueue?.length || 0) + (load()?.length || 0);

  return { addToQueue, retryAll, queueSize };
}


