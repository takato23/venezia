POS Quickstart

Levantar backend

```
node backend/migrate.js
node backend/server-new.js
```

Healthcheck: GET /api/health

Semilla de productos (005)

La migración 005 agrega productos base (101-106). Si ya existen, se ignora (INSERT OR IGNORE).

Probar productos

```
curl -s 'http://localhost:5002/api/products?search=&page=1&pageSize=10'
```

Crear código de descuento

```
curl -s -X POST http://localhost:5002/api/admin/admin_codes \
 -H 'Content-Type: application/json' \
 -d '{
   "type":"discount",
   "discount_type":"percent",
   "discount_value":10,
   "max_uses":2,
   "expires_at":"2030-01-01T00:00:00Z",
   "store_id":1
 }'
```

Venta POS

```
curl -s -X POST http://localhost:5002/api/sales \
 -H 'Content-Type: application/json' \
 -d '{
   "store_id": 1,
   "items": [
     {"product_id": 101, "quantity": 1, "price": 2500},
     {"product_id": 106, "quantity": 2, "price": 900}
   ],
   "admin_code": "<CODE>"
 }'
```

Respuesta: { success, data: { sale_id, total, discount, total_final, admin_code } }

UI POS

- Ruta: /pos
- Buscar productos, agregar al carrito, aplicar/quitar código, confirmar venta.

Tests

```
node backend/tests/run-all-tests.js
```

Incluye prueba POS Flow (lite).


