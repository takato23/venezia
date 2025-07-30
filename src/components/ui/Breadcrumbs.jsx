import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import clsx from 'clsx';

const Breadcrumbs = ({ 
  customBreadcrumbs,
  className,
  showHome = true 
}) => {
  const location = useLocation();
  
  // Mapeo de rutas a nombres en español
  const routeNames = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/sales': 'Ventas',
    '/pos': 'Punto de Venta',
    '/inventory': 'Inventario',
    '/ingredients': 'Ingredientes',
    '/recipes': 'Recetas',
    '/stock': 'Stock',
    '/transactions': 'Transacciones',
    '/products': 'Productos',
    '/production': 'Producción',
    '/production-orders': 'Órdenes de Producción',
    '/batch-assignment': 'Asignación de Lotes',
    '/customers': 'Clientes',
    '/providers': 'Proveedores',
    '/stores': 'Tiendas',
    '/web-users': 'Usuarios Web',
    '/deliveries': 'Entregas',
    '/cashflow': 'Control de Caja',
    '/branches': 'Sucursales',
    '/corporate-dashboard': 'Dashboard Corporativo',
    '/reports': 'Reportes',
    '/analytics': 'Analíticas',
    '/temperature': 'Control de Temperatura',
    '/settings': 'Configuración',
    '/shop': 'Tienda Web',
    '/ai-assistant': 'Asistente IA'
  };

  // Generar breadcrumbs automáticamente si no se proporcionan custom
  const generateBreadcrumbs = () => {
    if (customBreadcrumbs) return customBreadcrumbs;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    if (showHome && location.pathname !== '/') {
      breadcrumbs.push({
        name: 'Inicio',
        path: '/',
        icon: Home
      });
    }
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = routeNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        name,
        path: currentPath,
        current: index === pathSegments.length - 1
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length <= 1 && location.pathname === '/') {
    return null; // No mostrar breadcrumbs en la página de inicio
  }

  return (
    <nav className={clsx('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
            
            {breadcrumb.current ? (
              <span className="flex items-center gap-1 text-gray-900 dark:text-white font-medium">
                {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={`Ir a ${breadcrumb.name}`}
              >
                {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;