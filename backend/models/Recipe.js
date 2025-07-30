const { runAsync, getAsync, allAsync } = require('../database/db');

class Recipe {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        r.*,
        p.name as product_name,
        p.price as product_price,
        p.current_stock as product_stock,
        COUNT(ri.id) as ingredient_count,
        COALESCE(SUM(ri.quantity * i.cost_per_unit), 0) as total_cost
      FROM recipes r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.product_id) {
      query += ' AND r.product_id = ?';
      params.push(filters.product_id);
    }

    query += ' GROUP BY r.id ORDER BY r.name';
    
    try {
      const recipes = await allAsync(query, params) || [];
      
      // Calculate profit margin for each recipe
      return recipes.map(recipe => ({
        ...recipe,
        profit_margin: recipe.product_price ? 
          ((recipe.product_price - recipe.total_cost) / recipe.product_price * 100).toFixed(2) : 0
      }));
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  static async getById(id) {
    try {
      const recipe = await getAsync(`
        SELECT 
          r.*,
          p.name as product_name,
          p.price as product_price,
          p.unit as product_unit
        FROM recipes r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = ?
      `, [id]);
      
      if (recipe) {
        // Get recipe ingredients
        recipe.ingredients = await allAsync(`
          SELECT 
            ri.*,
            i.name as ingredient_name,
            i.unit as ingredient_unit,
            i.cost_per_unit,
            i.quantity as current_stock,
            i.minimum_stock,
            p.name as provider_name
          FROM recipe_ingredients ri
          LEFT JOIN ingredients i ON ri.ingredient_id = i.id
          LEFT JOIN providers p ON i.provider_id = p.id
          WHERE ri.recipe_id = ?
          ORDER BY i.name
        `, [id]) || [];
        
        // Calculate total cost and check availability
        recipe.total_cost = 0;
        recipe.can_produce = true;
        recipe.max_producible = null;
        
        for (const ing of recipe.ingredients) {
          const cost = ing.quantity * (ing.cost_per_unit || 0);
          recipe.total_cost += cost;
          ing.cost = cost;
          
          // Check if we have enough stock
          if (ing.current_stock < ing.quantity) {
            recipe.can_produce = false;
            ing.sufficient_stock = false;
          } else {
            ing.sufficient_stock = true;
            const possible = Math.floor(ing.current_stock / ing.quantity);
            if (recipe.max_producible === null || possible < recipe.max_producible) {
              recipe.max_producible = possible;
            }
          }
        }
        
        // Calculate profit margin
        if (recipe.product_price && recipe.product_price > 0) {
          recipe.profit_margin = ((recipe.product_price - recipe.total_cost) / recipe.product_price * 100).toFixed(2);
        } else {
          recipe.profit_margin = 0;
        }
      }
      
      return recipe;
    } catch (error) {
      console.error('Error fetching recipe by id:', error);
      return null;
    }
  }

  static async create(data) {
    const { 
      product_id, 
      name, 
      yield_amount = 1,
      yield_unit = 'unit',
      instructions,
      ingredients = []
    } = data;
    
    try {
      await runAsync('BEGIN TRANSACTION');
      
      // Create recipe
      const result = await runAsync(
        `INSERT INTO recipes (product_id, name, yield_amount, yield_unit, instructions) 
         VALUES (?, ?, ?, ?, ?)`,
        [product_id, name, yield_amount, yield_unit, instructions || null]
      );
      
      const recipeId = result.lastID;
      
      // Add ingredients
      for (const ing of ingredients) {
        await runAsync(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) 
           VALUES (?, ?, ?, ?)`,
          [recipeId, ing.ingredient_id, ing.quantity, ing.unit || 'unit']
        );
      }
      
      await runAsync('COMMIT');
      
      return await this.getById(recipeId);
    } catch (error) {
      await runAsync('ROLLBACK');
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  static async update(id, data) {
    const { 
      product_id, 
      name, 
      yield_amount,
      yield_unit,
      instructions,
      ingredients
    } = data;
    
    try {
      await runAsync('BEGIN TRANSACTION');
      
      // Update recipe
      await runAsync(
        `UPDATE recipes 
         SET product_id = ?, name = ?, yield_amount = ?, yield_unit = ?, instructions = ?
         WHERE id = ?`,
        [product_id, name, yield_amount || 1, yield_unit || 'unit', instructions || null, id]
      );
      
      // Update ingredients if provided
      if (ingredients && ingredients.length > 0) {
        // Delete existing ingredients
        await runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
        
        // Add new ingredients
        for (const ing of ingredients) {
          await runAsync(
            `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) 
             VALUES (?, ?, ?, ?)`,
            [id, ing.ingredient_id, ing.quantity, ing.unit || 'unit']
          );
        }
      }
      
      await runAsync('COMMIT');
      
      return await this.getById(id);
    } catch (error) {
      await runAsync('ROLLBACK');
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await runAsync('BEGIN TRANSACTION');
      
      // Delete recipe ingredients
      await runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
      
      // Delete recipe
      await runAsync('DELETE FROM recipes WHERE id = ?', [id]);
      
      await runAsync('COMMIT');
      
      return { success: true };
    } catch (error) {
      await runAsync('ROLLBACK');
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  static async produce(recipeId, quantity = 1, userId = 1) {
    try {
      await runAsync('BEGIN TRANSACTION');
      
      // Get recipe details
      const recipe = await this.getById(recipeId);
      if (!recipe) {
        throw new Error('Recipe not found');
      }
      
      if (!recipe.can_produce) {
        throw new Error('Insufficient ingredients to produce this recipe');
      }
      
      if (quantity > recipe.max_producible) {
        throw new Error(`Can only produce ${recipe.max_producible} units with current stock`);
      }
      
      // Consume ingredients
      for (const ing of recipe.ingredients) {
        const consumeQty = ing.quantity * quantity;
        
        await runAsync(
          'UPDATE ingredients SET quantity = quantity - ?, current_stock = current_stock - ? WHERE id = ?',
          [consumeQty, consumeQty, ing.ingredient_id]
        );
        
        // Log ingredient consumption
        await runAsync(
          `INSERT INTO inventory_transactions (ingredient_id, type, quantity, reason, user_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [ing.ingredient_id, 'production', -consumeQty, `Recipe: ${recipe.name} x${quantity}`, userId]
        );
      }
      
      // Update product stock
      const produceQty = recipe.yield_amount * quantity;
      await runAsync(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [produceQty, recipe.product_id]
      );
      
      // Log production
      await runAsync(
        `INSERT INTO production_logs (recipe_id, quantity, yield_amount, cost, user_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [recipeId, quantity, produceQty, recipe.total_cost * quantity, userId]
      );
      
      await runAsync('COMMIT');
      
      return {
        success: true,
        produced: produceQty,
        cost: recipe.total_cost * quantity,
        product_name: recipe.product_name
      };
    } catch (error) {
      await runAsync('ROLLBACK');
      console.error('Error producing recipe:', error);
      throw error;
    }
  }

  static async getByProduct(productId) {
    try {
      return await allAsync(
        'SELECT * FROM recipes WHERE product_id = ? ORDER BY name',
        [productId]
      ) || [];
    } catch (error) {
      console.error('Error fetching recipes by product:', error);
      return [];
    }
  }

  static async checkIngredientAvailability(recipeId, quantity = 1) {
    try {
      const recipe = await this.getById(recipeId);
      if (!recipe) return { available: false, message: 'Recipe not found' };
      
      const missingIngredients = [];
      
      for (const ing of recipe.ingredients) {
        const required = ing.quantity * quantity;
        if (ing.current_stock < required) {
          missingIngredients.push({
            name: ing.ingredient_name,
            required: required,
            available: ing.current_stock,
            missing: required - ing.current_stock,
            unit: ing.unit
          });
        }
      }
      
      return {
        available: missingIngredients.length === 0,
        missingIngredients,
        maxProducible: recipe.max_producible || 0
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, message: 'Error checking availability' };
    }
  }
}

module.exports = Recipe;