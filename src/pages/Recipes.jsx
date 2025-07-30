import React, { useState, useMemo } from 'react';
import { 
  ChefHat,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  DollarSign,
  Clock,
  BarChart3,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingUp,
  RefreshCw,
  Download,
  Calculator,
  Play,
  Info,
  Star,
  Users,
  Beaker,
  BookOpen
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const RecipesPage = () => {
  const { success, error, warning } = useToast();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showCostAnalysisModal, setShowCostAnalysisModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [recipeAvailability, setRecipeAvailability] = useState({});
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    product_id: '',
    category: '',
    yield_quantity: 1,
    yield_unit: 'kg',
    preparation_time: 30,
    difficulty: 'medio',
    instructions: '',
    notes: '',
    ingredients: []
  });
  
  const [productionData, setProductionData] = useState({
    quantity: 1,
    notes: ''
  });
  
  // API Data
  const { 
    data: recipes, 
    loading: loadingRecipes, 
    refetch: refetchRecipes 
  } = useApiCache('/api/recipes');
  
  const { 
    data: ingredients, 
    loading: loadingIngredients 
  } = useApiCache('/api/inventory/ingredients');
  
  const { 
    data: products, 
    loading: loadingProducts 
  } = useApiCache('/api/products');
  
  const { 
    data: recipesSummary, 
    loading: loadingSummary 
  } = useApiCache('/api/recipes/summary');
  
  const loading = loadingRecipes || loadingIngredients || loadingProducts || loadingSummary;
  
  // Safe data
  const safeRecipes = Array.isArray(recipes) ? recipes : [];
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeSummary = recipesSummary || {
    total_recipes: 0,
    available_recipes: 0,
    total_cost: 0,
    average_cost: 0
  };
  
  // Check recipe availability on load
  React.useEffect(() => {
    if (safeRecipes.length > 0) {
      checkAllRecipesAvailability();
    }
  }, [recipes]);
  
  // Check availability for all recipes
  const checkAllRecipesAvailability = async () => {
    const availability = {};
    
    for (const recipe of safeRecipes) {
      try {
        const response = await fetch(`/api/recipes/${recipe.id}/availability`);
        if (response.ok) {
          const data = await response.json();
          availability[recipe.id] = data;
        }
      } catch (err) {
        console.error('Error checking availability:', err);
      }
    }
    
    setRecipeAvailability(availability);
  };
  
  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let filtered = [...safeRecipes];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(recipe => 
        recipe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === categoryFilter);
    }
    
    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === difficultyFilter);
    }
    
    // Availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        const availability = recipeAvailability[recipe.id];
        if (!availability) return false;
        return availabilityFilter === 'available' ? availability.can_produce : !availability.can_produce;
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return (b.total_cost || 0) - (a.total_cost || 0);
        case 'time':
          return (a.preparation_time || 0) - (b.preparation_time || 0);
        case 'popularity':
          return (b.production_count || 0) - (a.production_count || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [safeRecipes, searchTerm, categoryFilter, difficultyFilter, availabilityFilter, sortBy, recipeAvailability]);
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(safeRecipes.map(r => r.category).filter(Boolean));
    return Array.from(cats);
  }, [safeRecipes]);
  
  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const endpoint = showEditModal 
        ? `/api/recipes/${selectedRecipe.id}`
        : '/api/recipes';
      
      const method = showEditModal ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      success(
        showEditModal ? 'Receta actualizada' : 'Receta creada',
        `${formData.name} se ha ${showEditModal ? 'actualizado' : 'creado'} correctamente`
      );
      
      refetchRecipes();
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      error('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleProduction = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const response = await fetch(`/api/recipes/${selectedRecipe.id}/produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productionData)
      });
      
      if (!response.ok) throw new Error('Error al producir');
      
      const result = await response.json();
      
      success(
        'Producción completada',
        `Se produjeron ${productionData.quantity} lotes de ${selectedRecipe.name}`
      );
      
      refetchRecipes();
      checkAllRecipesAvailability();
      setShowProductionModal(false);
      resetProductionForm();
    } catch (err) {
      error('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleDelete = async (recipe) => {
    if (!confirm(`¿Estás seguro de eliminar la receta ${recipe.name}?`)) return;
    
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar');
      
      success('Receta eliminada', `${recipe.name} ha sido eliminada`);
      refetchRecipes();
    } catch (err) {
      error('Error', err.message);
    }
  };
  
  const handleDuplicate = async (recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/duplicate`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Error al duplicar');
      
      success('Receta duplicada', `${recipe.name} ha sido duplicada`);
      refetchRecipes();
    } catch (err) {
      error('Error', err.message);
    }
  };
  
  const calculateCost = async (recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/calculate-cost`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Error al calcular costo');
      
      const data = await response.json();
      
      success(
        'Costo calculado',
        `Costo total: $${data.total_cost.toFixed(2)}, Costo por ${recipe.yield_unit}: $${data.cost_per_unit.toFixed(2)}`
      );
      
      refetchRecipes();
    } catch (err) {
      error('Error', err.message);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      product_id: '',
      category: '',
      yield_quantity: 1,
      yield_unit: 'kg',
      preparation_time: 30,
      difficulty: 'medio',
      instructions: '',
      notes: '',
      ingredients: []
    });
    setSelectedRecipe(null);
  };
  
  const resetProductionForm = () => {
    setProductionData({
      quantity: 1,
      notes: ''
    });
    setSelectedRecipe(null);
  };
  
  const openEditModal = (recipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      name: recipe.name,
      product_id: recipe.product_id || '',
      category: recipe.category || '',
      yield_quantity: recipe.yield_quantity || 1,
      yield_unit: recipe.yield_unit || 'kg',
      preparation_time: recipe.preparation_time || 30,
      difficulty: recipe.difficulty || 'medio',
      instructions: recipe.instructions || '',
      notes: recipe.notes || '',
      ingredients: recipe.ingredients || []
    });
    setShowEditModal(true);
  };
  
  const openProductionModal = (recipe) => {
    setSelectedRecipe(recipe);
    setProductionData({
      quantity: 1,
      notes: ''
    });
    setShowProductionModal(true);
  };
  
  const openCostAnalysisModal = (recipe) => {
    setSelectedRecipe(recipe);
    setShowCostAnalysisModal(true);
  };
  
  // Add ingredient to recipe
  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { ingredient_id: '', quantity: 0, unit: 'kg' }
      ]
    });
  };
  
  const updateIngredient = (index, field, value) => {
    const updated = [...formData.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ingredients: updated });
  };
  
  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };
  
  // Export functionality
  const handleExport = () => {
    const csvContent = [
      ['Nombre', 'Categoría', 'Producto', 'Rendimiento', 'Tiempo', 'Dificultad', 'Costo Total', 'Costo/Unidad', 'Disponible'],
      ...filteredRecipes.map(recipe => {
        const availability = recipeAvailability[recipe.id];
        return [
          recipe.name,
          recipe.category || '',
          recipe.product_name || '',
          `${recipe.yield_quantity} ${recipe.yield_unit}`,
          `${recipe.preparation_time} min`,
          recipe.difficulty || '',
          recipe.total_cost?.toFixed(2) || '0',
          recipe.cost_per_unit?.toFixed(2) || '0',
          availability?.can_produce ? 'Sí' : 'No'
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recetas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    success('Exportación completada', 'El archivo CSV ha sido descargado');
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'fácil':
      case 'facil':
        return 'success';
      case 'medio':
        return 'warning';
      case 'difícil':
      case 'dificil':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recetas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona las recetas y fórmulas de producción</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchRecipes();
              checkAllRecipesAvailability();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Receta
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recetas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeSummary.total_recipes}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeSummary.available_recipes}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Costo Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${safeSummary.average_cost.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${safeSummary.total_cost.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, categoría o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
          
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">Todas las dificultades</option>
            <option value="fácil">Fácil</option>
            <option value="medio">Medio</option>
            <option value="difícil">Difícil</option>
          </Select>
          
          <Select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">Todas</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </Select>
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="cost">Ordenar por costo</option>
            <option value="time">Ordenar por tiempo</option>
            <option value="popularity">Ordenar por popularidad</option>
          </Select>
        </div>
      </div>
      
      {/* Recipes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron recetas
            </p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const availability = recipeAvailability[recipe.id];
            
            return (
              <div
                key={recipe.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Recipe Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {recipe.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recipe.category || 'Sin categoría'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getDifficultyColor(recipe.difficulty)}>
                        {recipe.difficulty || 'Medio'}
                      </Badge>
                      {availability && (
                        <Badge variant={availability.can_produce ? 'success' : 'danger'}>
                          {availability.can_produce ? 'Disponible' : 'Sin stock'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Recipe Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Rendimiento:</span>
                      <span className="font-medium">
                        {recipe.yield_quantity} {recipe.yield_unit}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tiempo de preparación:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {recipe.preparation_time} min
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Costo total:</span>
                      <span className="font-medium">
                        ${recipe.total_cost?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Costo por {recipe.yield_unit}:</span>
                      <span className="font-medium">
                        ${recipe.cost_per_unit?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    
                    {recipe.product_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Producto:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {recipe.product_name}
                        </span>
                      </div>
                    )}
                    
                    {/* Ingredients count */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Beaker className="h-4 w-4" />
                          Ingredientes:
                        </span>
                        <span className="font-medium">
                          {recipe.ingredients?.length || 0} items
                        </span>
                      </div>
                      
                      {availability && !availability.can_produce && availability.missing_ingredients?.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Faltan: {availability.missing_ingredients.map(i => i.name).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openProductionModal(recipe)}
                      disabled={!availability?.can_produce}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-4 w-4" />
                      Producir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(recipe)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => calculateCost(recipe)}
                      className="flex items-center gap-1"
                    >
                      <Calculator className="h-4 w-4" />
                      Calcular
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(recipe)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(recipe)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Add/Edit Recipe Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={showEditModal ? 'Editar Receta' : 'Nueva Receta'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ej: Helado de Vainilla"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Helados, Postres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Producto asociado
              </label>
              <Select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              >
                <option value="">Seleccionar producto</option>
                {safeProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dificultad
              </label>
              <Select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="fácil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="difícil">Difícil</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rendimiento *
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.yield_quantity}
                  onChange={(e) => setFormData({ ...formData, yield_quantity: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="flex-1"
                />
                <Select
                  value={formData.yield_unit}
                  onChange={(e) => setFormData({ ...formData, yield_unit: e.target.value })}
                  className="w-24"
                >
                  <option value="kg">kg</option>
                  <option value="l">l</option>
                  <option value="u">u</option>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiempo de preparación (min)
              </label>
              <Input
                type="number"
                value={formData.preparation_time}
                onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="30"
              />
            </div>
          </div>
          
          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instrucciones
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows="4"
              placeholder="Paso a paso de la preparación..."
            />
          </div>
          
          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ingredientes
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addIngredient}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={ing.ingredient_id}
                    onChange={(e) => updateIngredient(index, 'ingredient_id', e.target.value)}
                    className="flex-1"
                    required
                  >
                    <option value="">Seleccionar ingrediente</option>
                    {safeIngredients.map(ingredient => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Cantidad"
                    className="w-24"
                    min="0"
                    step="0.01"
                    required
                  />
                  <Select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className="w-20"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="u">u</option>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {formData.ingredients.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No hay ingredientes agregados
                </p>
              )}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Notas adicionales..."
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <LoadingSpinner size="sm" />
              ) : (
                showEditModal ? 'Guardar Cambios' : 'Crear Receta'
              )}
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Production Modal */}
      <Modal
        isOpen={showProductionModal}
        onClose={() => {
          setShowProductionModal(false);
          resetProductionForm();
        }}
        title={`Producir - ${selectedRecipe?.name}`}
        size="md"
      >
        <form onSubmit={handleProduction} className="space-y-6">
          {selectedRecipe && (
            <>
              {/* Recipe Info */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Información de la Receta</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rendimiento por lote:</span>
                    <span className="font-medium">
                      {selectedRecipe.yield_quantity} {selectedRecipe.yield_unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Costo por lote:</span>
                    <span className="font-medium">
                      ${selectedRecipe.total_cost?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tiempo estimado:</span>
                    <span className="font-medium">
                      {selectedRecipe.preparation_time} minutos
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Production Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad de lotes a producir *
                </label>
                <Input
                  type="number"
                  value={productionData.quantity}
                  onChange={(e) => setProductionData({ ...productionData, quantity: parseInt(e.target.value) || 1 })}
                  required
                  min="1"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Producción total: {(selectedRecipe.yield_quantity * productionData.quantity).toFixed(2)} {selectedRecipe.yield_unit}
                </p>
              </div>
              
              {/* Cost Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resumen de Costos</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Costo total de producción:</span>
                    <span className="font-medium">
                      ${((selectedRecipe.total_cost || 0) * productionData.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo total estimado:</span>
                    <span className="font-medium">
                      {selectedRecipe.preparation_time * productionData.quantity} minutos
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas de producción
                </label>
                <textarea
                  value={productionData.notes}
                  onChange={(e) => setProductionData({ ...productionData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Notas sobre esta producción..."
                />
              </div>
              
              {/* Availability Check */}
              {recipeAvailability[selectedRecipe.id] && !recipeAvailability[selectedRecipe.id].can_produce && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                        Ingredientes insuficientes
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Los siguientes ingredientes no tienen stock suficiente:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {recipeAvailability[selectedRecipe.id].missing_ingredients?.map((ing, idx) => (
                          <li key={idx} className="text-sm text-red-700 dark:text-red-300">
                            • {ing.name}: Necesario {ing.required} {ing.unit}, Disponible {ing.available} {ing.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowProductionModal(false);
                resetProductionForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={processing || (recipeAvailability[selectedRecipe?.id] && !recipeAvailability[selectedRecipe.id].can_produce)}
              className="flex-1"
            >
              {processing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Producir
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecipesPage;