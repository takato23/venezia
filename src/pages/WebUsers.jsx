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
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';

const WebUsers = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Estados de modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Estados de formulario
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/web_users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error cargando usuarios web:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm);
    
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && user.active) ||
                         (statusFilter === 'inactive' && !user.active);
    
    return matchesSearch && matchesStatus;
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
    
    if (!formData.email.trim()) errors.email = 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    if (!formData.first_name.trim()) errors.first_name = 'El nombre es requerido';
    if (!formData.last_name.trim()) errors.last_name = 'El apellido es requerido';
    if (!formData.phone.trim()) errors.phone = 'El teléfono es requerido';
    
    // Validar password solo en modo agregar o si se está cambiando
    if (showAddModal || formData.password) {
      if (!formData.password) errors.password = 'La contraseña es requerida';
      if (formData.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
      active: true
    });
    setFormErrors({});
  };

  // CRUD Operations
  const handleAddUser = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/web_users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
          active: formData.active
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        await loadUsers();
        setShowAddModal(false);
        resetForm();
      } else {
        setFormErrors({ general: result.error || 'Error al agregar usuario' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFormErrors({ general: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/web_users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          password: formData.password || undefined,
          active: formData.active
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        await loadUsers();
        setShowEditModal(false);
        resetForm();
        setSelectedUser(null);
      } else {
        setFormErrors({ general: result.error || 'Error al editar usuario' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFormErrors({ general: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/web_users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        await loadUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        console.error('Error al eliminar usuario:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers de modales
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setFormData({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      address: user.address || '',
      password: '',
      confirmPassword: '',
      active: user.active !== undefined ? user.active : true
    });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
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
            <UserIcon className="h-8 w-8 text-venezia-600 mr-3" />
            Gestión de Usuarios Web
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra usuarios del sistema web y sus permisos
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-venezia-600 hover:bg-venezia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-venezia-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios por email, nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-venezia-500 focus:border-venezia-500 sm:text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-venezia-500 focus:border-venezia-500 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            Total: {filteredUsers.length} usuarios
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-venezia-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-venezia-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 space-y-1">
                      {user.phone && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {user.phone}
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {user.address}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? (
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
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openViewModal(user)}
                      className="text-venezia-600 hover:text-venezia-900 transition-colors"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
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
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron usuarios
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Comienza agregando un nuevo usuario'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar/Editar Usuario */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
          setSelectedUser(null);
        }}
        title={showAddModal ? 'Nuevo Usuario Web' : 'Editar Usuario Web'}
        size="lg"
      >
        <div className="space-y-4">
          {formErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{formErrors.general}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={formErrors.email}
              placeholder="usuario@ejemplo.com"
            />
            
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="h-4 w-4 text-venezia-600 focus:ring-venezia-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Usuario activo
              </label>
            </div>
            
            <Input
              label="Nombre *"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              error={formErrors.first_name}
              placeholder="Juan"
            />
            
            <Input
              label="Apellido *"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              error={formErrors.last_name}
              placeholder="Pérez"
            />
            
            <Input
              label="Teléfono *"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={formErrors.phone}
              placeholder="+54 11 1234-5678"
            />
          </div>
          
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Av. Corrientes 1234, CABA"
          />
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <KeyIcon className="h-4 w-4 mr-2" />
              {showAddModal ? 'Contraseña *' : 'Cambiar Contraseña (opcional)'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={showAddModal ? 'Contraseña *' : 'Nueva Contraseña'}
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={formErrors.password}
                placeholder="Mínimo 6 caracteres"
              />
              
              <Input
                label="Confirmar Contraseña"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={formErrors.confirmPassword}
                placeholder="Repetir contraseña"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
              setSelectedUser(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={showAddModal ? handleAddUser : handleEditUser}
            loading={submitting}
          >
            {showAddModal ? 'Crear Usuario' : 'Guardar Cambios'}
          </Button>
        </div>
      </Modal>

      {/* Modal Ver Usuario */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
        title="Detalles del Usuario"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información Personal
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                    <dd className="text-sm text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{selectedUser.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                    <dd className="text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.active ? 'Activo' : 'Inactivo'}
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
                  {selectedUser.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                        <dd className="text-sm text-gray-900">{selectedUser.phone}</dd>
                      </div>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                        <dd className="text-sm text-gray-900">{selectedUser.address}</dd>
                      </div>
                    </div>
                  )}
                  {selectedUser.created_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de Registro</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowViewModal(false);
              setSelectedUser(null);
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
          setSelectedUser(null);
        }}
        title="Confirmar Eliminación"
      >
        {selectedUser && (
          <div>
            <p className="text-sm text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <strong>"{selectedUser.first_name} {selectedUser.last_name}"</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer y se eliminará toda la información asociada.
            </p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteUser}
            loading={submitting}
          >
            Eliminar Usuario
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WebUsers; 