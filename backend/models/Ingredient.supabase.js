const { supabase } = require('../config/supabase');

class Ingredient {
  static async create(ingredientData) {
    const {
      name,
      unit,
      cost_per_unit,
      current_stock = 0,
      minimum_stock = 0,
      supplier,
      category,
      description
    } = ingredientData;

    try {
      const { data: ingredient, error } = await supabase
        .from('ingredients')
        .insert({
          name,
          unit,
          cost_per_unit,
          current_stock,
          minimum_stock,
          supplier,
          category,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        ingredient
      };

    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { data: ingredient, error } = await supabase
        .from('ingredients')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        ingredient
      };

    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data: ingredient, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          recipe_ingredients(
            quantity,
            recipe:recipes(id, name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return ingredient;

    } catch (error) {
      console.error('Error fetching ingredient:', error);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.low_stock) {
        query = query.lte('current_stock', 'minimum_stock');
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,supplier.ilike.%${filters.search}%`);
      }

      const { data: ingredients, error } = await query;

      if (error) throw error;

      return ingredients;

    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Check if ingredient is used in any recipes
      const { data: recipeIngredients, error: checkError } = await supabase
        .from('recipe_ingredients')
        .select('id')
        .eq('ingredient_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (recipeIngredients && recipeIngredients.length > 0) {
        throw new Error('Cannot delete ingredient that is used in recipes');
      }

      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Ingredient deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  }

  // Stock management methods
  static async addStock(id, quantity, notes = '') {
    try {
      // Get current stock
      const { data: ingredient, error: fetchError } = await supabase
        .from('ingredients')
        .select('current_stock, name')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newStock = (ingredient.current_stock || 0) + quantity;

      // Update stock
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          ingredient_id: id,
          type: 'in',
          quantity,
          notes: notes || `Stock added for ${ingredient.name}`,
          created_at: new Date().toISOString()
        });

      if (movementError) {
        console.error('Error creating stock movement:', movementError);
      }

      return {
        success: true,
        previous_stock: ingredient.current_stock,
        new_stock: newStock
      };

    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  static async deductStock(id, quantity, notes = '') {
    try {
      // Get current stock
      const { data: ingredient, error: fetchError } = await supabase
        .from('ingredients')
        .select('current_stock, name, minimum_stock')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (ingredient.current_stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${ingredient.current_stock}, Required: ${quantity}`);
      }

      const newStock = ingredient.current_stock - quantity;

      // Update stock
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          ingredient_id: id,
          type: 'out',
          quantity,
          notes: notes || `Stock deducted for ${ingredient.name}`,
          created_at: new Date().toISOString()
        });

      if (movementError) {
        console.error('Error creating stock movement:', movementError);
      }

      // Check if stock is below minimum
      const isLowStock = newStock <= ingredient.minimum_stock;

      return {
        success: true,
        previous_stock: ingredient.current_stock,
        new_stock: newStock,
        low_stock_warning: isLowStock,
        minimum_stock: ingredient.minimum_stock
      };

    } catch (error) {
      console.error('Error deducting stock:', error);
      throw error;
    }
  }

  static async checkAvailability(ingredientQuantities) {
    // ingredientQuantities: [{ ingredient_id, quantity_needed }]
    try {
      const availability = [];
      let allAvailable = true;

      for (const item of ingredientQuantities) {
        const { data: ingredient, error } = await supabase
          .from('ingredients')
          .select('id, name, current_stock, unit')
          .eq('id', item.ingredient_id)
          .single();

        if (error) throw error;

        const isAvailable = ingredient.current_stock >= item.quantity_needed;
        if (!isAvailable) allAvailable = false;

        availability.push({
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          unit: ingredient.unit,
          current_stock: ingredient.current_stock,
          quantity_needed: item.quantity_needed,
          is_available: isAvailable,
          shortage: isAvailable ? 0 : item.quantity_needed - ingredient.current_stock
        });
      }

      return {
        all_available: allAvailable,
        availability
      };

    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  static async getLowStockIngredients() {
    try {
      const { data: ingredients, error } = await supabase
        .from('ingredients')
        .select('*')
        .filter('current_stock', 'lte', supabase.raw('minimum_stock'))
        .order('name', { ascending: true });

      if (error) throw error;

      return ingredients.map(ing => ({
        ...ing,
        stock_percentage: ing.minimum_stock > 0 
          ? Math.round((ing.current_stock / ing.minimum_stock) * 100) 
          : 0
      }));

    } catch (error) {
      console.error('Error fetching low stock ingredients:', error);
      throw error;
    }
  }

  static async getStockMovements(ingredientId, limit = 20) {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ingredientId) {
        query = query.eq('ingredient_id', ingredientId);
      }

      const { data: movements, error } = await query;

      if (error) throw error;

      return movements;

    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  }

  static async getCostAnalysis() {
    try {
      const { data: ingredients, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('cost_per_unit', { ascending: false });

      if (error) throw error;

      const totalValue = ingredients.reduce((sum, ing) => {
        return sum + (ing.current_stock * ing.cost_per_unit);
      }, 0);

      const byCategory = {};
      ingredients.forEach(ing => {
        const cat = ing.category || 'Sin categoría';
        if (!byCategory[cat]) {
          byCategory[cat] = {
            count: 0,
            total_value: 0,
            items: []
          };
        }
        byCategory[cat].count += 1;
        byCategory[cat].total_value += ing.current_stock * ing.cost_per_unit;
        byCategory[cat].items.push({
          name: ing.name,
          value: ing.current_stock * ing.cost_per_unit
        });
      });

      return {
        total_value: totalValue,
        total_ingredients: ingredients.length,
        by_category: byCategory,
        most_valuable: ingredients.slice(0, 10).map(ing => ({
          name: ing.name,
          unit_cost: ing.cost_per_unit,
          stock: ing.current_stock,
          total_value: ing.current_stock * ing.cost_per_unit
        }))
      };

    } catch (error) {
      console.error('Error getting cost analysis:', error);
      throw error;
    }
  }
}

module.exports = Ingredient;