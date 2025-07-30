const { runAsync, getAsync, allAsync } = require('../database/db');

class CashFlow {
  static async getCurrentBalance(storeId = 1) {
    const result = await getAsync(
      'SELECT balance FROM cash_flow WHERE store_id = ? ORDER BY id DESC LIMIT 1',
      [storeId]
    );
    return result ? result.balance : 0;
  }

  static async openCashRegister(userId, storeId, initialAmount) {
    const currentBalance = await this.getCurrentBalance(storeId);
    
    if (currentBalance > 0) {
      // Check if already open
      const lastEntry = await getAsync(
        'SELECT type FROM cash_flow WHERE store_id = ? ORDER BY id DESC LIMIT 1',
        [storeId]
      );
      
      if (lastEntry && lastEntry.type === 'opening') {
        throw new Error('La caja ya está abierta');
      }
    }

    const result = await runAsync(
      `INSERT INTO cash_flow (user_id, store_id, type, amount, balance, description)
       VALUES (?, ?, 'opening', ?, ?, 'Apertura de caja')`,
      [userId, storeId, initialAmount, initialAmount]
    );
    
    return { id: result.id, balance: initialAmount };
  }

  static async closeCashRegister(userId, storeId, finalAmount) {
    const currentBalance = await this.getCurrentBalance(storeId);
    
    const result = await runAsync(
      `INSERT INTO cash_flow (user_id, store_id, type, amount, balance, description)
       VALUES (?, ?, 'closing', ?, ?, 'Cierre de caja')`,
      [userId, storeId, finalAmount, 0]
    );
    
    return { 
      id: result.id, 
      expectedAmount: currentBalance,
      actualAmount: finalAmount,
      difference: finalAmount - currentBalance 
    };
  }

  static async addMovement(userId, storeId, type, amount, description, referenceId = null) {
    const currentBalance = await this.getCurrentBalance(storeId);
    const newBalance = type === 'income' ? currentBalance + amount : currentBalance - amount;
    
    if (newBalance < 0) {
      throw new Error('Saldo insuficiente en caja');
    }
    
    const result = await runAsync(
      `INSERT INTO cash_flow (user_id, store_id, type, amount, balance, description, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, storeId, type, amount, newBalance, description, referenceId]
    );
    
    return { id: result.id, balance: newBalance };
  }

  static async getMovements(storeId = 1, limit = 50) {
    return await allAsync(
      `SELECT cf.*, u.name as user_name
       FROM cash_flow cf
       LEFT JOIN users u ON cf.user_id = u.id
       WHERE cf.store_id = ?
       ORDER BY cf.id DESC
       LIMIT ?`,
      [storeId, limit]
    );
  }

  static async getDailySummary(storeId = 1, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return await allAsync(
      `SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total
       FROM cash_flow
       WHERE store_id = ? 
         AND DATE(created_at) = DATE(?)
       GROUP BY type`,
      [storeId, targetDate]
    );
  }

  static async getCashRegisterStatus(storeId = 1) {
    const lastEntry = await getAsync(
      `SELECT type, balance, created_at 
       FROM cash_flow 
       WHERE store_id = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [storeId]
    );
    
    if (!lastEntry) {
      return { isOpen: false, balance: 0 };
    }
    
    return {
      isOpen: lastEntry.type !== 'closing',
      balance: lastEntry.balance,
      lastMovement: lastEntry.created_at,
      available: lastEntry.balance // For POS cash indicator
    };
  }

  static async updateMovement(id, data) {
    const { amount, description } = data;
    const movement = await getAsync('SELECT * FROM cash_flow WHERE id = ?', [id]);
    
    if (!movement) {
      throw new Error('Movimiento no encontrado');
    }
    
    if (movement.type === 'opening' || movement.type === 'closing') {
      throw new Error('No se pueden editar aperturas o cierres de caja');
    }
    
    // Recalculate balance
    const previousBalance = await getAsync(
      'SELECT balance FROM cash_flow WHERE id < ? AND store_id = ? ORDER BY id DESC LIMIT 1',
      [id, movement.store_id]
    );
    
    const baseBalance = previousBalance ? previousBalance.balance : 0;
    const newBalance = movement.type === 'income' 
      ? baseBalance + amount 
      : baseBalance - amount;
    
    await runAsync(
      `UPDATE cash_flow 
       SET amount = ?, balance = ?, description = ?
       WHERE id = ?`,
      [amount, newBalance, description, id]
    );
    
    // Update all subsequent balances
    await this.recalculateBalances(movement.store_id, id);
    
    return this.getById(id);
  }

  static async getById(id) {
    return await getAsync('SELECT * FROM cash_flow WHERE id = ?', [id]);
  }

  static async recalculateBalances(storeId, fromId) {
    const movements = await allAsync(
      'SELECT * FROM cash_flow WHERE store_id = ? AND id > ? ORDER BY id',
      [storeId, fromId]
    );
    
    let previousBalance = await getAsync(
      'SELECT balance FROM cash_flow WHERE store_id = ? AND id <= ? ORDER BY id DESC LIMIT 1',
      [storeId, fromId]
    );
    
    let balance = previousBalance ? previousBalance.balance : 0;
    
    for (const movement of movements) {
      if (movement.type === 'income') {
        balance += movement.amount;
      } else if (movement.type === 'expense') {
        balance -= movement.amount;
      } else if (movement.type === 'opening') {
        balance = movement.amount;
      } else if (movement.type === 'closing') {
        balance = 0;
      }
      
      await runAsync(
        'UPDATE cash_flow SET balance = ? WHERE id = ?',
        [balance, movement.id]
      );
    }
  }
}

module.exports = CashFlow;