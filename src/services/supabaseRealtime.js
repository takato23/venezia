import { supabase } from '../config/supabase';
import { toast } from 'react-hot-toast';

class SupabaseRealtimeService {
  constructor() {
    this.channels = new Map();
    this.callbacks = new Map();
  }

  // Subscribe to products changes
  subscribeToProducts(callback) {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product change:', payload);
          
          // Show toast notification
          switch (payload.eventType) {
            case 'INSERT':
              toast.success(`Nuevo producto: ${payload.new.name}`);
              break;
            case 'UPDATE':
              if (payload.new.current_stock < payload.new.min_stock) {
                toast.warning(`Stock bajo: ${payload.new.name}`);
              }
              break;
            case 'DELETE':
              toast.info('Producto eliminado');
              break;
          }
          
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('products', channel);
    return () => this.unsubscribe('products');
  }

  // Subscribe to sales changes
  subscribeToSales(callback) {
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('New sale:', payload);
          toast.success(`Nueva venta: $${payload.new.total}`);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('sales', channel);
    return () => this.unsubscribe('sales');
  }

  // Subscribe to inventory alerts
  subscribeToAlerts(callback) {
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_alerts'
        },
        (payload) => {
          console.log('New alert:', payload);
          
          const alert = payload.new;
          switch (alert.severity) {
            case 'critical':
              toast.error(alert.title);
              break;
            case 'warning':
              toast.warning(alert.title);
              break;
            default:
              toast.info(alert.title);
          }
          
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('alerts', channel);
    return () => this.unsubscribe('alerts');
  }

  // Subscribe to cash flow changes
  subscribeToCashFlow(storeId, callback) {
    const channel = supabase
      .channel(`cashflow-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_flow',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Cash flow change:', payload);
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(`cashflow-${storeId}`, channel);
    return () => this.unsubscribe(`cashflow-${storeId}`);
  }

  // Subscribe to temperature logs
  subscribeToTemperature(callback) {
    const channel = supabase
      .channel('temperature-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temperature_logs'
        },
        (payload) => {
          console.log('Temperature log:', payload);
          
          const temp = payload.new;
          if (temp.alert_triggered) {
            toast.error(`⚠️ Alerta de temperatura: ${temp.temperature}°C en ${temp.location}`);
          }
          
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set('temperature', channel);
    return () => this.unsubscribe('temperature');
  }

  // Subscribe to specific record changes
  subscribeToRecord(table, id, callback) {
    const channelName = `${table}-${id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `id=eq.${id}`
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Generic table subscription
  subscribeToTable(table, callback, options = {}) {
    const { event = '*', filter = null } = options;
    const channelName = `${table}-${Date.now()}`;
    
    const channelOptions = {
      event,
      schema: 'public',
      table
    };
    
    if (filter) {
      channelOptions.filter = filter;
    }
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelOptions, callback)
      .subscribe();

    this.channels.set(channelName, channel);
    return () => this.unsubscribe(channelName);
  }

  // Unsubscribe from a channel
  unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Get channel status
  getChannelStatus(channelName) {
    const channel = this.channels.get(channelName);
    return channel ? channel.state : null;
  }

  // Check if subscribed to a channel
  isSubscribed(channelName) {
    return this.channels.has(channelName);
  }
}

// Create singleton instance
const supabaseRealtime = new SupabaseRealtimeService();

// React hook for real-time subscriptions
export const useSupabaseRealtime = (subscriptionType, params = {}) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let unsubscribe;

    const handleChange = (payload) => {
      setData(payload);
      setLoading(false);
    };

    try {
      switch (subscriptionType) {
        case 'products':
          unsubscribe = supabaseRealtime.subscribeToProducts(handleChange);
          break;
        case 'sales':
          unsubscribe = supabaseRealtime.subscribeToSales(handleChange);
          break;
        case 'alerts':
          unsubscribe = supabaseRealtime.subscribeToAlerts(handleChange);
          break;
        case 'cashflow':
          if (params.storeId) {
            unsubscribe = supabaseRealtime.subscribeToCashFlow(params.storeId, handleChange);
          }
          break;
        case 'temperature':
          unsubscribe = supabaseRealtime.subscribeToTemperature(handleChange);
          break;
        case 'record':
          if (params.table && params.id) {
            unsubscribe = supabaseRealtime.subscribeToRecord(params.table, params.id, handleChange);
          }
          break;
        case 'table':
          if (params.table) {
            unsubscribe = supabaseRealtime.subscribeToTable(params.table, handleChange, params.options);
          }
          break;
      }
    } catch (err) {
      setError(err);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [subscriptionType, JSON.stringify(params)]);

  return { data, loading, error };
};

export default supabaseRealtime;