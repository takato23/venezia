const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../database/db');
const Ingredient = require('../models/Ingredient.supabase');
const Recipe = require('../models/Recipe.supabase');
const { flexibleAuth } = require('../middleware/flexibleAuth');
const { getNotificationService } = require('../services/notificationService.instance');

// Determine if we should use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || process.env.SUPABASE_URL;

// Apply flexible auth to all routes
router.use(flexibleAuth);

// ==================== INGREDIENT ENDPOINTS ====================

// Get all ingredients
router.get('/ingredients', async (req, res) => {
  try {
    const { category, low_stock, search } = req.query;
    const filters = { category, low_stock, search };

    if (USE_SUPABASE) {
      try {
        const ingredients = await Ingredient.getAll(filters);
        return res.json({
          success: true,
          data: ingredients
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT * FROM ingredients
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (low_stock === 'true') {
      query += ` AND current_stock <= minimum_stock`;
    }

    if (search) {
      query += ` AND (name LIKE ? OR supplier LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY name ASC`;

    const ingredients = await allAsync(query, params);

    res.json({
      success: true,
      data: ingredients
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingredientes',
      error: error.message
    });
  }
});

// Get ingredient by ID
router.get('/ingredients/:id', async (req, res) => {
  try {
    const ingredientId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const ingredient = await Ingredient.getById(ingredientId);
        if (!ingredient) {
          return res.status(404).json({
            success: false,
            message: 'Ingrediente no encontrado'
          });
        }
        return res.json({
          success: true,
          data: ingredient
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const ingredient = await getAsync(
      'SELECT * FROM ingredients WHERE id = ?',
      [ingredientId]
    );

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    // Get recipes using this ingredient
    const recipes = await allAsync(`
      SELECT r.id, r.name, ri.quantity
      FROM recipe_ingredients ri
      INNER JOIN recipes r ON ri.recipe_id = r.id
      WHERE ri.ingredient_id = ?
    `, [ingredientId]);

    ingredient.recipe_ingredients = recipes;

    res.json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingrediente',
      error: error.message
    });
  }
});

// Create new ingredient
router.post('/ingredients', async (req, res) => {
  try {
    const ingredientData = req.body;

    // Validate required fields
    if (!ingredientData.name || !ingredientData.unit || ingredientData.cost_per_unit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, unidad y costo por unidad son requeridos'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Ingredient.create(ingredientData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const result = await runAsync(
      `INSERT INTO ingredients (
        name, unit, cost_per_unit, current_stock, minimum_stock,
        supplier, category, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        ingredientData.name,
        ingredientData.unit,
        ingredientData.cost_per_unit,
        ingredientData.current_stock || 0,
        ingredientData.minimum_stock || 0,
        ingredientData.supplier || null,
        ingredientData.category || null,
        ingredientData.description || null
      ]
    );

    res.json({
      success: true,
      ingredient: {
        id: result.id,
        ...ingredientData
      }
    });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear ingrediente',
      error: error.message
    });
  }
});

// Update ingredient
router.put('/ingredients/:id', async (req, res) => {
  try {
    const ingredientId = req.params.id;
    const updateData = req.body;

    if (USE_SUPABASE) {
      try {
        const result = await Ingredient.update(ingredientId, updateData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    fields.push(`updated_at = datetime('now')`);
    values.push(ingredientId);

    await runAsync(
      `UPDATE ingredients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const ingredient = await getAsync(
      'SELECT * FROM ingredients WHERE id = ?',
      [ingredientId]
    );

    // Check stock levels and send notifications if needed
    const notificationService = getNotificationService();
    if (notificationService && ingredient) {
      if (ingredient.current_stock === 0) {
        notificationService.notifyOutOfStock({
          id: ingredient.id,
          name: ingredient.name,
          store_id: req.user?.store_id || 1
        }).catch(err => console.error('Error sending notification:', err));
      } else if (ingredient.current_stock <= ingredient.minimum_stock) {
        notificationService.notifyLowStock(
          { id: ingredient.id, name: ingredient.name, store_id: req.user?.store_id || 1 },
          ingredient.current_stock,
          ingredient.minimum_stock
        ).catch(err => console.error('Error sending notification:', err));
      }
    }

    res.json({
      success: true,
      ingredient
    });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ingrediente',
      error: error.message
    });
  }
});

// Delete ingredient
router.delete('/ingredients/:id', async (req, res) => {
  try {
    const ingredientId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const result = await Ingredient.delete(ingredientId);
        return res.json(result);
      } catch (supabaseError) {
        if (supabaseError.message.includes('used in recipes')) {
          return res.status(400).json({
            success: false,
            message: 'No se puede eliminar un ingrediente que está siendo usado en recetas'
          });
        }
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Check if ingredient is used in recipes
    const recipeCount = await getAsync(
      'SELECT COUNT(*) as count FROM recipe_ingredients WHERE ingredient_id = ?',
      [ingredientId]
    );

    if (recipeCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un ingrediente que está siendo usado en recetas'
      });
    }

    await runAsync('DELETE FROM ingredients WHERE id = ?', [ingredientId]);

    res.json({
      success: true,
      message: 'Ingrediente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ingrediente',
      error: error.message
    });
  }
});

// Add stock to ingredient
router.post('/ingredients/:id/add-stock', async (req, res) => {
  try {
    const ingredientId = req.params.id;
    const { quantity, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Ingredient.addStock(ingredientId, quantity, notes);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const ingredient = await getAsync(
      'SELECT current_stock, name FROM ingredients WHERE id = ?',
      [ingredientId]
    );

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    const newStock = (ingredient.current_stock || 0) + quantity;

    await runAsync(
      'UPDATE ingredients SET current_stock = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [newStock, ingredientId]
    );

    // Create stock movement record
    await runAsync(
      `INSERT INTO stock_movements (
        ingredient_id, type, quantity, notes, created_at
      ) VALUES (?, 'in', ?, ?, datetime('now'))`,
      [ingredientId, quantity, notes || `Stock agregado para ${ingredient.name}`]
    );

    res.json({
      success: true,
      previous_stock: ingredient.current_stock,
      new_stock: newStock
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar stock',
      error: error.message
    });
  }
});

// Get low stock ingredients
router.get('/ingredients/status/low-stock', async (req, res) => {
  try {
    if (USE_SUPABASE) {
      try {
        const ingredients = await Ingredient.getLowStockIngredients();
        return res.json({
          success: true,
          data: ingredients
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const ingredients = await allAsync(`
      SELECT *,
        CASE 
          WHEN minimum_stock > 0 THEN ROUND((current_stock * 100.0 / minimum_stock), 0)
          ELSE 0
        END as stock_percentage
      FROM ingredients
      WHERE current_stock <= minimum_stock
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: ingredients
    });
  } catch (error) {
    console.error('Error fetching low stock ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingredientes con bajo stock',
      error: error.message
    });
  }
});

// Get cost analysis
router.get('/ingredients/analysis/cost', async (req, res) => {
  try {
    if (USE_SUPABASE) {
      try {
        const analysis = await Ingredient.getCostAnalysis();
        return res.json({
          success: true,
          data: analysis
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const ingredients = await allAsync('SELECT * FROM ingredients ORDER BY cost_per_unit DESC');
    
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

    res.json({
      success: true,
      data: {
        total_value: totalValue,
        total_ingredients: ingredients.length,
        by_category: byCategory,
        most_valuable: ingredients.slice(0, 10).map(ing => ({
          name: ing.name,
          unit_cost: ing.cost_per_unit,
          stock: ing.current_stock,
          total_value: ing.current_stock * ing.cost_per_unit
        }))
      }
    });
  } catch (error) {
    console.error('Error getting cost analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de costos',
      error: error.message
    });
  }
});

// ==================== RECIPE ENDPOINTS ====================

// Get all recipes
router.get('/recipes', async (req, res) => {
  try {
    const { category, is_active, search } = req.query;
    const filters = { category, is_active, search };

    if (USE_SUPABASE) {
      try {
        const recipes = await Recipe.getAll(filters);
        return res.json({
          success: true,
          data: recipes
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT r.*, 
        GROUP_CONCAT(i.name, ', ') as ingredients_list
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ` AND r.category = ?`;
      params.push(category);
    }

    if (is_active !== undefined) {
      query += ` AND r.is_active = ?`;
      params.push(is_active === 'true' ? 1 : 0);
    }

    if (search) {
      query += ` AND (r.name LIKE ? OR r.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY r.id ORDER BY r.name ASC`;

    const recipes = await allAsync(query, params);

    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recetas',
      error: error.message
    });
  }
});

// Get recipe by ID
router.get('/recipes/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const recipe = await Recipe.getById(recipeId);
        if (!recipe) {
          return res.status(404).json({
            success: false,
            message: 'Receta no encontrada'
          });
        }
        return res.json({
          success: true,
          data: recipe
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const recipe = await getAsync(
      'SELECT * FROM recipes WHERE id = ?',
      [recipeId]
    );

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Get recipe ingredients
    const ingredients = await allAsync(`
      SELECT ri.quantity, i.*
      FROM recipe_ingredients ri
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `, [recipeId]);

    recipe.recipe_ingredients = ingredients.map(ing => ({
      quantity: ing.quantity,
      ingredient: ing
    }));

    // Check availability
    const ingredientQuantities = ingredients.map(ing => ({
      ingredient_id: ing.id,
      quantity_needed: ing.quantity
    }));

    const availability = [];
    let allAvailable = true;

    for (const item of ingredientQuantities) {
      const isAvailable = item.ingredient.current_stock >= item.quantity_needed;
      if (!isAvailable) allAvailable = false;

      availability.push({
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredient.name,
        unit: item.ingredient.unit,
        current_stock: item.ingredient.current_stock,
        quantity_needed: item.quantity_needed,
        is_available: isAvailable,
        shortage: isAvailable ? 0 : item.quantity_needed - item.ingredient.current_stock
      });
    }

    recipe.availability = {
      all_available: allAvailable,
      availability
    };

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener receta',
      error: error.message
    });
  }
});

// Create new recipe
router.post('/recipes', async (req, res) => {
  try {
    const recipeData = req.body;

    // Validate required fields
    if (!recipeData.name || !recipeData.selling_price) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y precio de venta son requeridos'
      });
    }

    if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un ingrediente'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Recipe.create(recipeData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Calculate recipe cost
    let cost = 0;
    for (const ing of recipeData.ingredients) {
      const ingredient = await getAsync(
        'SELECT cost_per_unit FROM ingredients WHERE id = ?',
        [ing.ingredient_id]
      );
      if (ingredient) {
        cost += ingredient.cost_per_unit * ing.quantity;
      }
    }

    const result = await runAsync(
      `INSERT INTO recipes (
        name, category, description, preparation_time, difficulty,
        cost, selling_price, profit_margin, image_url, instructions,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [
        recipeData.name,
        recipeData.category || null,
        recipeData.description || null,
        recipeData.preparation_time || null,
        recipeData.difficulty || null,
        cost,
        recipeData.selling_price,
        recipeData.selling_price - cost,
        recipeData.image_url || null,
        recipeData.instructions || null
      ]
    );

    // Create recipe-ingredient relationships
    for (const ing of recipeData.ingredients) {
      await runAsync(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)',
        [result.id, ing.ingredient_id, ing.quantity]
      );
    }

    res.json({
      success: true,
      recipe: {
        id: result.id,
        ...recipeData,
        cost,
        profit_margin: recipeData.selling_price - cost
      }
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear receta',
      error: error.message
    });
  }
});

// Update recipe
router.put('/recipes/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const updateData = req.body;

    if (USE_SUPABASE) {
      try {
        const result = await Recipe.update(recipeId, updateData);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const { ingredients, ...recipeData } = updateData;

    // If ingredients are being updated, recalculate cost
    if (ingredients && ingredients.length > 0) {
      let cost = 0;
      for (const ing of ingredients) {
        const ingredient = await getAsync(
          'SELECT cost_per_unit FROM ingredients WHERE id = ?',
          [ing.ingredient_id]
        );
        if (ingredient) {
          cost += ingredient.cost_per_unit * ing.quantity;
        }
      }
      recipeData.cost = cost;
      if (recipeData.selling_price) {
        recipeData.profit_margin = recipeData.selling_price - cost;
      }
    }

    // Update recipe
    const fields = [];
    const values = [];

    Object.keys(recipeData).forEach(key => {
      if (key !== 'id' && recipeData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(recipeData[key]);
      }
    });

    if (fields.length > 0) {
      fields.push(`updated_at = datetime('now')`);
      values.push(recipeId);

      await runAsync(
        `UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update ingredients if provided
    if (ingredients && ingredients.length > 0) {
      // Delete existing relationships
      await runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);

      // Insert new relationships
      for (const ing of ingredients) {
        await runAsync(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)',
          [recipeId, ing.ingredient_id, ing.quantity]
        );
      }
    }

    const recipe = await getAsync('SELECT * FROM recipes WHERE id = ?', [recipeId]);

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar receta',
      error: error.message
    });
  }
});

// Delete recipe
router.delete('/recipes/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const result = await Recipe.delete(recipeId);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Delete recipe-ingredient relationships first
    await runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
    
    // Delete recipe
    await runAsync('DELETE FROM recipes WHERE id = ?', [recipeId]);

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar receta',
      error: error.message
    });
  }
});

// Calculate recipe cost
router.get('/recipes/:id/calculate-cost', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const recipe = await Recipe.getById(recipeId);
        if (!recipe) {
          return res.status(404).json({
            success: false,
            message: 'Receta no encontrada'
          });
        }

        const cost = await Recipe.calculateRecipeCost(
          recipe.recipe_ingredients.map(ri => ({
            ingredient_id: ri.ingredient.id,
            quantity: ri.quantity
          }))
        );

        return res.json({
          success: true,
          data: {
            recipe_id: recipeId,
            recipe_name: recipe.name,
            cost,
            selling_price: recipe.selling_price,
            profit_margin: recipe.selling_price - cost,
            profit_percentage: ((recipe.selling_price - cost) / recipe.selling_price * 100).toFixed(2)
          }
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const ingredients = await allAsync(`
      SELECT ri.quantity, i.cost_per_unit, i.name
      FROM recipe_ingredients ri
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `, [recipeId]);

    const recipe = await getAsync('SELECT name, selling_price FROM recipes WHERE id = ?', [recipeId]);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const cost = ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.cost_per_unit), 0);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        recipe_name: recipe.name,
        cost,
        selling_price: recipe.selling_price,
        profit_margin: recipe.selling_price - cost,
        profit_percentage: ((recipe.selling_price - cost) / recipe.selling_price * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error calculating recipe cost:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular costo de receta',
      error: error.message
    });
  }
});

// Check recipe availability
router.get('/recipes/:id/check-availability', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (USE_SUPABASE) {
      try {
        const recipe = await Recipe.getById(recipeId);
        if (!recipe) {
          return res.status(404).json({
            success: false,
            message: 'Receta no encontrada'
          });
        }

        return res.json({
          success: true,
          data: recipe.availability
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    const ingredients = await allAsync(`
      SELECT ri.quantity as needed, i.id, i.name, i.unit, i.current_stock
      FROM recipe_ingredients ri
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `, [recipeId]);

    const availability = [];
    let allAvailable = true;

    for (const ing of ingredients) {
      const isAvailable = ing.current_stock >= ing.needed;
      if (!isAvailable) allAvailable = false;

      availability.push({
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        unit: ing.unit,
        current_stock: ing.current_stock,
        quantity_needed: ing.needed,
        is_available: isAvailable,
        shortage: isAvailable ? 0 : ing.needed - ing.current_stock
      });
    }

    res.json({
      success: true,
      data: {
        all_available: allAvailable,
        availability
      }
    });
  } catch (error) {
    console.error('Error checking recipe availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad de receta',
      error: error.message
    });
  }
});

// Make recipe (deduct ingredients)
router.post('/recipes/:id/make', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { quantity = 1 } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    if (USE_SUPABASE) {
      try {
        const result = await Recipe.makeRecipe(recipeId, quantity);
        return res.json(result);
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    // Get recipe and ingredients
    const recipe = await getAsync('SELECT * FROM recipes WHERE id = ?', [recipeId]);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    const ingredients = await allAsync(`
      SELECT ri.quantity as needed, i.*
      FROM recipe_ingredients ri
      INNER JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `, [recipeId]);

    // Check availability
    const shortages = [];
    for (const ing of ingredients) {
      const totalNeeded = ing.needed * quantity;
      if (ing.current_stock < totalNeeded) {
        shortages.push({
          ingredient: ing.name,
          available: ing.current_stock,
          needed: totalNeeded,
          shortage: totalNeeded - ing.current_stock
        });
      }
    }

    if (shortages.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente para algunos ingredientes',
        shortages
      });
    }

    // Deduct ingredients
    for (const ing of ingredients) {
      const totalNeeded = ing.needed * quantity;
      const newStock = ing.current_stock - totalNeeded;

      await runAsync(
        'UPDATE ingredients SET current_stock = ?, updated_at = datetime(\'now\') WHERE id = ?',
        [newStock, ing.id]
      );

      // Create stock movement
      await runAsync(
        `INSERT INTO stock_movements (
          ingredient_id, type, quantity, notes, created_at
        ) VALUES (?, 'out', ?, ?, datetime('now'))`,
        [ing.id, totalNeeded, `Usado en ${quantity} x ${recipe.name}`]
      );
    }

    // Create production record
    await runAsync(
      `INSERT INTO recipe_productions (
        recipe_id, quantity, cost, created_at
      ) VALUES (?, ?, ?, datetime('now'))`,
      [recipeId, quantity, recipe.cost * quantity]
    );

    res.json({
      success: true,
      message: `${quantity} unidad(es) de ${recipe.name} producida(s) exitosamente`,
      production: {
        recipe_id: recipeId,
        recipe_name: recipe.name,
        quantity,
        total_cost: recipe.cost * quantity,
        unit_cost: recipe.cost
      }
    });
  } catch (error) {
    console.error('Error making recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al producir receta',
      error: error.message
    });
  }
});

// Get production analytics
router.get('/recipes/analytics/production', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (USE_SUPABASE) {
      try {
        const analytics = await Recipe.getProductionAnalytics(start_date, end_date);
        return res.json({
          success: true,
          data: analytics
        });
      } catch (supabaseError) {
        console.error('Supabase error, falling back to SQLite:', supabaseError);
      }
    }

    // SQLite fallback
    let query = `
      SELECT 
        r.id,
        r.name,
        COUNT(rp.id) as production_count,
        SUM(rp.quantity) as total_quantity,
        SUM(rp.cost) as total_cost,
        AVG(rp.cost / rp.quantity) as avg_unit_cost
      FROM recipes r
      LEFT JOIN recipe_productions rp ON r.id = rp.recipe_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ` AND rp.created_at >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND rp.created_at <= ?`;
      params.push(end_date);
    }

    query += ` GROUP BY r.id ORDER BY total_quantity DESC`;

    const analytics = await allAsync(query, params);

    res.json({
      success: true,
      data: {
        recipes: analytics,
        period: {
          start: start_date || 'all time',
          end: end_date || 'now'
        }
      }
    });
  } catch (error) {
    console.error('Error getting production analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de producción',
      error: error.message
    });
  }
});

module.exports = router;