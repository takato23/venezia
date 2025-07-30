# Guía de Configuración del Sistema Multi-Sucursal

## Descripción General
El sistema multi-sucursal permite gestionar múltiples heladerías desde una única plataforma, con control de inventario, ventas, personal y métricas por sucursal.

## Requisitos Previos
- Supabase configurado y funcionando
- React con las dependencias instaladas
- Google Maps API Key (para visualización de mapas)

## Pasos de Instalación

### 1. Configuración de Base de Datos

#### Orden de Ejecución de Scripts SQL
Es **crítico** ejecutar los scripts SQL en el orden correcto para evitar errores de dependencias:

1. **01-create-organizations.sql** - Crea las tablas base
   - Tabla `organizations` 
   - Tabla `branches`
   - Índices necesarios

2. **02-update-users-table.sql** - Actualiza usuarios existentes
   - Agrega campos multi-sucursal a la tabla `users`
   - `organization_id`, `branch_access`, `role_per_branch`

3. **03-create-branch-tables.sql** - Crea tablas relacionadas
   - `branch_inventory` - Inventario por sucursal
   - `branch_prices` - Precios por sucursal
   - `branch_transfers` - Transferencias entre sucursales
   - `work_shifts` - Turnos de trabajo
   - `employee_shifts` - Asignación de empleados
   - `cash_registers` - Cajas registradoras
   - `cash_movements` - Movimientos de caja

4. **04-insert-demo-data.sql** - Datos de demostración
   - Organización demo
   - 3 sucursales de ejemplo
   - Actualiza usuarios existentes con acceso

#### Cómo Ejecutar los Scripts

1. Accede a tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Ejecuta cada script en orden:
   ```sql
   -- Pega el contenido de cada archivo y ejecuta uno por uno
   -- Espera a que cada script termine antes de ejecutar el siguiente
   ```

### 2. Configuración del Frontend

#### Instalar Dependencias
```bash
npm install @react-google-maps/api
```

#### Configurar Google Maps
1. Obtén una API Key de Google Cloud Console
2. Habilita las APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

3. Agrega la key en tu archivo `.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
   ```

### 3. Nuevas Rutas Disponibles

- `/branches` - Gestión de sucursales
- `/corporate-dashboard` - Dashboard corporativo
- `/stock-transfers` - Transferencias entre sucursales

### 4. Estructura de Permisos

#### Roles por Sucursal
- **admin** - Control total de la sucursal
- **manager** - Gestión de ventas e inventario
- **employee** - Operaciones de venta

#### Ejemplo de Usuario Multi-Sucursal
```json
{
  "organization_id": "uuid",
  "branch_access": ["branch1_id", "branch2_id"],
  "role_per_branch": {
    "branch1_id": "admin",
    "branch2_id": "manager"
  }
}
```

### 5. Funcionalidades Principales

#### Dashboard Corporativo
- Métricas consolidadas de todas las sucursales
- Comparación de rendimiento
- Alertas de inventario crítico
- Tendencias de ventas

#### Gestión de Sucursales
- CRUD completo de sucursales
- Visualización en mapa
- Horarios de apertura
- Características por sucursal

#### Sistema de Transferencias
- Solicitar productos entre sucursales
- Flujo de aprobación
- Seguimiento de transferencias

### 6. Verificación de la Instalación

1. **Verificar Tablas Creadas**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('organizations', 'branches', 'branch_inventory');
   ```

2. **Verificar Datos Demo**
   ```sql
   SELECT * FROM organizations;
   SELECT * FROM branches;
   ```

3. **Probar Acceso**
   - Inicia sesión con usuario admin
   - Verifica que puedas ver las sucursales
   - Accede al dashboard corporativo

### 7. Solución de Problemas

#### Error: "relation organizations does not exist"
- Asegúrate de ejecutar los scripts en orden
- Verifica que el script 01 se ejecutó correctamente

#### No se ven las sucursales
- Verifica que el usuario tenga `organization_id` asignado
- Revisa que `branch_access` contenga IDs válidos

#### Mapas no cargan
- Verifica tu Google Maps API Key
- Revisa la consola del navegador por errores

### 8. Configuración Avanzada

#### Límites por Plan
```javascript
const PLAN_LIMITS = {
  basic: { maxBranches: 2 },
  professional: { maxBranches: 5 },
  enterprise: { maxBranches: -1 } // Sin límite
};
```

#### Notificaciones en Tiempo Real
El sistema está preparado para WebSocket. Configura tu servidor:
```javascript
// backend/services/notifications.js
io.on('connection', (socket) => {
  socket.on('join-organization', (orgId) => {
    socket.join(`org-${orgId}`);
  });
});
```

### 9. Próximos Pasos

1. Configurar respaldos automáticos por sucursal
2. Implementar reportes consolidados
3. Agregar módulo de franquicias
4. Integrar sistema de delivery multi-sucursal

## Soporte
Para problemas o consultas, revisa los logs en:
- Frontend: Consola del navegador
- Backend: Logs de Supabase
- Base de datos: SQL Editor de Supabase