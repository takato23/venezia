import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Store,
  History,
  BarChart3,
  ChefHat,
  Beaker,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import IngredientCard from '../components/inventory/IngredientCard';
import RecipeCard from '../components/inventory/RecipeCard';
import IngredientForm from '../components/inventory/IngredientForm';
import RecipeForm from '../components/inventory/RecipeForm';
import clsx from 'clsx';

const InventoryPage = () => {
  const location = useLocation();
  
  // Set default tab based on route
  const getDefaultTab = () => {
    switch (location.pathname) {
      case '/ingredients':
        return 'ingredients';
      case '/recipes':
        return 'recipes';
      case '/stock':
        return 'stock';
      default:
        return 'stock';
    }
  };
  
  // Tabs
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Update tab when route changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'table'
  
  // Modal States
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Toast
  const { success, error, warning } = useToast();
  
  // API Data
  const { 
    data: ingredients, 
    loading: loadingIngredients, 
    refetch: refetchIngredients 
  } = useApiCache('/api/ingredients');
  
  const { 
    data: recipes, 
    loading: loadingRecipes, 
    refetch: refetchRecipes 
  } = useApiCache('/api/recipes');
  
  const { 
    data: products, 
    loading: loadingProducts 
  } = useApiCache('/api/products');
  
  const { 
    data: stores, 
    loading: loadingStores 
  } = useApiCache('/api/stores');
  
  const { 
    data: stockData, 
    loading: loadingStock,
    refetch: refetchStock 
  } = useApiCache('/api/stock_data');
  
  const { 
    data: suppliers, 
    loading: loadingSuppliers 
  } = useApiCache('/api/providers');

  const loading = loadingIngredients || loadingRecipes || loadingProducts || 
                 loadingStores || loadingStock || loadingSuppliers;

  // Calculate stats
  const stats = useMemo(() => {
    const safeIngredients = Array.isArray(ingredients?.ingredients) ? ingredients.ingredients : 
                           Array.isArray(ingredients) ? ingredients : [];
    if (safeIngredients.length === 0 || !stockData) return {
      totalIngredients: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0
    };

    const lowStock = safeIngredients.filter(i => 
      i.current_stock > 0 && i.current_stock <= i.min_stock
    ).length;
    
    const outOfStock = safeIngredients.filter(i => 
      i.current_stock <= 0
    ).length;
    
    const totalValue = safeIngredients.reduce((sum, i) => 
      sum + (i.current_stock * (i.unit_cost || 0)), 0
    );

    return {
      totalIngredients: safeIngredients.length,
      lowStock,
      outOfStock,
      totalValue
    };
  }, [ingredients, stockData]);

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    const safeIngredients = Array.isArray(ingredients?.ingredients) ? ingredients.ingredients : 
                           Array.isArray(ingredients) ? ingredients : [];
    if (safeIngredients.length === 0) return [];
    
    return safeIngredients.filter(ingredient => {
      const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ingredient.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'low' && ingredient.current_stock <= ingredient.min_stock && ingredient.current_stock > 0) ||
        (filterStatus === 'out' && ingredient.current_stock <= 0) ||
        (filterStatus === 'normal' && ingredient.current_stock > ingredient.min_stock);
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.current_stock - a.current_stock;
        case 'value':
          return (b.current_stock * b.unit_cost) - (a.current_stock * a.unit_cost);
        default:
          return 0;
      }
    });
  }, [ingredients, searchTerm, filterStatus, sortBy]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    const safeRecipes = Array.isArray(recipes?.recipes) ? recipes.recipes : 
                       Array.isArray(recipes) ? recipes : [];
    if (safeRecipes.length === 0) return [];
    
    return safeRecipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.category?.toLowerCase().includes(searchTerm.toLowerCase());
                           
      const matchesDifficulty = filterDifficulty === 'all' || 
                               recipe.difficulty?.toLowerCase() === filterDifficulty.toLowerCase();
      
      return matchesSearch && matchesDifficulty;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty':
          const difficultyOrder = { 'fácil': 0, 'facil': 0, 'easy': 0, 'medio': 1, 'medium': 1, 'difícil': 2, 'dificil': 2, 'hard': 2 };
          return (difficultyOrder[a.difficulty?.toLowerCase()] || 1) - (difficultyOrder[b.difficulty?.toLowerCase()] || 1);
        case 'cost':
          return (b.total_cost || 0) - (a.total_cost || 0);
        case 'time':
          return (a.preparation_time || 0) - (b.preparation_time || 0);
        default:
          return 0;
      }
    });
  }, [recipes, searchTerm, filterDifficulty, sortBy]);

  // Handle ingredient save
  const handleSaveIngredient = async (data) => {
    try {
      const url = selectedItem 
        ? `/api/ingredients/${selectedItem.id}`
        : '/api/ingredients';
      
      const response = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        success(
          selectedItem ? 'Ingrediente actualizado' : 'Ingrediente creado',
          `${data.name} se ${selectedItem ? 'actualizó' : 'creó'} correctamente`
        );
        refetchIngredients();
        setShowIngredientForm(false);
        setSelectedItem(null);
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo guardar el ingrediente');
      }
    } catch (err) {
      error('Error', 'Error al guardar el ingrediente');
    }
  };

  // Handle recipe save
  const handleSaveRecipe = async (data) => {
    try {
      const url = selectedItem 
        ? `/api/recipes/${selectedItem.id}`
        : '/api/recipes';
      
      const response = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        success(
          selectedItem ? 'Receta actualizada' : 'Receta creada',
          `${data.name} se ${selectedItem ? 'actualizó' : 'creó'} correctamente`
        );
        refetchRecipes();
        setShowRecipeForm(false);
        setSelectedItem(null);
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo guardar la receta');
      }
    } catch (err) {
      error('Error', 'Error al guardar la receta');
    }
  };

  // Handle delete
  const handleDelete = async (type, id) => {
    if (!window.confirm(`¿Está seguro de eliminar este ${type === 'ingredient' ? 'ingrediente' : 'receta'}?`)) {
      return;
    }

    try {
      const url = type === 'ingredient' 
        ? `/api/ingredients/${id}`
        : `/api/recipes/${id}`;
      
      const response = await fetch(url, { method: 'DELETE' });

      if (response.ok) {
        success('Eliminado', `${type === 'ingredient' ? 'Ingrediente' : 'Receta'} eliminado correctamente`);
        type === 'ingredient' ? refetchIngredients() : refetchRecipes();
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'No se pudo eliminar');
      }
    } catch (err) {
      error('Error', 'Error al eliminar');
    }
  };

  const handleRefresh = () => {
    refetchIngredients();
    refetchRecipes();
    refetchStock();
    success('Actualizado', 'Datos actualizados correctamente');
  };

  // Check availability of all recipes
  const handleCheckAllRecipesAvailability = async () => {
    try {
      const safeRecipes = Array.isArray(recipes?.recipes) ? recipes.recipes : 
                         Array.isArray(recipes) ? recipes : [];
      
      if (safeRecipes.length === 0) {
        warning('Sin Recetas', 'No hay recetas para verificar');
        return;
      }

      const results = await Promise.all(
        safeRecipes.map(async (recipe) => {
          const response = await fetch(`/api/recipes/${recipe.id}/check-availability`, {
            method: 'POST'
          });
          const data = await response.json();
          return { ...recipe, availability: data };
        })
      );

      const available = results.filter(r => r.availability.can_make).length;
      const unavailable = results.length - available;

      if (unavailable > 0) {
        warning(
          'Recetas con ingredientes faltantes',
          `${available} recetas disponibles, ${unavailable} requieren restock`
        );
      } else {
        success(
          'Todas las recetas disponibles',
          `Las ${available} recetas pueden prepararse con el stock actual`
        );
      }
    } catch (err) {
      error('Error', 'Error al verificar disponibilidad de recetas');
    }
  };

  // Check availability of single recipe
  const handleCheckRecipeAvailability = async (recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/check-availability`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.can_make) {
          success(
            'Receta disponible',
            `La receta "${recipe.name}" puede prepararse con el stock actual`
          );
        } else {
          warning(
            'Ingredientes faltantes',
            `La receta "${recipe.name}" requiere ${data.missing_ingredients.length} ingredientes`
          );
        }
      } else {
        error('Error', 'No se pudo verificar la disponibilidad');
      }
    } catch (err) {
      error('Error', 'Error al verificar disponibilidad de la receta');
    }
  };

  // Tabs configuration
  const tabs = [
    { 
      id: 'stock', 
      label: 'Stock General', 
      icon: Package,
      count: stats.totalIngredients 
    },
    { 
      id: 'ingredients', 
      label: 'Ingredientes', 
      icon: Beaker,
      count: Array.isArray(ingredients?.ingredients) ? ingredients.ingredients.length : 
             Array.isArray(ingredients) ? ingredients.length : 0 
    },
    { 
      id: 'recipes', 
      label: 'Recetas', 
      icon: ChefHat,
      count: Array.isArray(recipes?.recipes) ? recipes.recipes.length : 
             Array.isArray(recipes) ? recipes.length : 0 
    },
    { 
      id: 'analytics', 
      label: 'Análisis', 
      icon: BarChart3 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Inventario
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control de ingredientes, recetas y stock
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            icon={RefreshCw}
          >
            Actualizar
          </Button>
          
          {activeTab === 'ingredients' && (
            <Button
              onClick={() => {
                setSelectedItem(null);
                setShowIngredientForm(true);
              }}
              variant="primary"
              icon={Plus}
            >
              Nuevo Ingrediente
            </Button>
          )}
          
          {activeTab === 'recipes' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCheckAllRecipesAvailability}
                variant="outline"
                size="sm"
                icon={ShoppingCart}
              >
                Verificar Disponibilidad
              </Button>
              <Button
                onClick={() => {
                  setSelectedItem(null);
                  setShowRecipeForm(true);
                }}
                variant="primary"
                icon={Plus}
              >
                Nueva Receta
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Ingredientes</p>
              <p className="text-2xl font-bold mt-1">{stats.totalIngredients}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.lowStock}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sin Stock</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold mt-1">${stats.totalValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="border-b dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-venezia-600 text-venezia-600 dark:text-venezia-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <Badge size="xs" variant="default">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            
            {(activeTab === 'stock' || activeTab === 'ingredients') && (
              <>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'normal', label: 'Stock Normal' },
                    { value: 'low', label: 'Stock Bajo' },
                    { value: 'out', label: 'Sin Stock' }
                  ]}
                  icon={Filter}
                  className="w-full sm:w-48"
                />
                
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'name', label: 'Nombre' },
                    { value: 'stock', label: 'Stock' },
                    { value: 'value', label: 'Valor' }
                  ]}
                  icon={ArrowUpDown}
                  className="w-full sm:w-40"
                />
              </>
            )}
            
            {activeTab === 'recipes' && (
              <>
                <Select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todas las dificultades' },
                    { value: 'fácil', label: 'Fácil' },
                    { value: 'medio', label: 'Medio' },
                    { value: 'difícil', label: 'Difícil' }
                  ]}
                  icon={Filter}
                  className="w-full sm:w-48"
                />
                
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'name', label: 'Nombre' },
                    { value: 'difficulty', label: 'Dificultad' },
                    { value: 'cost', label: 'Costo' },
                    { value: 'time', label: 'Tiempo' }
                  ]}
                  icon={ArrowUpDown}
                  className="w-full sm:w-40"
                />
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Stock/Ingredients Tab */}
              {(activeTab === 'stock' || activeTab === 'ingredients') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredIngredients.map(ingredient => (
                    <IngredientCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      onEdit={(item) => {
                        setSelectedItem(item);
                        setShowIngredientForm(true);
                      }}
                      onDelete={(id) => handleDelete('ingredient', id)}
                      onStockUpdate={(item) => {
                        setSelectedItem(item);
                        setShowStockUpdate(true);
                      }}
                    />
                  ))}
                  
                  {filteredIngredients.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No se encontraron ingredientes</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recipes Tab */}
              {activeTab === 'recipes' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      ingredients={ingredients || []}
                      onEdit={(item) => {
                        setSelectedItem(item);
                        setShowRecipeForm(true);
                      }}
                      onDelete={(id) => handleDelete('recipe', id)}
                      onDuplicate={(item) => {
                        const duplicated = { ...item, id: null, name: `${item.name} (Copia)` };
                        setSelectedItem(duplicated);
                        setShowRecipeForm(true);
                      }}
                      onCalculateCost={async (recipe) => {
                        try {
                          const response = await fetch(`/api/recipes/${recipe.id}/calculate-cost`);
                          if (response.ok) {
                            const data = await response.json();
                            success('Costo actualizado', `Costo total: $${data.total_cost.toFixed(2)}`);
                            refetchRecipes();
                          } else {
                            error('Error', 'No se pudo calcular el costo');
                          }
                        } catch (err) {
                          error('Error', 'Error al calcular el costo');
                        }
                      }}
                      onCheckAvailability={handleCheckRecipeAvailability}
                    />
                  ))}
                  
                  {filteredRecipes.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No se encontraron recetas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Análisis de inventario próximamente</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <IngredientForm
        isOpen={showIngredientForm}
        onClose={() => {
          setShowIngredientForm(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveIngredient}
        ingredient={selectedItem}
        suppliers={suppliers || []}
      />

      <RecipeForm
        isOpen={showRecipeForm}
        onClose={() => {
          setShowRecipeForm(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveRecipe}
        recipe={selectedItem}
        products={products || []}
        ingredients={Array.isArray(ingredients?.ingredients) ? ingredients.ingredients : 
                    Array.isArray(ingredients) ? ingredients : []}
      />
    </div>
  );
};

export default InventoryPage;