# Guía de Usuario - Sistema Multi-Sucursal

## 🏪 Acceso a las Funcionalidades

### 1. Dashboard Corporativo
**Ruta:** `/corporate-dashboard`

#### Funciones Principales:
- **Vista General**: Métricas consolidadas de todas las sucursales
- **Filtros**: 
  - Selección múltiple de sucursales
  - Rangos de tiempo (Hoy, Semana, Mes, Año)
- **Métricas Clave**:
  - Ingresos totales
  - Ventas totales
  - Ticket promedio
  - Alertas de inventario

#### Gráficos Disponibles:
- Tendencia de ventas (línea temporal)
- Productos más vendidos (ranking)
- Rendimiento por sucursal (barras comparativas)

### 2. Gestión de Sucursales
**Ruta:** `/branches`

#### Funciones:
- **Crear Nueva Sucursal**
  - Datos básicos (nombre, código, dirección)
  - Ubicación en mapa
  - Horarios de apertura
  - Características (delivery, WiFi, estacionamiento)

- **Editar Sucursal Existente**
  - Actualizar información
  - Activar/desactivar sucursal
  - Cambiar sucursal principal

- **Visualización en Mapa**
  - Vista de todas las sucursales
  - Estado en tiempo real
  - Información al hacer clic

### 3. Selector de Sucursal
**Ubicación:** Header de la aplicación

- Cambio rápido entre sucursales
- Indicador de sucursal activa
- Estado online/offline
- Horario actual

## 📊 Casos de Uso Comunes

### Verificar Inventario Crítico
1. Ir a Dashboard Corporativo
2. Revisar sección "Alertas de Inventario Crítico"
3. Identificar productos y sucursales afectadas
4. Iniciar transferencia si es necesario

### Comparar Rendimiento
1. Acceder al Dashboard Corporativo
2. Seleccionar período de comparación
3. Revisar sección "Rendimiento por Sucursal"
4. Analizar métricas y tendencias

### Gestionar Personal
1. Seleccionar sucursal desde el header
2. Ir a configuración de empleados
3. Asignar roles específicos por sucursal
4. Configurar turnos de trabajo

### Transferir Stock
1. Identificar sucursal con faltante
2. Buscar sucursal con excedente
3. Crear solicitud de transferencia
4. Aprobar y completar transferencia

## 🔐 Permisos y Accesos

### Niveles de Acceso
- **Corporativo**: Ve todas las sucursales
- **Gerente Regional**: Ve grupo de sucursales
- **Gerente de Sucursal**: Ve solo su sucursal
- **Empleado**: Acceso operativo básico

### Restricciones por Rol
| Función | Admin | Manager | Employee |
|---------|-------|---------|----------|
| Ver Dashboard Corporativo | ✅ | ❌ | ❌ |
| Crear Sucursales | ✅ | ❌ | ❌ |
| Editar Sucursal | ✅ | ✅ | ❌ |
| Ver Inventario | ✅ | ✅ | ✅ |
| Transferir Stock | ✅ | ✅ | ❌ |

## 🎨 Interfaz y Navegación

### Modo Oscuro
- Cambio automático según preferencias del sistema
- Colores optimizados para reducir fatiga visual
- Gráficos adaptados para mejor contraste

### Atajos de Teclado
- `Ctrl/Cmd + B`: Abrir selector de sucursal
- `Ctrl/Cmd + D`: Ir a dashboard
- `Ctrl/Cmd + R`: Refrescar datos

### Indicadores Visuales
- 🟢 Sucursal abierta
- 🔴 Sucursal cerrada
- 🟡 Horario especial
- ⚠️ Alerta de inventario

## 📱 Tips para Uso Eficiente

1. **Personaliza tu Vista**
   - Guarda filtros frecuentes
   - Ordena sucursales por prioridad
   - Configura alertas personalizadas

2. **Monitoreo Proactivo**
   - Revisa el dashboard al inicio del día
   - Configura notificaciones críticas
   - Anticipa necesidades de stock

3. **Gestión de Equipos**
   - Asigna roles claros por sucursal
   - Documenta procedimientos
   - Utiliza el sistema de mensajes

4. **Análisis de Datos**
   - Exporta reportes semanales
   - Compara períodos similares
   - Identifica patrones estacionales

## 🆘 Solución Rápida de Problemas

### No veo todas las sucursales
- Verifica tus permisos de acceso
- Confirma estar en la organización correcta
- Contacta al administrador

### Datos no se actualizan
- Presiona el botón de refrescar
- Verifica conexión a internet
- Limpia caché del navegador

### Error al crear sucursal
- Verifica límite del plan
- Revisa campos obligatorios
- Confirma código único

## 📞 Contacto y Soporte
- Email: soporte@veneziapos.com
- WhatsApp: +54 11 1234-5678
- Horario: Lun-Vie 9:00-18:00