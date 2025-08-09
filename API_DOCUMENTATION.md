# 📚 Documentación Completa de la API - Venezia

## 🏗️ Arquitectura de la API

**Base URL:** `http://localhost:5002`  
**Puerto:** 5002  
**Servidor:** Express.js con SQLite  
**Estructura:** RESTful API con respuestas JSON estándar

## 📊 Formato de Respuesta Estándar

```json
{
  "success": true|false,
  "data": {...},
  "message": "Mensaje descriptivo",
  "error": "Error message (solo si success: false)"
}
```

## 🔗 Endpoints por Categoría

### 🩺 Health & Status

#### GET `/api/health`
**Descripción:** Verificación del estado del servidor  
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-08-01T...",
  "service": "venezia-backend-api"
}
```

---

### 👥 Customers (Clientes)

#### GET `/api/customers`
**Descripción:** Obtener todos los clientes  
**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "total": 10
}
```

#### GET `/api/customers/:id`
**Descripción:** Obtener cliente específico  
**Parámetros:** `id` (integer)

#### POST `/api/customers`
**Descripción:** Crear nuevo cliente  
**Body:** `{ name, email, phone, address }`

#### PUT `/api/customers/:id`
**Descripción:** Actualizar cliente  
**Parámetros:** `id` (integer)  
**Body:** `{ name, email, phone, address }`

#### DELETE `/api/customers/:id`
**Descripción:** Eliminar cliente  
**Parámetros:** `id` (integer)

---

### 📦 Products (Productos)

#### GET `/api/products`
**Descripción:** Obtener todos los productos  
**Query params:** Filtros opcionales  
**Respuesta:**
```json
{
  "success": true,
  "products": [...],
  "data": [...]  // compatibility
}
```

#### GET `/api/products/:id`
**Descripción:** Obtener producto específico

#### POST `/api/products`
**Descripción:** Crear nuevo producto

#### PUT `/api/products/:id`
**Descripción:** Actualizar producto

#### DELETE `/api/products/:id`
**Descripción:** Eliminar producto

---

### 💰 Cash Flow (Flujo de Caja)

#### GET `/api/cashflow/status`
**Descripción:** Estado actual de la caja registradora  
**Query params:** `store_id` (opcional)

#### POST `/api/cashflow/open`
**Descripción:** Abrir caja registradora  
**Body:** `{ user_id, store_id, initial_amount }`

#### POST `/api/cashflow/close`
**Descripción:** Cerrar caja registradora  
**Body:** `{ user_id, store_id, final_amount }`

#### POST `/api/cashflow/movements`
**Descripción:** Registrar movimiento de caja  
**Body:** `{ user_id, store_id, type, amount, description }`

#### GET `/api/cashflow`
**Descripción:** Obtener movimientos y resumen  
**Query params:** `store_id` (opcional)  
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "movements": [...],
    "summary": {...}
  }
}
```

#### PUT `/api/cashflow/movements/:id`
**Descripción:** Actualizar movimiento específico

---

### 🏭 Production (Producción)

#### GET `/api/production_batches`
**Descripción:** Obtener todos los lotes de producción  
**Respuesta:**
```json
{
  "success": true,
  "batches": [
    {
      "id": 1,
      "batch_number": "BATCH-001",
      "product_id": 1,
      "product_name": "Helado de Vainilla",
      "quantity": 50,
      "unit": "litros",
      "status": "completed|in_progress|pending|cancelled",
      "progress": 100,
      "assigned_user_id": 1,
      "assigned_user_name": "Admin",
      "scheduled_date": "2024-08-01T...",
      "created_at": "2024-08-01T...",
      "notes": "Notas adicionales"
    }
  ]
}
```

#### GET `/api/production_batches/:id`
**Descripción:** Obtener lote específico

#### POST `/api/production_batches`
**Descripción:** Crear nuevo lote

#### PUT `/api/production_batches/:id`
**Descripción:** Actualizar lote

#### PUT `/api/production_batches/:id/status`
**Descripción:** Actualizar solo el estado del lote  
**Body:** `{ status }`

#### DELETE `/api/production_batches/:id`
**Descripción:** Eliminar lote

---

### 🧾 Recipes (Recetas)

#### GET `/api/recipes`
**Descripción:** Obtener todas las recetas  
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Helado de Vainilla",
      "product_id": 1,
      "ingredients": []
    }
  ]
}
```

