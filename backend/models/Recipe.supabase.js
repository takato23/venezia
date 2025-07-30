const { supabase } = require('../config/supabase');
const Ingredient = require('./Ingredient.supabase');

class Recipe {
  static async create(recipeData) {
    const {
      name,
      category,
      description,
      preparation_time,
      difficulty,
      selling_price,
      image_url,
      instructions,
      ingredients = [] // [{ ingredient_id, quantity }]
    } = recipeData;

    try {
      // Calculate recipe cost based on ingredients
      const cost = await this.calculateRecipeCost(ingredients);

      // Create the recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name,
          category,
          description,
          preparation_time,
          difficulty,
          cost,
          selling_price,
          profit_margin: selling_price - cost,
          image_url,
          instructions,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create recipe-ingredient relationships
      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map(ing => ({
          recipe_id: recipe.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredients);

        if (ingredientsError) throw ingredientsError;
      }

      return {
        success: true,
        recipe
      };

    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const { ingredients, ...recipeData } = updateData;

    try {
      // If ingredients are being updated, recalculate cost
      if (ingredients && ingredients.length > 0) {
        recipeData.cost = await this.calculateRecipeCost(ingredients);
        if (recipeData.selling_price) {
          recipeData.profit_margin = recipeData.selling_price - recipeData.cost;
        }
      }

      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          ...recipeData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Update ingredients if provided
      if (ingredients && ingredients.length > 0) {
        // Delete existing relationships
        const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', id);

        if (deleteError) throw deleteError;

        // Insert new relationships
        const recipeIngredients = ingredients.map(ing => ({
          recipe_id: id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredients);

        if (ingredientsError) throw ingredientsError;
      }

      return {
        success: true,
        recipe
      };

    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients(
            quantity,
            ingredient:ingredients(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Calculate availability for the recipe
      if (recipe.recipe_ingredients) {
        const ingredientQuantities = recipe.recipe_ingredients.map(ri => ({
          ingredient_id: ri.ingredient.id,
          quantity_needed: ri.quantity
        }));

        const availability = await Ingredient.checkAvailability(ingredientQuantities);
        recipe.availability = availability;
      }

      return recipe;

    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients(
            quantity,
            ingredient:ingredients(id, name, current_stock)
          )
        `)
        .order('name', { ascending: true });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: recipes, error } = await query;

      if (error) throw error;

      // Check availability for each recipe
      const recipesWithAvailability = await Promise.all(
        recipes.map(async (recipe) => {
          if (recipe.recipe_ingredients) {
            const ingredientQuantities = recipe.recipe_ingredients.map(ri => ({
              ingredient_id: ri.ingredient.id,
              quantity_needed: ri.quantity
            }));

            const availability = await Ingredient.checkAvailability(ingredientQuantities);
            return {
              ...recipe,
              can_make: availability.all_available,
              missing_ingredients: availability.availability.filter(a => !a.is_available)
            };
          }
          return recipe;
        })
      );

      return recipesWithAvailability;

    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Delete recipe-ingredient relationships first
      const { error: relError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (relError) throw relError;

      // Delete the recipe
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        message: 'Recipe deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  static async calculateRecipeCost(ingredients) {
    try {
      let totalCost = 0;

      for (const item of ingredients) {
        const { data: ingredient, error } = await supabase
          .from('ingredients')
          .select('cost_per_unit')
          .eq('id', item.ingredient_id)
          .single();

        if (error) throw error;

        totalCost += ingredient.cost_per_unit * item.quantity;
      }

      return totalCost;

    } catch (error) {
      console.error('Error calculating recipe cost:', error);
      throw error;
    }
  }

  static async updateRecipeCosts() {
    try {
      // Get all recipes with their ingredients
      const { data: recipes, error: fetchError } = await supabase
        .from('recipes')
        .select(`
          id,
          selling_price,
          recipe_ingredients(
            quantity,
            ingredient:ingredients(cost_per_unit)
          )
        `);

      if (fetchError) throw fetchError;

      // Update each recipe's cost
      const updates = [];
      for (const recipe of recipes) {
        let cost = 0;
        recipe.recipe_ingredients.forEach(ri => {
          cost += ri.ingredient.cost_per_unit * ri.quantity;
        });

        updates.push({
          id: recipe.id,
          cost,
          profit_margin: recipe.selling_price - cost,
          updated_at: new Date().toISOString()
        });
      }

      // Batch update recipes
      for (const update of updates) {
        const { error } = await supabase
          .from('recipes')
          .update({
            cost: update.cost,
            profit_margin: update.profit_margin,
            updated_at: update.updated_at
          })
          .eq('id', update.id);

        if (error) console.error(`Error updating recipe ${update.id}:`, error);
      }

      return {
        success: true,
        updated_count: updates.length,
        updates
      };

    } catch (error) {
      console.error('Error updating recipe costs:', error);
      throw error;
    }
  }

  static async makeRecipe(recipeId, quantity = 1) {
    try {
      // Get recipe with ingredients
      const recipe = await this.getById(recipeId);

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      // Check availability
      const ingredientQuantities = recipe.recipe_ingredients.map(ri => ({
        ingredient_id: ri.ingredient.id,
        quantity_needed: ri.quantity * quantity
      }));

      const availability = await Ingredient.checkAvailability(ingredientQuantities);

      if (!availability.all_available) {
        throw new Error('Insufficient ingredients available');
      }

      // Deduct ingredients from stock
      const deductions = [];
      for (const ri of recipe.recipe_ingredients) {
        const result = await Ingredient.deductStock(
          ri.ingredient.id,
          ri.quantity * quantity,
          `Used for ${quantity}x ${recipe.name}`
        );
        deductions.push(result);
      }

      // Create production record
      const { data: production, error: productionError } = await supabase
        .from('recipe_productions')
        .insert({
          recipe_id: recipeId,
          quantity,
          total_cost: recipe.cost * quantity,
          notes: `Produced ${quantity} units of ${recipe.name}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (productionError) {
        console.error('Error creating production record:', productionError);
      }

      return {
        success: true,
        recipe_name: recipe.name,
        quantity_made: quantity,
        total_cost: recipe.cost * quantity,
        ingredients_deducted: deductions,
        production_id: production?.id
      };

    } catch (error) {
      console.error('Error making recipe:', error);
      throw error;
    }
  }

  static async getPopularRecipes(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get production records
      const { data: productions, error } = await supabase
        .from('recipe_productions')
        .select(`
          quantity,
          recipe:recipes(id, name, selling_price, cost)
        `)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Aggregate by recipe
      const recipeStats = {};
      productions.forEach(prod => {
        if (prod.recipe) {
          const recipeId = prod.recipe.id;
          if (!recipeStats[recipeId]) {
            recipeStats[recipeId] = {
              id: recipeId,
              name: prod.recipe.name,
              times_made: 0,
              total_quantity: 0,
              revenue_potential: 0,
              cost_incurred: 0
            };
          }
          recipeStats[recipeId].times_made += 1;
          recipeStats[recipeId].total_quantity += prod.quantity;
          recipeStats[recipeId].revenue_potential += prod.quantity * prod.recipe.selling_price;
          recipeStats[recipeId].cost_incurred += prod.quantity * prod.recipe.cost;
        }
      });

      // Convert to array and sort
      const popularRecipes = Object.values(recipeStats)
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      return popularRecipes;

    } catch (error) {
      console.error('Error fetching popular recipes:', error);
      throw error;
    }
  }

  static async getProfitabilityAnalysis() {
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_active', true)
        .order('profit_margin', { ascending: false });

      if (error) throw error;

      const analysis = {
        most_profitable: recipes.slice(0, 10).map(r => ({
          name: r.name,
          cost: r.cost,
          selling_price: r.selling_price,
          profit_margin: r.profit_margin,
          profit_percentage: r.selling_price > 0 
            ? Math.round((r.profit_margin / r.selling_price) * 100) 
            : 0
        })),
        least_profitable: recipes.slice(-10).reverse().map(r => ({
          name: r.name,
          cost: r.cost,
          selling_price: r.selling_price,
          profit_margin: r.profit_margin,
          profit_percentage: r.selling_price > 0 
            ? Math.round((r.profit_margin / r.selling_price) * 100) 
            : 0
        })),
        average_profit_margin: recipes.reduce((sum, r) => sum + r.profit_margin, 0) / recipes.length,
        total_recipes: recipes.length
      };

      return analysis;

    } catch (error) {
      console.error('Error getting profitability analysis:', error);
      throw error;
    }
  }

  static async searchByIngredient(ingredientId) {
    try {
      const { data: recipes, error } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe:recipes(*)
        `)
        .eq('ingredient_id', ingredientId);

      if (error) throw error;

      return recipes.map(r => r.recipe).filter(r => r !== null);

    } catch (error) {
      console.error('Error searching recipes by ingredient:', error);
      throw error;
    }
  }

  static async toggleActive(id) {
    try {
      // Get current status
      const { data: recipe, error: fetchError } = await supabase
        .from('recipes')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle status
      const { data: updated, error: updateError } = await supabase
        .from('recipes')
        .update({
          is_active: !recipe.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        recipe: updated
      };

    } catch (error) {
      console.error('Error toggling recipe status:', error);
      throw error;
    }
  }
}

module.exports = Recipe;