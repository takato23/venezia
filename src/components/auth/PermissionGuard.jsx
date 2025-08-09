import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.supabase';
import Button from '../ui/Button';

// Permission definitions
const PERMISSIONS = {
  // Sales permissions
  'sales.view': 'Ver ventas',
  'sales.create': 'Crear ventas',
  'sales.edit': 'Editar ventas',
  'sales.delete': 'Eliminar ventas',
  
  // Inventory permissions
  'inventory.view': 'Ver inventario',
  'inventory.edit': 'Editar inventario',
  'inventory.transfer': 'Transferir stock',
  
  // Production permissions
  'production.view': 'Ver producción',
  'production.create': 'Crear órdenes de producción',
  'production.edit': 'Editar producción',
  
  // Delivery permissions
  'delivery.view': 'Ver entregas',
  'delivery.create': 'Crear entregas',
  'delivery.edit': 'Editar entregas',
  'delivery.assign': 'Asignar repartidores',
  
  // Reports permissions
  'reports.view': 'Ver reportes',
  'reports.export': 'Exportar reportes',
  'reports.financial': 'Ver reportes financieros',
  
  // User management permissions
  'users.view': 'Ver usuarios',
  'users.create': 'Crear usuarios',
  'users.edit': 'Editar usuarios',
  'users.delete': 'Eliminar usuarios',
  
  // Settings permissions
  'settings.view': 'Ver configuración',
  'settings.edit': 'Editar configuración',
  'settings.system': 'Configuración del sistema',
  
  // Admin permissions
  'admin.all': 'Acceso completo de administrador'
};

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'inventory.view', 'inventory.edit', 'inventory.transfer',
    'production.view', 'production.create', 'production.edit',
    'delivery.view', 'delivery.create', 'delivery.edit', 'delivery.assign',
    'reports.view', 'reports.export', 'reports.financial',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit', 'settings.system',
    'admin.all'
  ],
  manager: [
    'sales.view', 'sales.create', 'sales.edit',
    'inventory.view', 'inventory.edit', 'inventory.transfer',
    'production.view', 'production.create', 'production.edit',
    'delivery.view', 'delivery.create', 'delivery.edit', 'delivery.assign',
    'reports.view', 'reports.export', 'reports.financial',
    'users.view', 'users.edit',
    'settings.view', 'settings.edit'
  ],
  supervisor: [
    'sales.view', 'sales.create', 'sales.edit',
    'inventory.view', 'inventory.edit',
    'production.view', 'production.create', 'production.edit',
    'delivery.view', 'delivery.create', 'delivery.edit',
    'reports.view', 'reports.export',
    'users.view'
  ],
  employee: [
    'sales.view', 'sales.create',
    'inventory.view',
    'production.view',
    'delivery.view',
    'reports.view'
  ],
  driver: [
    'delivery.view',
    'reports.view'
  ]
};

// Hook to check permissions
export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('admin.all')) return true;
    
    // Check specific permission
    return userPermissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };
  
  const getUserPermissions = () => {
    if (!user || !user.role) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    user
  };
};

// Permission Guard Component
const PermissionGuard = ({ 
  permission, 
  permissions = [], 
  requireAll = false,
  children, 
  fallback = null,
  showFallback = true 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No permissions specified, allow access
    hasAccess = true;
  }
  
  if (hasAccess) {
    return children;
  }
  
  if (!showFallback) {
    return null;
  }
  
  if (fallback) {
    return fallback;
  }
  
  // Default fallback
  return (
    <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="text-center">
        <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Acceso Restringido
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No tienes permisos para acceder a esta sección.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Contacta al administrador si necesitas acceso.
        </p>
      </div>
    </div>
  );
};

// Higher Order Component for route protection
export const withPermission = (permission, permissions = [], requireAll = false) => {
  return (Component) => {
    const WrappedComponent = (props) => {
      return (
        <PermissionGuard 
          permission={permission} 
          permissions={permissions}
          requireAll={requireAll}
        >
          <Component {...props} />
        </PermissionGuard>
      );
    };
    
    WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`;
    return WrappedComponent;
  };
};

// Component to show user permissions (for debugging/admin)
export const PermissionsList = () => {
  const { getUserPermissions, user } = usePermissions();
  const permissions = getUserPermissions();
  
  if (!user) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-white">
          Permisos de Usuario
        </h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Rol: <span className="font-medium">{user.role}</span>
        </p>
      </div>
      
      <div className="space-y-2">
        {permissions.map(permission => (
          <div 
            key={permission}
            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
          >
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {permission}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {PERMISSIONS[permission] || 'Sin descripción'}
            </span>
          </div>
        ))}
      </div>
      
      {permissions.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          No hay permisos asignados
        </p>
      )}
    </div>
  );
};

export default PermissionGuard;