---

### 🥛 Ingredients (Ingredientes)

#### GET `/api/ingredients`
**Descripción:** Obtener todos los ingredientes  
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Leche",
      "quantity": 100,
      "unit": "litros",
      "cost_per_unit": 5,
      "minimum_stock": 20
    }
  ]
}
```

---

### 👤 Users (Usuarios)

#### GET `/api/users`
**Descripción:** Obtener todos los usuarios  
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "email": "admin@venezia.com",
      "role": "admin"
    }
  ]
}
```

---

### 💳 Sales (Ventas)

#### GET `/api/sales`
**Descripción:** Obtener todas las ventas  
**Respuesta:**
```json
{
  "success": true,
  "sales": [],
  "total": 0,
  "message": "Sales endpoint placeholder"
}
```

#### GET `/api/sales/today`
**Descripción:** Ventas del día actual  
**Respuesta:**
```json
{
  "success": true,
  "sales": [],
  "total": 0,
  "totalAmount": 0,
  "message": "Today's sales placeholder"
}
```

---

### 📊 Stock & Inventory

#### GET `/api/stock_data`
**Descripción:** Datos de inventario y stock  
**Respuesta:**
```json
{
  "success": true,
  "stock": [],
  "lowStock": [],
  "outOfStock": []
}
```

---

### 🏷️ Categories (Categorías)

#### GET `/api/categories`
**Descripción:** Obtener todas las categorías  
**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Helados",
      "description": "Helados artesanales"
    }
  ]
}
```

---

### 🚨 Alerts (Alertas)

#### GET `/api/alerts`
**Descripción:** Obtener todas las alertas del sistema  
**Respuesta:**
```json
{
  "success": true,
  "alerts": []
}
```

---

### 🚚 Deliveries (Entregas)

#### GET `/api/deliveries`
**Descripción:** Obtener todas las entregas  
**Respuesta:**
```json
{
  "success": true,
  "data": []
}
```

---

### 💳 Payments (Pagos)

#### GET `/api/payments/config`
**Descripción:** Configuración de métodos de pago  
**Respuesta:**
```json
{
  "success": true,
  "config": {
    "methods": ["cash", "credit_card", "debit_card", "transfer"],
    "default_method": "cash"
  }
}
```

---

## 🔧 Configuración del Servidor

### Variables de Entorno
- `PORT` - Puerto del servidor (default: 5002)
- `JWT_SECRET` - Secreto para JWT (⚠️ Se genera temporalmente si no se define)

### Base de Datos
- **Tipo:** SQLite
- **Inicialización:** Automática al iniciar el servidor
- **Seeding:** Se ejecuta automáticamente si la DB está vacía

### Middleware
- **CORS:** Habilitado para todos los orígenes
- **JSON Parser:** Habilitado para request bodies
- **Error Handler:** 404 para rutas no encontradas

---

## 🧪 Testing

### Script de Pruebas de Endpoints
```bash
node test-endpoints.js
```

### Verificación Manual
```bash
curl http://localhost:5002/api/health
```

---

## 📈 Estados de Desarrollo

### ✅ Completamente Implementados
- Health check
- Products CRUD
- Customers CRUD  
- Cash Flow completo
- Production batches completo

### 🔄 Implementados con Mocks
- Recipes
- Ingredients
- Users
- Sales
- Categories
- Alerts
- Deliveries
- Payment config

### 🎯 Próximos Pasos
1. Implementar lógica real para endpoints mock
2. Agregar autenticación JWT
3. Implementar validación de datos
4. Agregar logging y monitoring
5. Crear tests unitarios

---

## 🚨 Manejo de Errores

### Códigos de Estado HTTP
- `200` - Éxito
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### Formato de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalle técnico del error"
}
```

### Error Handler Global
Todas las rutas no definidas retornan:
```json
{
  "success": false,
  "message": "Endpoint not found",
  "path": "/ruta/solicitada"
}
```