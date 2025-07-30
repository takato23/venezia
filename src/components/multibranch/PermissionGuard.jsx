import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { useBranchPermissions, useCanPerform } from '../../hooks/useBranchPermissions';

// Componente para proteger rutas basado en permisos
export const BranchPermissionGuard = ({ 
  children, 
  branchId, 
  requiredPermission,
  fallbackPath = '/dashboard',
  showError = true 
}) => {
  const { permissions, loading } = useBranchPermissions(branchId);
  const canPerform = useCanPerform(requiredPermission, branchId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!canPerform) {
    if (showError) {
      return <Navigate to={fallbackPath} replace />;
    }
    return null;
  }

  return children;
};

// Componente para ocultar/mostrar elementos basado en permisos
export const PermissionGate = ({ 
  children, 
  branchId, 
  requiredPermission,
  fallback = null,
  showMessage = false 
}) => {
  const canPerform = useCanPerform(requiredPermission, branchId);

  if (!canPerform) {
    if (showMessage && fallback) {
      return fallback;
    }
    return null;
  }

  return children;
};

// Componente de mensaje de sin permisos
export const NoPermissionMessage = ({ 
  action = 'realizar esta acción',
  suggestion = 'Contacta a tu administrador para obtener los permisos necesarios.' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <Shield className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Sin permisos suficientes
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-4">
        No tienes permisos para {action}.
      </p>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {suggestion}
      </p>
    </motion.div>
  );
};

// HOC para componentes que requieren permisos
export const withBranchPermission = (
  Component, 
  requiredPermission,
  options = {}
) => {
  return (props) => {
    const branchId = props.branchId || localStorage.getItem('currentBranchId');
    const { permissions, loading } = useBranchPermissions(branchId);
    const canPerform = useCanPerform(requiredPermission, branchId);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!canPerform) {
      if (options.hideComponent) {
        return null;
      }
      
      if (options.showMessage) {
        return (
          <NoPermissionMessage 
            action={options.actionMessage || 'acceder a esta sección'}
            suggestion={options.suggestion}
          />
        );
      }

      if (options.redirect) {
        return <Navigate to={options.redirect} replace />;
      }

      return null;
    }

    return <Component {...props} permissions={permissions} />;
  };
};

// Hook para botones con permisos
export const PermissionButton = ({
  children,
  onClick,
  branchId,
  requiredPermission,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
  showTooltip = true,
  tooltipText = 'No tienes permisos para realizar esta acción',
  ...props
}) => {
  const canPerform = useCanPerform(requiredPermission, branchId);

  const handleClick = (e) => {
    if (!canPerform) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick && onClick(e);
  };

  return (
    <div className="relative inline-block">
      <button
        {...props}
        onClick={handleClick}
        disabled={!canPerform}
        className={`${className} ${!canPerform ? disabledClassName : ''}`}
        title={!canPerform && showTooltip ? tooltipText : props.title}
      >
        {children}
      </button>
      {!canPerform && showTooltip && (
        <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full mb-2 left-1/2 transform -translate-x-1/2">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          {tooltipText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar el rol actual del usuario
export const UserRoleBadge = ({ branchId }) => {
  const { permissions } = useBranchPermissions(branchId);
  
  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    supervisor: 'bg-green-100 text-green-800',
    cashier: 'bg-yellow-100 text-yellow-800',
    viewer: 'bg-gray-100 text-gray-800'
  };

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    cashier: 'Cajero',
    viewer: 'Observador'
  };

  if (!permissions.role) return null;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[permissions.role]}`}>
      {roleLabels[permissions.role]}
    </span>
  );
};