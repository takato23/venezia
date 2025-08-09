# POS API quick QA

Productos

```bash
curl -s "http://localhost:5000/api/products?store_id=1&page=1&pageSize=24&search=agua" | jq
```

Admin code

```bash
curl -s -X POST http://localhost:5000/api/admin/admin_codes/validate -H "Content-Type: application/json" -d '{"code":"ABC123","store_id":1}' | jq
```

Venta

```bash
curl -s -X POST http://localhost:5000/api/sales -H "Content-Type: application/json" -d '{
  "store_id": 1,
  "items": [
    { "product_id": 1, "qty": 2 },
    { "product_id": 2, "qty": 1 }
  ],
  "admin_code": "ABC123",
  "client_idempotency_key": "pos-1234"
}' | jq
```