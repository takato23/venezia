# SuperBot Venezia - Guía Completa

## 🤖 Introducción

SuperBot Venezia es un asistente inteligente con capacidades de IA avanzadas para la gestión completa de tu heladería. Utiliza Google Gemini AI cuando está disponible y tiene un sistema de fallbacks inteligentes.

## 🚀 Configuración

### API Key de Gemini

El sistema detecta automáticamente la API key de Gemini desde:

1. **Variables de entorno** (`.env`):
```env
REACT_APP_GEMINI_API_KEY=tu_api_key_aqui
```

2. **Configuración manual** (en la interfaz):
- Ve a Configuración → AI → Gemini API Key
- Ingresa tu API key y guarda

### Límites de API

- **Límite diario**: 1,500 requests
- **Renovación**: Cada 24 horas
- **Caché inteligente**: Reduce uso de API en ~60%

## 📝 Comandos Disponibles

### Inventario y Stock

#### Agregar Stock
```
"Agregar 10 kg de chocolate"
"Suma 5 unidades de vainilla"
"Llegaron 15 kilos de fresa"
"Reponer 20 kg de menta"
```

#### Consultar Stock
```
"¿Cuánto chocolate queda?"
"Stock de vainilla"
"¿Qué cantidad tengo de fresa?"
"Verificar inventario de menta"
```

#### Alertas de Stock
```
"¿Qué necesito reponer?"
"Productos con stock bajo"
"Mostrar alertas de inventario"
"¿Qué se está agotando?"
```

#### Crear Productos
```
"Crear helado de pistacho $5000"
"Nuevo sabor mango $4500"
"Agregar helado de cookies $5200"
"Lanzar sabor maracuyá $4800"
```

#### Actualizar Precios
```
"Cambiar precio de chocolate a $4500"
"El helado de vainilla ahora cuesta $4000"
"Actualizar precio fresa $4200"
"Subir precio de menta a $4300"
```

### Ventas y Reportes

#### Ventas Diarias
```
"¿Cuánto vendimos hoy?"
"Ventas del día"
"¿Cómo van las ventas?"
"Balance de hoy"
```

#### Productos Más Vendidos
```
"¿Cuál es el sabor más vendido?"
"Top 5 productos"
"Ranking de ventas"
"¿Qué se vende más?"
```

#### Análisis de Ventas
```
"Ventas de la semana"
"¿Cómo fue el mes?"
"Comparar con ayer"
"Tendencias de venta"
```

### Producción

#### Órdenes de Producción
```
"Hacer 20 helados de chocolate"
"Producir 15 de vainilla"
"Preparar lote de 30 fresa"
```

#### Recetas y Costos
```
"¿Qué recetas puedo hacer?"
"Calcular costo de chocolate"
"Recetas disponibles"
```

### Comandos Compuestos (Nuevo!)

#### Stock + Precio
```
"Agregar 10 kg de chocolate y cambiar precio a $5000"
"Suma 5 de vainilla y actualiza precio $4200"
```

#### Crear + Stock
```
"Crear helado mango $4500 con 20 unidades"
"Nuevo sabor pistacho $5000 y agregar 15 kg"
```

### Análisis Empresarial

#### Salud del Negocio
```
"¿Cómo está el negocio?"
"Salud empresarial"
"Estado general"
"Diagnóstico del negocio"
```

#### Análisis de Rentabilidad
```
"Productos más rentables"
"Análisis de márgenes"
"¿Qué genera más ganancia?"
```

#### Métricas y KPIs
```
"KPIs del negocio"
"Métricas de rendimiento"
"Indicadores clave"
```

### Comandos de Emergencia

```
"Alerta de stock crítico"
"Estado crítico del negocio"
"Pedido urgente"
"¿Qué productos están agotados?"
```

## 🎯 Características Avanzadas

### Caché Inteligente

El sistema cachea automáticamente:
- Consultas de productos (5 minutos)
- Respuestas frecuentes (1 hora)
- Comandos ejecutados (sesión)

### Sinónimos y Variaciones

El bot entiende variaciones naturales:
- Chocolate = choco, chocolat
- Vainilla = vanilla
- Fresa = frutilla, strawberry
- Agregar = suma, añadir, incrementar

### Ejecución Automática

Por defecto, los comandos críticos requieren confirmación:
- Crear productos
- Cambiar precios
- Eliminar items

Puedes activar la ejecución automática en configuración.

## 📊 Indicadores Visuales

### Estado del AI

El indicador muestra:
- 🟢 **Gemini**: Usando AI real con respuestas avanzadas
- 🤖 **SuperBot**: Comandos específicos ejecutados localmente
- 💬 **Mock**: Respuestas predefinidas inteligentes
- ⚡ **Fallback**: Modo básico de emergencia

### Requests Restantes

Barra de progreso mostrando:
- Verde: > 500 requests
- Amarillo: 100-500 requests
- Rojo: < 100 requests

## 🔧 Solución de Problemas

### "No se detecta API Key"

1. Verifica que esté en `.env`
2. Reinicia el servidor de desarrollo
3. Configura manualmente en la interfaz

### "Límite de requests alcanzado"

- Espera 24 horas para renovación
- Usa el modo Mock mientras tanto
- Considera optimizar consultas frecuentes

### "Comando no reconocido"

- Verifica la ortografía
- Usa comandos más simples
- Consulta "¿qué comandos puedo usar?"

## 💡 Tips de Uso

1. **Sé específico**: "Agregar 10 kg de chocolate" es mejor que "agregar chocolate"

2. **Usa nombres completos**: El bot funciona mejor con nombres completos de productos

3. **Comandos naturales**: Escribe como hablarías normalmente

4. **Aprovecha el caché**: Consultas repetidas son instantáneas

5. **Revisa el indicador**: Siempre sabrás qué sistema AI está activo

## 🚀 Próximas Funcionalidades

- [ ] Comandos por voz mejorados
- [ ] Predicciones de demanda
- [ ] Integración con proveedores
- [ ] Reportes automáticos por email
- [ ] Análisis predictivo avanzado

## 📞 Soporte

Si tienes problemas o sugerencias:
- Email: soporte@veneziaicecream.com
- WhatsApp: +54 9 11 1234-5678
- En la app: Configuración → Ayuda → Contactar Soporte