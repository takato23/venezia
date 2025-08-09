import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  ShoppingCart,
  Tag,
  DollarSign,
  Weight,
  Layers,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../services/socketMock';
import { useApiCache, useMultipleApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Componente de producto individual memoizado
const ProductCard = memo(({ product, category, onEdit, onDelete, onView }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {category?.name || 'Sin categoría'}
          </span>
          <span className="font-medium">${product.price}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onView(product)}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Ver detalles"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(product)}
          className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </motion.div>
));

ProductCard.displayName = 'ProductCard';

// Componente de categoría memoizado
const CategorySection = memo(({ categoryName, products, categories, onEdit, onDelete, onView }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
      {categoryName} ({products.length})
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => {
        const category = (categories?.data || categories || []).find(c => c.id === product.category_id);
        return (
          <ProductCard
            key={product.id}
            product={product}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        );
      })}
    </div>
  </div>
));

CategorySection.displayName = 'CategorySection';

const Products = () => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  // Hooks optimizados
  const { success, error } = useToast();
  
  // Cargar datos con caché
  const { 
    data: products, 
    loading: productsLoading, 
    refetch: refetchProducts,
    invalidateCache: invalidateProductsCache
  } = useApiCache('/api/products');

  const { 
    data: categories, 
    loading: categoriesLoading, 
    refetch: refetchCategories,
    invalidateCache: invalidateCategoriesCache
  } = useApiCache('/api/product_categories');

  const loading = productsLoading || categoriesLoading;

  // Filtrar productos memoizado
  const filteredProducts = useMemo(() => {
    const productsList = products?.products || products || [];
    if (!Array.isArray(productsList)) return [];
    
    return productsList.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || product.category_id === parseInt(filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  // Agrupar productos por categoría memoizado
  const productsByCategory = useMemo(() => {
    if (!categories) return {};
    
    return filteredProducts.reduce((acc, product) => {
      const categoryName = (categories?.data || categories || []).find(c => c.id === product.category_id)?.name || 'Sin categoría';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {});
  }, [filteredProducts, categories]);

  // CRUD Productos optimizado
  const handleSaveProduct = useCallback(async (productData) => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        invalidateProductsCache();
        refetchProducts();
        success(
          editingProduct ? 'Producto actualizado' : 'Producto creado',
          `${productData.name} se ${editingProduct ? 'actualizó' : 'creó'} correctamente`
        );
      } else {
        const errorData = await response.json();
        error('Error al guardar', errorData.error || 'No se pudo guardar el producto');
      }
    } catch (err) {
      console.error('Error:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }, [editingProduct, invalidateProductsCache, refetchProducts, success, error]);

  const handleDeleteProduct = useCallback(async (productId) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          invalidateProductsCache();
          refetchProducts();
          success('Producto eliminado', 'El producto se eliminó correctamente');
        } else {
          const errorData = await response.json();
          error('Error al eliminar', errorData.error || 'No se pudo eliminar el producto');
        }
      } catch (err) {
        console.error('Error:', err);
        error('Error de conexión', 'No se pudo conectar con el servidor');
      }
    }
  }, [invalidateProductsCache, refetchProducts, success, error]);

  // CRUD Categorías optimizado
  const handleSaveCategory = useCallback(async (categoryData) => {
    try {
      const url = editingCategory ? `/api/product_categories/${editingCategory.id}` : '/api/product_categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      
      if (response.ok) {
        setShowCategoryModal(false);
        setEditingCategory(null);
        invalidateCategoriesCache();
        refetchCategories();
        success(
          editingCategory ? 'Categoría actualizada' : 'Categoría creada',
          `${categoryData.name} se ${editingCategory ? 'actualizó' : 'creó'} correctamente`
        );
      } else {
        const errorData = await response.json();
        error('Error al guardar', errorData.error || 'No se pudo guardar la categoría');
      }
    } catch (err) {
      console.error('Error:', err);
      error('Error de conexión', 'No se pudo conectar con el servidor');
    }
  }, [editingCategory, invalidateCategoriesCache, refetchCategories, success, error]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    if (window.confirm('¿Está seguro de eliminar esta categoría?')) {
      try {
        const response = await fetch(`/api/product_categories/${categoryId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          invalidateCategoriesCache();
          refetchCategories();
          success('Categoría eliminada', 'La categoría se eliminó correctamente');
        } else {
          const errorData = await response.json();
          error('Error al eliminar', errorData.error || 'No se pudo eliminar la categoría');
        }
      } catch (err) {
        console.error('Error:', err);
        error('Error de conexión', 'No se pudo conectar con el servidor');
      }
    }
  }, [invalidateCategoriesCache, refetchCategories, success, error]);

  // Handlers memoizados
  const handleEditProduct = useCallback((product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  }, []);

  const handleViewProduct = useCallback((product) => {
    setViewProduct(product);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestión de productos y categorías</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              setShowCategoryModal(true);
              setEditingCategory(null);
            }}
            variant="outline"
            icon={Tag}
          >
            Nueva Categoría
          </Button>
          <Button
            onClick={() => {
              setShowProductModal(true);
              setEditingProduct(null);
            }}
            icon={Plus}
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="sm:w-48">
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...((categories?.data || categories || []).map(cat => ({
                  value: cat.id.toString(),
                  label: cat.name
                })))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Categorías y Productos */}
      <div className="space-y-6">
        {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
          <CategorySection
            key={categoryName}
            categoryName={categoryName}
            products={categoryProducts}
            categories={categories?.data || categories || []}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onView={handleViewProduct}
          />
        ))}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <ViewProductModal
          product={viewProduct}
          category={categories.find(c => c.id === viewProduct.category_id)}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  );
};

// Modal para crear/editar productos
const ProductModal = ({ product, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    weight_kg: '',
    max_flavors: '',
    sales_format: '',
    track_stock: false,
    active: true,
    ...product
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={product ? 'Editar Producto' : 'Nuevo Producto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        
        <Input
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
          
          <Select
            label="Categoría"
            value={formData.category_id}
            onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            options={[
              { value: '', label: 'Seleccionar categoría' },
              ...((categories?.data || categories || []).map(cat => ({
                value: cat.id.toString(),
                label: cat.name
              })))
            ]}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Peso (kg)"
            type="number"
            step="0.1"
            value={formData.weight_kg}
            onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
          />
          
          <Input
            label="Máx. Sabores"
            type="number"
            value={formData.max_flavors}
            onChange={(e) => setFormData({...formData, max_flavors: e.target.value})}
          />
        </div>
        
        <Input
          label="Formato de Venta"
          value={formData.sales_format}
          onChange={(e) => setFormData({...formData, sales_format: e.target.value})}
        />
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.track_stock}
              onChange={(e) => setFormData({...formData, track_stock: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Rastrear inventario</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Producto activo</span>
          </label>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {product ? 'Actualizar' : 'Crear'} Producto
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para crear/editar categorías
const CategoryModal = ({ category, onSave, onClose }) => {
  const [name, setName] = useState(category?.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={category ? 'Editar Categoría' : 'Nueva Categoría'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la Categoría"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {category ? 'Actualizar' : 'Crear'} Categoría
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal para ver detalles del producto
const ViewProductModal = ({ product, category, onClose }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Detalles del Producto">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{product.name}</h3>
          {product.description && (
            <p className="text-gray-600 mt-1">{product.description}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Precio:</span>
            <p className="text-lg font-semibold">${product.price}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Categoría:</span>
            <p>{category?.name || 'Sin categoría'}</p>
          </div>
        </div>
        
        {(product.weight_kg || product.max_flavors || product.sales_format) && (
          <div className="grid grid-cols-2 gap-4">
            {product.weight_kg && (
              <div>
                <span className="text-sm font-medium text-gray-500">Peso:</span>
                <p>{product.weight_kg} kg</p>
              </div>
            )}
            {product.max_flavors && (
              <div>
                <span className="text-sm font-medium text-gray-500">Máx. Sabores:</span>
                <p>{product.max_flavors}</p>
              </div>
            )}
            {product.sales_format && (
              <div>
                <span className="text-sm font-medium text-gray-500">Formato:</span>
                <p>{product.sales_format}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Estado:</span>
            <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              product.active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.active ? 'Activo' : 'Inactivo'}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Rastreo de Stock:</span>
            <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              product.track_stock 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {product.track_stock ? 'Activado' : 'Desactivado'}
            </p>
          </div>
        </div>
        
        <div className="pt-4">
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Products; 