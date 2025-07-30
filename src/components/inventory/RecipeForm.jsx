import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Save, 
  X,
  Plus,
  Minus,
  AlertCircle,
  Package,
  Clock,
  Users,
  Calculator,
  ChefHat
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';

const RecipeForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  recipe = null,
  products = [],
  ingredients = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    product_id: '',
    yield_quantity: 1,
    yield_unit: 'unidad',
    preparation_time: 30,
    difficulty: 'medio',
    instructions: '',
    notes: '',
    recipe_ingredients: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Difficulty options
  const difficultyOptions = [
    { value: 'facil', label: 'Fácil' },
    { value: 'medio', label: 'Medio' },
    { value: 'dificil', label: 'Difícil' }
  ];

  // Yield unit options
  const yieldUnitOptions = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'porcion', label: 'Porción' },
    { value: 'kg', label: 'Kilogramo' },
    { value: 'litro', label: 'Litro' },
    { value: 'docena', label: 'Docena' }
  ];

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        product_id: recipe.product_id || '',
        yield_quantity: recipe.yield_quantity || 1,
        yield_unit: recipe.yield_unit || 'unidad',
        preparation_time: recipe.preparation_time || 30,
        difficulty: recipe.difficulty || 'medio',
        instructions: recipe.instructions || '',
        notes: recipe.notes || '',
        recipe_ingredients: recipe.recipe_ingredients || []
      });
    } else {
      // Reset form for new recipe
      setFormData({
        name: '',
        product_id: '',
        yield_quantity: 1,
        yield_unit: 'unidad',
        preparation_time: 30,
        difficulty: 'medio',
        instructions: '',
        notes: '',
        recipe_ingredients: []
      });
    }
    setErrors({});
  }, [recipe]);

  // Calculate total cost whenever ingredients change
  useEffect(() => {
    const cost = formData.recipe_ingredients.reduce((sum, ri) => {
      const ingredient = ingredients.find(i => i.id === ri.ingredient_id);
      if (!ingredient) return sum;
      return sum + (ri.quantity * (ingredient.unit_cost || 0));
    }, 0);
    setTotalCost(cost);
  }, [formData.recipe_ingredients, ingredients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddIngredient = () => {
    setFormData(prev => ({
      ...prev,
      recipe_ingredients: [
        ...prev.recipe_ingredients,
        {
          id: Date.now(), // Temporary ID for new ingredients
          ingredient_id: '',
          quantity: 0,
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.map((ri, i) => {
        if (i === index) {
          return { ...ri, [field]: value };
        }
        return ri;
      })
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la receta es requerido';
    }

    if (!formData.product_id) {
      newErrors.product_id = 'Debe seleccionar un producto';
    }

    if (formData.yield_quantity <= 0) {
      newErrors.yield_quantity = 'La cantidad debe ser mayor a 0';
    }

    if (formData.recipe_ingredients.length === 0) {
      newErrors.ingredients = 'Debe agregar al menos un ingrediente';
    }

    // Validate each ingredient
    formData.recipe_ingredients.forEach((ri, index) => {
      if (!ri.ingredient_id) {
        newErrors[`ingredient_${index}_id`] = 'Seleccione un ingrediente';
      }
      if (ri.quantity <= 0) {
        newErrors[`ingredient_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        yield_quantity: parseFloat(formData.yield_quantity),
        preparation_time: parseInt(formData.preparation_time),
        total_cost: totalCost,
        cost_per_unit: totalCost / parseFloat(formData.yield_quantity),
        recipe_ingredients: formData.recipe_ingredients.map(ri => ({
          ...ri,
          ingredient_id: parseInt(ri.ingredient_id),
          quantity: parseFloat(ri.quantity)
        }))
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving recipe:', error);
      setErrors({ general: 'Error al guardar la receta' });
    } finally {
      setLoading(false);
    }
  };

  const getIngredientSubtotal = (ri) => {
    const ingredient = ingredients.find(i => i.id === parseInt(ri.ingredient_id));
    if (!ingredient) return 0;
    return ri.quantity * (ingredient.unit_cost || 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {recipe ? 'Editar Receta' : 'Nueva Receta'}
        </div>
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la Receta"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Helado de Vainilla Premium"
              error={errors.name}
              required
            />

            <Select
              label="Producto Final"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Seleccionar producto' },
                ...(Array.isArray(products) ? products.map(p => ({
                  value: p.id.toString(),
                  label: p.name
                })) : [])
              ]}
              error={errors.product_id}
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Rendimiento"
              name="yield_quantity"
              type="number"
              step="0.01"
              value={formData.yield_quantity}
              onChange={handleChange}
              error={errors.yield_quantity}
              icon={Package}
              required
            />

            <Select
              label="Unidad"
              name="yield_unit"
              value={formData.yield_unit}
              onChange={handleChange}
              options={yieldUnitOptions}
            />

            <Input
              label="Tiempo (min)"
              name="preparation_time"
              type="number"
              value={formData.preparation_time}
              onChange={handleChange}
              icon={Clock}
            />

            <Select
              label="Dificultad"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              options={difficultyOptions}
              icon={Users}
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ingredientes
            </h3>
            <Button
              type="button"
              onClick={handleAddIngredient}
              variant="outline"
              size="sm"
              icon={Plus}
            >
              Agregar Ingrediente
            </Button>
          </div>

          {errors.ingredients && (
            <p className="text-sm text-red-600">{errors.ingredients}</p>
          )}

          <div className="space-y-3">
            {formData.recipe_ingredients.map((ri, index) => {
              const ingredient = ingredients.find(i => i.id === parseInt(ri.ingredient_id));
              const subtotal = getIngredientSubtotal(ri);
              
              return (
                <div 
                  key={ri.id || index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                      label="Ingrediente"
                      value={ri.ingredient_id}
                      onChange={(e) => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar' },
                        ...(Array.isArray(ingredients) ? ingredients.map(ing => ({
                          value: ing.id.toString(),
                          label: `${ing.name} (${ing.unit})`
                        })) : [])
                      ]}
                      error={errors[`ingredient_${index}_id`]}
                    />

                    <Input
                      label={`Cantidad ${ingredient ? `(${ingredient.unit})` : ''}`}
                      type="number"
                      step="0.01"
                      value={ri.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      error={errors[`ingredient_${index}_quantity`]}
                    />

                    <Input
                      label="Notas"
                      value={ri.notes || ''}
                      onChange={(e) => handleIngredientChange(index, 'notes', e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${subtotal.toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      variant="ghost"
                      size="sm"
                      icon={Minus}
                      className="text-red-600 hover:text-red-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cost Summary */}
          {formData.recipe_ingredients.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Costo Total de Ingredientes:
                </span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Costo por {formData.yield_unit}:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(totalCost / (formData.yield_quantity || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Instrucciones
          </h3>
          
          <Input
            label="Instrucciones de Preparación"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="Describa el proceso de preparación paso a paso..."
            multiline
            rows={4}
          />

          <Input
            label="Notas Adicionales"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notas, tips o consideraciones especiales (opcional)"
            multiline
            rows={2}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            icon={X}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
          >
            {recipe ? 'Actualizar' : 'Crear'} Receta
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecipeForm;