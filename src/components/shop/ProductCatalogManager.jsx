import React, { useState, useMemo } from 'react';
import { 
  Package,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Trash2,
  Edit,
  Eye,
  Star,
  TrendingUp,
  AlertCircle,
  Upload,
  X,
  Tag,
  DollarSign
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const ProductCatalogManager = ({ 
  products = [], 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  categories = []
}) => {
  const { success, error, warning } = useToast();
  
  // Estados
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filtrar y ordenar productos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.webDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (statusFilter === 'active') return product.isActive;
        if (statusFilter === 'inactive') return !product.isActive;
        if (statusFilter === 'featured') return product.isFeatured;
        if (statusFilter === 'lowStock') return product.stock < 10;
        return true;
      });
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return (a.webPrice || 0) - (b.webPrice || 0);
        case 'stock':
          return (a.stock || 0) - (b.stock || 0);
        case 'sales':
          return (b.totalSales || 0) - (a.totalSales || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [products, searchTerm, categoryFilter, statusFilter, sortBy]);

  // Manejar selección de productos
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Acciones en lote
  const handleBulkActivate = async () => {
    try {
      await Promise.all(
        selectedProducts.map(id => 
          onUpdateProduct(id, { isActive: true })
        )
      );
      success('Productos activados', `${selectedProducts.length} productos activados exitosamente`);
      setSelectedProducts([]);
      setShowBulkActions(false);
    } catch (err) {
      error('Error', 'No se pudieron activar los productos');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(
        selectedProducts.map(id => 
          onUpdateProduct(id, { isActive: false })
        )
      );
      warning('Productos desactivados', `${selectedProducts.length} productos desactivados`);
      setSelectedProducts([]);
      setShowBulkActions(false);
    } catch (err) {
      error('Error', 'No se pudieron desactivar los productos');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Está seguro de eliminar ${selectedProducts.length} productos?`)) {
      return;
    }
    
    try {
      await Promise.all(
        selectedProducts.map(id => onDeleteProduct(id))
      );
      success('Productos eliminados', `${selectedProducts.length} productos eliminados`);
      setSelectedProducts([]);
      setShowBulkActions(false);
    } catch (err) {
      error('Error', 'No se pudieron eliminar los productos');
    }
  };

  // Importar productos desde CSV
  const handleImportProducts = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/shop/products/import', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        success('Importación exitosa', `${result.imported} productos importados`);
        setShowImportModal(false);
      } else {
        error('Error', 'No se pudo importar el archivo');
      }
    } catch (err) {
      error('Error', 'Error al importar productos');
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="featured">Destacados</option>
              <option value="lowStock">Stock bajo</option>
            </Select>
            
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-40"
            >
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="stock">Stock</option>
              <option value="sales">Ventas</option>
            </Select>
          </div>
          
          {/* Acciones */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              icon={viewMode === 'grid' ? List : Grid}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkActions(!showBulkActions)}
              icon={Filter}
            >
              Acciones en lote
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              icon={Upload}
            >
              Importar
            </Button>
          </div>
        </div>
        
        {/* Acciones en lote */}
        {showBulkActions && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProducts.length} productos seleccionados
                </span>
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="xs"
                    onClick={handleBulkActivate}
                  >
                    Activar
                  </Button>
                  <Button
                    variant="warning"
                    size="xs"
                    onClick={handleBulkDeactivate}
                  >
                    Desactivar
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={handleBulkDelete}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vista de productos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => onUpdateProduct(product.id)}
              onDelete={() => onDeleteProduct(product.id)}
              onSelect={() => handleSelectProduct(product.id)}
              isSelected={selectedProducts.includes(product.id)}
              showCheckbox={showBulkActions}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {showBulkActions && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Precio Web
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {showBulkActions && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.webImages?.[0] ? (
                        <img 
                          src={product.webImages[0]} 
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {product.category || 'Sin categoría'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    ${product.webPrice?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {product.stock || 0} unidades
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.isActive && (
                        <Badge variant="success" size="xs">Activo</Badge>
                      )}
                      {product.isFeatured && (
                        <Badge variant="info" size="xs">
                          <Star className="w-3 h-3 mr-1" />
                          Destacado
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => window.open(`/webshop/product/${product.id}`, '_blank')}
                        icon={Eye}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onUpdateProduct(product.id)}
                        icon={Edit}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onDeleteProduct(product.id)}
                        icon={Trash2}
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de importación */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar Productos"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Sube un archivo CSV con las columnas: nombre, sku, precio, stock, categoria, descripcion
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Arrastra tu archivo aquí o haz clic para seleccionar
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImportProducts(e.target.files[0]);
                }
              }}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" size="sm" as="span">
                Seleccionar archivo
              </Button>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Componente ProductCard
const ProductCard = ({ product, onEdit, onDelete, onSelect, isSelected, showCheckbox }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {product.webImages?.[0] ? (
        <img 
          src={product.webImages[0]} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Package className="w-16 h-16 text-gray-400" />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
              {product.name}
            </h3>
            {product.sku && (
              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
            )}
          </div>
          
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 dark:border-gray-600"
            />
          )}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-venezia-600 dark:text-venezia-400">
            ${product.webPrice?.toLocaleString() || '0'}
          </span>
          <Badge 
            variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}
            size="xs"
          >
            Stock: {product.stock || 0}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          {product.isActive ? (
            <Badge variant="success" size="xs">Activo</Badge>
          ) : (
            <Badge variant="default" size="xs">Inactivo</Badge>
          )}
          {product.isFeatured && (
            <Badge variant="info" size="xs">
              <Star className="w-3 h-3 mr-1" />
              Destacado
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => window.open(`/webshop/product/${product.id}`, '_blank')}
            className="flex-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalogManager;