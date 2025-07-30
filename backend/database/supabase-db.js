const { supabase } = require('../config/supabase');

// Helper functions for Supabase operations
const supabaseDb = {
  // Execute a select query
  async select(table, conditions = {}, options = {}) {
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply conditions
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
    
    // Apply additional options
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Execute a single select query
  async selectOne(table, conditions = {}, options = {}) {
    const results = await this.select(table, conditions, { ...options, limit: 1 });
    return results[0] || null;
  },

  // Insert data
  async insert(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // Insert multiple rows
  async insertMany(table, dataArray) {
    const { data: results, error } = await supabase
      .from(table)
      .insert(dataArray)
      .select();
    
    if (error) throw error;
    return results;
  },

  // Update data
  async update(table, id, updates) {
    const { data: result, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // Update with conditions
  async updateWhere(table, conditions, updates) {
    let query = supabase.from(table).update(updates);
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: results, error } = await query.select();
    if (error) throw error;
    return results;
  },

  // Delete data
  async delete(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Delete with conditions
  async deleteWhere(table, conditions) {
    let query = supabase.from(table).delete();
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { error } = await query;
    if (error) throw error;
    return true;
  },

  // Execute raw SQL (requires database functions)
  async raw(query, params = []) {
    const { data, error } = await supabase.rpc('exec_sql', {
      query,
      params
    });
    
    if (error) throw error;
    return data;
  },

  // Transaction helper (using Supabase functions)
  async transaction(callback) {
    // Note: Supabase doesn't have built-in transaction support in JS client
    // You would need to create a database function for complex transactions
    // For now, we'll execute operations sequentially
    try {
      const result = await callback(this);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Count rows
  async count(table, conditions = {}) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
    
    const { count, error } = await query;
    if (error) throw error;
    return count;
  },

  // Check if exists
  async exists(table, conditions) {
    const count = await this.count(table, conditions);
    return count > 0;
  },

  // Upsert (insert or update)
  async upsert(table, data, onConflict = 'id') {
    const { data: result, error } = await supabase
      .from(table)
      .upsert(data, { onConflict })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
};

module.exports = supabaseDb;