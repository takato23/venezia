// Mock Delivery Service
// Maneja las operaciones de entregas cuando el backend no está disponible

class MockDeliveryService {
  constructor() {
    this.storageKey = 'mockDeliveries';
    this.initializeData();
  }

  initializeData() {
    const existing = this.getAll();
    if (!existing || existing.length === 0) {
      // Datos iniciales de ejemplo
      const mockData = [
        {
          id: 1,
          order_number: "1210",
          customer_name: "Carlos López",
          customer_phone: "+54 11 5660-4234",
          address: {
            street: "Av. Cabildo",
            number: "5266",
            neighborhood: "Caballito",
            city: "Buenos Aires"
          },
          status: "pending",
          priority: "normal",
          driver_id: null,
          driver_name: null,
          estimated_time: null,
          items: [
            { product_name: "Palito Frutilla", quantity: 1, price: 1150 },
            { product_name: "1/4 kg Chocolate", quantity: 2, price: 2920 }
          ],
          total_amount: 7090,
          notes: "",
          created_at: new Date().toISOString(),
          scheduled_date: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(mockData));
    }
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading mock deliveries:', error);
      return [];
    }
  }

  save(deliveries) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(deliveries));
      return true;
    } catch (error) {
      console.error('Error saving mock deliveries:', error);
      return false;
    }
  }

  create(deliveryData) {
    const deliveries = this.getAll();
    const newDelivery = {
      ...deliveryData,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      scheduled_date: deliveryData.scheduled_date || new Date().toISOString(),
      status: deliveryData.status || 'pending',
      priority: deliveryData.priority || 'normal'
    };
    
    deliveries.push(newDelivery);
    this.save(deliveries);
    return newDelivery;
  }

  update(id, deliveryData) {
    const deliveries = this.getAll();
    const index = deliveries.findIndex(d => d.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Delivery not found');
    }
    
    deliveries[index] = {
      ...deliveries[index],
      ...deliveryData,
      updated_at: new Date().toISOString()
    };
    
    this.save(deliveries);
    return deliveries[index];
  }

  updateStatus(id, status) {
    const deliveries = this.getAll();
    const index = deliveries.findIndex(d => d.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Delivery not found');
    }
    
    deliveries[index].status = status;
    
    if (status === 'delivered') {
      deliveries[index].delivered_at = new Date().toISOString();
    }
    
    this.save(deliveries);
    return deliveries[index];
  }

  delete(id) {
    const deliveries = this.getAll();
    const filtered = deliveries.filter(d => d.id !== parseInt(id));
    this.save(filtered);
    return true;
  }

  // Sincronizar con el cache de la API
  syncWithApiCache() {
    const cacheKey = '/api/deliveries';
    const deliveries = this.getAll();
    
    const cacheData = {
      data: deliveries,
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutos
    };
    
    localStorage.setItem(`apiCache_${cacheKey}`, JSON.stringify(cacheData));
  }
}

// Exportar una instancia única
export default new MockDeliveryService();