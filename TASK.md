## Sprint 1 — Estabilización Webshop, Seguridad y Pagos (1 semana)

### Objetivos
- Pago online obligatorio en Webshop (MercadoPago sandbox) y QR en POS (preparación sandbox/mock).
- Seguridad básica: variables de entorno y CSRF.
- Multi-sucursal: preparar uso de `store_id` en flujos clave.
- Correcciones Webshop: sabores, número de orden y redirección a pago.

### Tareas
- [ ] Backend | Configuración: mover `SECRET_KEY` y `SQLALCHEMY_DATABASE_URI` a variables de entorno; agregar `.env.example`.
- [ ] Backend | CSRF: habilitar protección CSRF en formularios/POST sensibles del Webshop.
- [x] Webshop | API Sabores: unificar contrato (JS acepta lista o `{status, flavors}`) y manejar errores.
- [x] Webshop | Checkout: crear preferencia MP al confirmar y redirigir a `init_point`; fallback si sandbox no disponible.
- [x] Webshop | Número de orden: mostrar valor consistente en confirmación (usar `delivery_notes` o ID).
- [x] Webshop | Multi-sucursal: usar `session['active_store_id']` si existe; fallback a `1`.
- [ ] MP | Sandbox: configurar `BASE_URL`, `MERCADOPAGO_WEBHOOK_URL`; documentar cómo probar.
- [ ] Docs: consolidar `roadmap.md` (desde txt) y mantener este `TASK.md` vivo.
- [x] QA manual: flujo Webshop completo (agregar pote → checkout → MP sandbox → webhook simulado → confirmación).

### Pruebas (mínimo)
- [ ] Ruta `/webshop/api/flavors` (ok, edge sin sabores, error server).
- [ ] Checkout feliz: retorna `payment_link` y redirige.
- [ ] Confirmación: muestra número de orden o ID.
- [ ] Fallback sandbox off: mensaje amigable y confirmación local.

## Próximo Sprint — POS rápido (teclado/QR) y stock (1 semana)

### Objetivos
- POS con atajos indispensables (nuevo ticket, agregar/eliminar ítem, cobrar) y selector de sabores con límites.
- Cobro QR MP desde POS (sandbox/mock) y recibo/impresión térmica básica.
- Descuento de stock atómico por `store_id`.

### Tareas
- [x] POS (Flask actual) | Selector de sabores con sugeridos, completar automático y badges.
- [x] POS | Atajos de teclado básicos: nuevo ticket (n), pote rápido (q), Enter confirma modal.
- [x] POS | Cobrar con teclado (c) forzando MP por defecto; QR/link en modal.
- [ ] MP POS: generar preferencia y mostrar QR/link; manejar estados.
- [ ] Stock: reserva/consumo consistente en POS y Webshop.

## Notas
- WhatsApp: pendiente definir con cliente (no bloquear Sprints 1-2).
- Offline POS: planificar modo degradado en sprint posterior.

