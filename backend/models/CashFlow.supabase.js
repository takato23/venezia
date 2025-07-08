const db = require('../database/supabase-db');

class CashFlow {
  static async openCashRegister(userId, storeId, initialAmount) {
    // Check if cash register is already open
    const lastEntry = await this.getLastEntry(storeId);
    
    if (lastEntry && lastEntry.type === 'opening') {
      throw new Error('La caja ya está abierta');
    }
    
    const entry = await db.insert('cash_flow', {
      user_id: userId,
      store_id: storeId,
      type: 'opening',
      amount: parseFloat(initialAmount),
      balance: parseFloat(initialAmount),
      description: 'Apertura de caja'
    });
    
    return entry;
  }

  static async closeCashRegister(userId, storeId, finalAmount) {
    const lastEntry = await this.getLastEntry(storeId);
    
    if (!lastEntry || lastEntry.type === 'closing') {
      throw new Error('La caja no está abierta');
    }
    
    // Calculate expected vs actual
    const currentBalance = await this.getCurrentBalance(storeId);
    const difference = parseFloat(finalAmount) - currentBalance;
    
    const entry = await db.insert('cash_flow', {
      user_id: userId,
      store_id: storeId,
      type: 'closing',
      amount: parseFloat(finalAmount),
      balance: parseFloat(finalAmount),
      description: `Cierre de caja. Diferencia: $${difference.toFixed(2)}`
    });
    
    // Create alert if there's a significant difference
    if (Math.abs(difference) > 10) {
      await db.insert('system_alerts', {
        type: 'cash',
        severity: 'warning',
        title: 'Diferencia en cierre de caja',
        message: `Diferencia de $${Math.abs(difference).toFixed(2)} ${difference > 0 ? 'de más' : 'de menos'}`,
        data: { 
          store_id: storeId, 
          expected: currentBalance, 
          actual: finalAmount, 
          difference 
        }
      });
    }
    
    return {
      ...entry,
      summary: {
        opening_balance: lastEntry.balance,
        expected_balance: currentBalance,
        actual_balance: finalAmount,
        difference
      }
    };
  }

  static async addMovement(userId, storeId, type, amount, description, referenceId = null) {
    // Validate movement type
    const validTypes = ['income', 'expense', 'sale', 'withdrawal'];
    if (!validTypes.includes(type)) {
      throw new Error('Tipo de movimiento inválido');
    }
    
    // Check if cash register is open
    const isOpen = await this.isCashRegisterOpen(storeId);
    if (!isOpen) {
      throw new Error('La caja debe estar abierta para registrar movimientos');
    }
    
    // Get current balance
    const currentBalance = await this.getCurrentBalance(storeId);
    
    // Calculate new balance
    let newBalance;
    if (type === 'income' || type === 'sale') {
      newBalance = currentBalance + parseFloat(amount);
    } else {
      newBalance = currentBalance - parseFloat(amount);
    }
    
    if (newBalance < 0) {
      throw new Error('Saldo insuficiente en caja');
    }
    
    const entry = await db.insert('cash_flow', {
      user_id: userId,
      store_id: storeId,
      type,
      amount: parseFloat(amount),
      balance: newBalance,
      description,
      reference_id: referenceId
    });
    
    // Check for low cash alert
    if (newBalance < 500) {
      await db.insert('system_alerts', {
        type: 'cash',
        severity: newBalance < 200 ? 'critical' : 'warning',
        title: `Efectivo ${newBalance < 200 ? 'Crítico' : 'Bajo'}`,
        message: `Solo $${newBalance.toFixed(2)} disponible en caja`,
        data: { store_id: storeId, balance: newBalance }
      });
    }
    
    return entry;
  }

  static async getMovements(storeId, date = null) {
    const conditions = { store_id: storeId };
    
    if (date) {
      // Get movements for specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const { data, error } = await db.supabase
        .from('cash_flow')
        .select('*, user:users(name, email)')
        .eq('store_id', storeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
    
    // Get today's movements by default
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await db.supabase
      .from('cash_flow')
      .select('*, user:users(name, email)')
      .eq('store_id', storeId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getCurrentBalance(storeId) {
    const lastEntry = await this.getLastEntry(storeId);
    return lastEntry ? parseFloat(lastEntry.balance) : 0;
  }

  static async getLastEntry(storeId) {
    const { data, error } = await db.supabase
      .from('cash_flow')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }
    
    return data;
  }

  static async isCashRegisterOpen(storeId) {
    const lastEntry = await this.getLastEntry(storeId);
    return lastEntry && lastEntry.type === 'opening';
  }

  static async getCashRegisterStatus(storeId) {
    const isOpen = await this.isCashRegisterOpen(storeId);
    const currentBalance = await this.getCurrentBalance(storeId);
    const lastEntry = await this.getLastEntry(storeId);
    
    let openingSummary = null;
    if (isOpen && lastEntry) {
      // Get summary since opening
      const { data: movements } = await db.supabase
        .from('cash_flow')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', lastEntry.created_at)
        .order('created_at');
      
      const income = movements
        .filter(m => m.type === 'income' || m.type === 'sale')
        .reduce((sum, m) => sum + parseFloat(m.amount), 0);
      
      const expenses = movements
        .filter(m => m.type === 'expense' || m.type === 'withdrawal')
        .reduce((sum, m) => sum + parseFloat(m.amount), 0);
      
      openingSummary = {
        opening_time: lastEntry.created_at,
        opening_amount: parseFloat(lastEntry.amount),
        total_income: income,
        total_expenses: expenses,
        net_change: income - expenses,
        transaction_count: movements.length - 1 // Exclude opening
      };
    }
    
    return {
      is_open: isOpen,
      current_balance: currentBalance,
      last_movement: lastEntry,
      opening_summary: openingSummary
    };
  }

  static async getDailySummary(storeId, date = null) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    const { data: movements, error } = await db.supabase
      .from('cash_flow')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', targetDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');
    
    if (error) throw error;
    
    const opening = movements.find(m => m.type === 'opening');
    const closing = movements.find(m => m.type === 'closing');
    
    const sales = movements
      .filter(m => m.type === 'sale')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);
    
    const income = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);
    
    const expenses = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);
    
    const withdrawals = movements
      .filter(m => m.type === 'withdrawal')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);
    
    return {
      date: targetDate,
      opening_balance: opening ? parseFloat(opening.amount) : 0,
      closing_balance: closing ? parseFloat(closing.amount) : null,
      total_sales: sales,
      total_income: income,
      total_expenses: expenses,
      total_withdrawals: withdrawals,
      net_change: sales + income - expenses - withdrawals,
      movement_count: movements.length,
      is_closed: !!closing
    };
  }

  static async updateMovement(id, updates) {
    const movement = await db.selectOne('cash_flow', { id });
    if (!movement) {
      throw new Error('Movimiento no encontrado');
    }
    
    if (movement.type === 'opening' || movement.type === 'closing') {
      throw new Error('No se pueden editar aperturas o cierres de caja');
    }
    
    // Only allow updating description
    return await db.update('cash_flow', id, {
      description: updates.description
    });
  }
}

module.exports = CashFlow;