import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import TextArea from '../components/ui/TextArea';
import cacheManager from '../utils/cacheManager';

const Providers = () => {
  // Estados principales
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Estados de modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  // Estados de formulario
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    cuit: '',
    category_id: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadProviders();
    loadCategories();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (response.ok) {
        const data = await response.json();
        // Handle both {success: true, data: [...]} and direct array formats
        const providersArray = data?.data || data;
        setProviders(Array.isArray(providersArray) ? providersArray : []);
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      // Set empty array as fallback
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/provider_categories');
      if (response.ok) {
        const data = await response.json();
        // Handle both {success: true, data: [...]} and direct array formats
        const categoriesArray = data?.data || data;
        setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      // Set empty array as fallback
      setCategories([]);
    }
  };

  // Filtrar proveedores
  const safeProviders = Array.isArray(providers) ? providers : [];
  const filteredProviders = safeProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.phone?.includes(searchTerm) ||
                         provider.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || provider.category_id?.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handlers de formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.contact_person.trim()) errors.contact_person = 'La persona de contacto es requerida';
    if (!formData.phone.trim()) errors.phone = 'El teléfono es requerido';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      cuit: '',
      category_id: '',
      notes: ''
    });
    setFormErrors({});
  };

  // CRUD Operations
  const handleAddProvider = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/providers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        // Invalidar caché de proveedores
        cacheManager.invalidateProviders();
        await loadProviders();
        setShowAddModal(false);
        resetForm();
        // Mostrar notificación de éxito
      } else {
        console.error('Error al agregar proveedor');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProvider = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/providers/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, id: selectedProvider.id })
      });
      
      if (response.ok) {
        // Invalidar caché de proveedores
        cacheManager.invalidateProviders();
        await loadProviders();
        setShowEditModal(false);
        resetForm();
        setSelectedProvider(null);
      } else {
        console.error('Error al editar proveedor');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProvider = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/providers/delete/${selectedProvider.id}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Invalidar caché de proveedores
        cacheManager.invalidateProviders();
        await loadProviders();
        setShowDeleteModal(false);
        setSelectedProvider(null);
      } else {
        console.error('Error al eliminar proveedor');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (provider) => {
    try {
      const response = await fetch(`/api/providers/toggle_status/${provider.id}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Invalidar caché de proveedores
        cacheManager.invalidateProviders();
        await loadProviders();
      } else {
        console.error('Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handlers de modales
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (provider) => {
    setFormData({
      name: provider.name || '',
      contact_person: provider.contact_person || '',
      phone: provider.phone || '',
      email: provider.email || '',
      address: provider.address || '',
      cuit: provider.cuit || '',
      category_id: provider.category_id?.toString() || '',
      notes: provider.notes || ''
    });
    setSelectedProvider(provider);
    setShowEditModal(true);
  };

  const openViewModal = (provider) => {
    setSelectedProvider(provider);
    setShowViewModal(true);
  };

  const openDeleteModal = (provider) => {
    setSelectedProvider(provider);
    setShowDeleteModal(true);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="h-8 w-8 text-venezia-600 mr-3" />
            Gestión de Proveedores
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra proveedores, categorías y contactos
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-venezia-600 hover:bg-venezia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-venezia-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-venezia-500 focus:border-venezia-500 sm:text-sm"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-venezia-500 focus:border-venezia-500 sm:text-sm"
          >
            <option value="">Todas las categorías</option>
            {Array.isArray(categories) ? categories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            )) : []}
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            Total: {filteredProviders.length} proveedores
          </div>
        </div>
      </div>

      {/* Tabla de proveedores */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <motion.tr
                  key={provider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-venezia-100 flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-venezia-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {provider.name}
                        </div>
                        {provider.cuit && (
                          <div className="text-sm text-gray-500">
                            CUIT: {provider.cuit}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {provider.contact_person}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      {provider.phone && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {provider.phone}
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {provider.email}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {provider.category_name || 'Sin categoría'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(provider)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        provider.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {provider.is_active ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openViewModal(provider)}
                      className="text-venezia-600 hover:text-venezia-900 transition-colors"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(provider)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(provider)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron proveedores
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Comienza agregando un nuevo proveedor'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar/Editar Proveedor */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
          setSelectedProvider(null);
        }}
        title={showAddModal ? 'Nuevo Proveedor' : 'Editar Proveedor'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Proveedor *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={formErrors.name}
              placeholder="Ej: Distribuidora ABC"
            />
            
            <Input
              label="Persona de Contacto *"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              error={formErrors.contact_person}
              placeholder="Ej: Juan Pérez"
            />
            
            <Input
              label="Teléfono *"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={formErrors.phone}
              placeholder="Ej: +54 11 1234-5678"
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={formErrors.email}
              placeholder="Ej: contacto@proveedor.com"
            />
            
            <Input
              label="CUIT"
              value={formData.cuit}
              onChange={(e) => handleInputChange('cuit', e.target.value)}
              placeholder="Ej: 20-12345678-9"
            />
            
            <Select
              label="Categoría"
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              placeholder="Seleccionar categoría"
            >
              <option value="">Sin categoría</option>
              {Array.isArray(categories) ? categories.map(category => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              )) : []}
            </Select>
          </div>
          
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Ej: Av. Corrientes 1234, CABA"
          />
          
          <TextArea
            label="Notas"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Información adicional sobre el proveedor..."
            rows={3}
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
              setSelectedProvider(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={showAddModal ? handleAddProvider : handleEditProvider}
            loading={submitting}
          >
            {showAddModal ? 'Agregar Proveedor' : 'Guardar Cambios'}
          </Button>
        </div>
      </Modal>

      {/* Modal Ver Proveedor */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProvider(null);
        }}
        title="Detalles del Proveedor"
        size="lg"
      >
        {selectedProvider && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información General
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="text-sm text-gray-900">{selectedProvider.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Persona de Contacto</dt>
                    <dd className="text-sm text-gray-900">{selectedProvider.contact_person}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                    <dd className="text-sm text-gray-900">
                      {selectedProvider.category_name || 'Sin categoría'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedProvider.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedProvider.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información de Contacto
                </h3>
                <dl className="space-y-3">
                  {selectedProvider.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                        <dd className="text-sm text-gray-900">{selectedProvider.phone}</dd>
                      </div>
                    </div>
                  )}
                  {selectedProvider.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{selectedProvider.email}</dd>
                      </div>
                    </div>
                  )}
                  {selectedProvider.address && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                        <dd className="text-sm text-gray-900">{selectedProvider.address}</dd>
                      </div>
                    </div>
                  )}
                  {selectedProvider.cuit && (
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">CUIT</dt>
                        <dd className="text-sm text-gray-900">{selectedProvider.cuit}</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            {selectedProvider.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Notas</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedProvider.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowViewModal(false);
              setSelectedProvider(null);
            }}
          >
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProvider(null);
        }}
        title="Confirmar Eliminación"
      >
        {selectedProvider && (
          <div>
            <p className="text-sm text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar el proveedor{' '}
              <strong>"{selectedProvider.name}"</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedProvider(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteProvider}
            loading={submitting}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Providers; 