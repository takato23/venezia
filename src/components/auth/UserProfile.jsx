import React, { useState } from 'react';
import { 
  User, 
  Save, 
  Eye, 
  EyeOff, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  Camera,
  Key,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.supabase';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import FormError from '../ui/FormError';
import clsx from 'clsx';

const UserProfile = () => {
  const { user, updateUser, logout } = useAuthStore();
  const { success, error } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    department: user?.department || '',
    address: user?.address || '',
    avatar: user?.avatar || null
  });
  
  // Password change data
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // User roles and permissions
  const userRoles = {
    admin: { label: 'Administrador', color: 'text-red-600', bg: 'bg-red-100' },
    manager: { label: 'Gerente', color: 'text-blue-600', bg: 'bg-blue-100' },
    supervisor: { label: 'Supervisor', color: 'text-green-600', bg: 'bg-green-100' },
    employee: { label: 'Empleado', color: 'text-gray-600', bg: 'bg-gray-100' }
  };

  const departments = [
    { value: 'production', label: 'Producción' },
    { value: 'sales', label: 'Ventas' },
    { value: 'inventory', label: 'Inventario' },
    { value: 'delivery', label: 'Entregas' },
    { value: 'administration', label: 'Administración' }
  ];

  const positions = [
    { value: 'manager', label: 'Gerente' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'operator', label: 'Operador' },
    { value: 'assistant', label: 'Asistente' },
    { value: 'driver', label: 'Repartidor' }
  ];

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await updateUser(profileData);
      
      if (result.success) {
        success('Perfil actualizado', 'Tu información se ha actualizado correctamente');
        setIsEditing(false);
      } else {
        error('Error', result.error || 'No se pudo actualizar el perfil');
      }
    } catch (err) {
      error('Error', 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    const errors = {};
    if (!passwordData.current_password) {
      errors.current_password = 'La contraseña actual es requerida';
    }
    if (!passwordData.new_password) {
      errors.new_password = 'La nueva contraseña es requerida';
    } else if (passwordData.new_password.length < 6) {
      errors.new_password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Las contraseñas no coinciden';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      });
      
      if (response.ok) {
        success('Contraseña actualizada', 'Tu contraseña se ha cambiado correctamente');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordModal(false);
      } else {
        const data = await response.json();
        error('Error', data.error || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      error('Error', 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({ ...prev, avatar: data.avatar }));
        success('Avatar actualizado', 'Tu foto de perfil se ha actualizado');
      } else {
        error('Error', 'No se pudo subir la imagen');
      }
    } catch (err) {
      error('Error', 'Error al subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'activity', label: 'Actividad', icon: Activity }
  ];

  const role = userRoles[user?.role] || userRoles.employee;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1 bg-venezia-600 text-white rounded-full cursor-pointer hover:bg-venezia-700 transition-colors">
              <Camera className="w-3 h-3" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.name || 'Usuario'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {user?.email}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge 
                className={clsx(role.bg, role.color)}
                size="sm"
              >
                {role.label}
              </Badge>
              {user?.department && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {departments.find(d => d.value === user.department)?.label || user.department}
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPasswordModal(true)}
              variant="outline"
              size="sm"
              icon={Key}
            >
              Cambiar Contraseña
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              icon={LogOut}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="border-b dark:border-gray-700">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-venezia-600 text-venezia-600 dark:text-venezia-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Información Personal
                </h3>
                <Button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  icon={isEditing ? Save : Settings}
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre completo"
                  name="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={!isEditing}
                  icon={User}
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                  icon={Mail}
                />

                <Input
                  label="Teléfono"
                  name="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                  icon={Phone}
                />

                <Select
                  label="Cargo"
                  name="position"
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  disabled={!isEditing}
                  options={positions}
                />

                <Select
                  label="Departamento"
                  name="department"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  disabled={!isEditing}
                  options={departments}
                />

                <Input
                  label="Dirección"
                  name="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!isEditing}
                  icon={MapPin}
                />
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Save}
                    loading={loading}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configuración de Seguridad
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Contraseña
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Última actualización: {user?.password_changed_at ? 
                      new Date(user.password_changed_at).toLocaleDateString() : 
                      'Nunca'
                    }
                  </p>
                  <Button
                    onClick={() => setShowPasswordModal(true)}
                    variant="outline"
                    size="sm"
                    icon={Key}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Sesiones Activas
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Gestiona las sesiones de tu cuenta
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Activity}
                  >
                    Ver Sesiones
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Recomendaciones de Seguridad
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                      <li>• Usa una contraseña fuerte y única</li>
                      <li>• Cambia tu contraseña regularmente</li>
                      <li>• No compartas tus credenciales</li>
                      <li>• Cierra sesión en dispositivos compartidos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>

              <div className="space-y-4">
                {/* Placeholder for activity log */}
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    El registro de actividad estará disponible próximamente
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
          setPasswordErrors({});
        }}
        title={
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Cambiar Contraseña
          </div>
        }
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-venezia-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.current_password && (
                <FormError error={passwordErrors.current_password} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-venezia-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                  placeholder="Ingresa la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.new_password && (
                <FormError error={passwordErrors.new_password} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-venezia-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                  placeholder="Confirma la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.confirm_password && (
                <FormError error={passwordErrors.confirm_password} />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              loading={loading}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;