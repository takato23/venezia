## Roadmap consolidado

### Fase 1: Estabilización Webshop y Seguridad
- Variables de entorno (`SECRET_KEY`, `SQLALCHEMY_DATABASE_URI`, MP sandbox).
- CSRF en formularios/POST.
- Webshop: sabores unificados, número de orden visible, checkout con redirección a MP.
- Multi-sucursal: `store_id` en checkout.

### Fase 2: POS rápido (teclado/táctil) + Stock
- Atajos indispensables y selector de sabores por formato.
- Cobro QR MP (sandbox/mock) e impresión térmica básica.
- Descuento de stock atómico por `store_id`.

### Fase 3: Multi-sucursal end-to-end y reportes
- Selector de sucursal fijo por sesión (6 sucursales Pergamino).
- Aislamiento por `store_id` en ventas, stock y reportes.
- Reportes diarios por sucursal y alertas de stock.

### Fase 4: Pagos/Delivery y Mensajería
- Webhook MP robusto, reintentos e idempotencia.
- Estados de delivery operativos y flujo Webshop → despacho.
- WhatsApp a definir (no bloquea fases anteriores).

### Fase 5: Calidad, offline POS y observabilidad
- Tests Flask/React y monitoreo básico.
- Soporte offline degradado para POS (planificación y PWA).


