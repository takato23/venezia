# 🧪 TESTEAR TIENDA WEB - GUÍA RÁPIDA

## 1️⃣ ABRIR LA TIENDA (1 minuto)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

**Abrir en navegador:**
- Admin: http://localhost:5173
- Tienda: http://localhost:5173/webshop

## 2️⃣ AGREGAR PRODUCTOS DE PRUEBA (2 minutos)

Si no tienes productos, ejecuta esto en la consola del navegador (F12):

```javascript
// Crear productos de ejemplo
const testProducts = [
  { name: "Helado 1kg - Chocolate", price: 2500, category: "Helados" },
  { name: "Helado 1kg - Vainilla", price: 2500, category: "Helados" },
  { name: "Helado 1/2kg - Frutilla", price: 1500, category: "Helados" },
  { name: "Helado 1/4kg - Dulce de Leche", price: 800, category: "Helados" },
  { name: "Torta Helada - Oreo", price: 4500, category: "Postres" },
  { name: "Paleta Artesanal", price: 350, category: "Paletas" }
];

// Los productos ya deberían estar en tu base de datos
console.log("Productos listos para la tienda!");
```

## 3️⃣ CONFIGURAR WHATSAPP (30 segundos)

### Opción A: Rápido por localStorage
En la consola del navegador (F12) en la página de la tienda:

```javascript
localStorage.setItem('webshop_config', JSON.stringify({
  whatsappNumber: '+5491123456789', // TU NÚMERO
  storeName: 'Venezia Gelato',
  storeAddress: 'Tu Dirección 123',
  deliveryEnabled: true,
  deliveryFee: 350,
  minimumOrder: 2000
}));

// Recargar página
location.reload();
```

### Opción B: Por archivo .env
```bash
# En backend/.env
WHATSAPP_NUMBER=+5491123456789
```

## 4️⃣ FLUJO DE PRUEBA COMPLETO

### Como Cliente:
1. **Entrar a** http://localhost:5173/webshop
2. **Agregar** 2-3 productos al carrito
3. **Click** en el carrito (arriba derecha)
4. **Click** en "Pedir por WhatsApp"
5. **Verificar** que se abre WhatsApp con el mensaje

### Mensaje esperado:
```
Hola! 🍦 Quiero hacer un pedido:

📍 *Pedido:*
• 1x Helado 1kg - Chocolate ($2,500)
• 1x Helado 1/2kg - Frutilla ($1,500)

💰 *Total: $4,000*

📱 Entrega: Retiro en local
```

## 5️⃣ PROBLEMAS COMUNES

### "No se ven productos"
```javascript
// Verificar en Network (F12) que llama a:
GET /api/public/shop/products

// Si devuelve vacío, verificar que tengas productos activos
```

### "WhatsApp no abre"
```javascript
// Verificar formato del número:
// ✅ Correcto: '+5491123456789'
// ❌ Incorrecto: '11 2345-6789'
```

### "Error 404 en /webshop"
```bash
# Verificar que la ruta existe:
# src/App.jsx línea 521 debe tener:
<Route path="/webshop" element={<WebShop />} />
```

## 6️⃣ COMPARTIR PARA TESTEAR

### Link local (tu computadora):
```
http://localhost:5173/webshop
```

### Link en red local (otros en tu WiFi):
```bash
# Buscar tu IP local:
ipconfig (Windows) o ifconfig (Mac/Linux)

# Compartir:
http://192.168.1.XXX:5173/webshop
```

### Mensaje para compartir:
```
🍦 Probá nuestra nueva tienda online!
📱 Hacé tu pedido por WhatsApp
🚚 Delivery o retiro en local
👉 [link-aquí]
```

## 7️⃣ MÉTRICAS DE ÉXITO

✅ **Funciona si:**
- Se ven los productos con fotos
- El carrito agrega/quita productos
- WhatsApp abre con el pedido completo
- El diseño se ve bien en celular

⏱️ **Tiempo total: 5-10 minutos**

## 🎉 ¡LISTO PARA VENDER!

Si todo funciona, ya podés:
1. Subir a producción
2. Compartir el link
3. Empezar a recibir pedidos

**Próximos pasos:**
- Agregar más fotos
- Configurar zonas de delivery
- Activar pagos online (MercadoPago)