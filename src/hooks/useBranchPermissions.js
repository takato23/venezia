import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../config/supabase';

export const useBranchPermissions = (branchId) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canDelete: false,
    canManageEmployees: false,
    canManageInventory: false,
    canViewReports: false,
    canApproveTransfers: false,
    canManagePrices: false,
    role: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !branchId) {
      setLoading(false);
      return;
    }

    checkPermissions();
  }, [user, branchId]);

  const checkPermissions = async () => {
    try {
      // Verificar si el usuario tiene acceso a la sucursal
      const hasBranchAccess = user.branch_access?.includes(branchId);
      
      if (!hasBranchAccess) {
        setPermissions({
          canView: false,
          canEdit: false,
          canDelete: false,
          canManageEmployees: false,
          canManageInventory: false,
          canViewReports: false,
          canApproveTransfers: false,
          canManagePrices: false,
          role: null
        });
        setLoading(false);
        return;
      }

      // Obtener el rol del usuario en esta sucursal
      const userRole = user.role_per_branch?.[branchId] || user.role || 'viewer';

      // Definir permisos según el rol
      const rolePermissions = {
        admin: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canManageEmployees: true,
          canManageInventory: true,
          canViewReports: true,
          canApproveTransfers: true,
          canManagePrices: true,
          role: 'admin'
        },
        manager: {
          canView: true,
          canEdit: true,
          canDelete: false,
          canManageEmployees: true,
          canManageInventory: true,
          canViewReports: true,
          canApproveTransfers: true,
          canManagePrices: true,
          role: 'manager'
        },
        supervisor: {
          canView: true,
          canEdit: true,
          canDelete: false,
          canManageEmployees: false,
          canManageInventory: true,
          canViewReports: true,
          canApproveTransfers: false,
          canManagePrices: false,
          role: 'supervisor'
        },
        cashier: {
          canView: true,
          canEdit: false,
          canDelete: false,
          canManageEmployees: false,
          canManageInventory: false,
          canViewReports: false,
          canApproveTransfers: false,
          canManagePrices: false,
          role: 'cashier'
        },
        viewer: {
          canView: true,
          canEdit: false,
          canDelete: false,
          canManageEmployees: false,
          canManageInventory: false,
          canViewReports: false,
          canApproveTransfers: false,
          canManagePrices: false,
          role: 'viewer'
        }
      };

      setPermissions(rolePermissions[userRole] || rolePermissions.viewer);
    } catch (error) {
      console.error('Error checking permissions:', error);
      // En caso de error, dar permisos mínimos
      setPermissions({
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageEmployees: false,
        canManageInventory: false,
        canViewReports: false,
        canApproveTransfers: false,
        canManagePrices: false,
        role: 'viewer'
      });
    } finally {
      setLoading(false);
    }
  };

  return { permissions, loading, refetch: checkPermissions };
};

// Hook para verificar permisos específicos
export const useCanPerform = (action, branchId) => {
  const { permissions } = useBranchPermissions(branchId);
  
  const actionMap = {
    'view': permissions.canView,
    'edit': permissions.canEdit,
    'delete': permissions.canDelete,
    'manage_employees': permissions.canManageEmployees,
    'manage_inventory': permissions.canManageInventory,
    'view_reports': permissions.canViewReports,
    'approve_transfers': permissions.canApproveTransfers,
    'manage_prices': permissions.canManagePrices
  };

  return actionMap[action] || false;
};

// Hook para obtener todas las sucursales con permisos
export const useBranchesWithPermissions = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadBranchesWithPermissions();
  }, [user]);

  const loadBranchesWithPermissions = async () => {
    try {
      // Obtener solo las sucursales a las que el usuario tiene acceso
      const { data: branchData, error } = await supabase
        .from('branches')
        .select('*')
        .in('id', user.branch_access || [])
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Agregar información de permisos a cada sucursal
      const branchesWithPerms = branchData.map(branch => ({
        ...branch,
        userRole: user.role_per_branch?.[branch.id] || user.role || 'viewer',
        canManage: ['admin', 'manager'].includes(
          user.role_per_branch?.[branch.id] || user.role || 'viewer'
        )
      }));

      setBranches(branchesWithPerms);
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  return { branches, loading, refetch: loadBranchesWithPermissions };
};

// Hook para validar acciones antes de ejecutarlas
export const useValidateAction = () => {
  const validateAction = (permissions, action, showError = true) => {
    const validationMap = {
      'create': permissions.canEdit,
      'update': permissions.canEdit,
      'delete': permissions.canDelete,
      'approve': permissions.canApproveTransfers,
      'manage_staff': permissions.canManageEmployees,
      'view_reports': permissions.canViewReports,
      'change_prices': permissions.canManagePrices
    };

    const hasPermission = validationMap[action] || false;

    if (!hasPermission && showError) {
      // Mostrar mensaje de error
      const errorMessage = `No tienes permisos para ${getActionMessage(action)}`;
      console.error(errorMessage);
      // Aquí podrías usar tu sistema de notificaciones
      // toast.error(errorMessage);
    }

    return hasPermission;
  };

  const getActionMessage = (action) => {
    const messages = {
      'create': 'crear este elemento',
      'update': 'editar este elemento',
      'delete': 'eliminar este elemento',
      'approve': 'aprobar transferencias',
      'manage_staff': 'gestionar empleados',
      'view_reports': 'ver reportes',
      'change_prices': 'cambiar precios'
    };

    return messages[action] || action;
  };

  return { validateAction };
};