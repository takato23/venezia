# SuperBot Venezia - Uso Avanzado

## 🚀 Comandos Compuestos

### Stock + Precio (Nuevo!)
Actualiza stock y precio en un solo comando:
```
"Agregar 10 kg de chocolate y cambiar precio a $5000"
"Llegaron 20 de vainilla y ahora cuesta $4200"
"Suma 15 kg de fresa y actualiza precio $4500"
```

### Crear + Stock (Nuevo!)
Crea producto con stock inicial:
```
"Crear helado mango $4500 con 20 unidades"
"Nuevo sabor pistacho $5000 y agregar 15 kg"
"Lanzar helado cookies $5200 con stock inicial 10"
```

### Operaciones Múltiples (Próximamente)
```
"Agregar 10 de chocolate, 15 de vainilla y 20 de fresa"
"Actualizar precios: chocolate $5000, vainilla $4500, fresa $4800"
```

## 📊 Análisis Predictivo

### Proyección de Ventas
```
"¿Cuánto helado de fresa necesitaré el fin de semana?"
"Proyección de ventas para mañana"
"¿Qué sabores se agotarán esta semana?"
```

### Análisis de Tendencias
```
"Tendencia de ventas de chocolate último mes"
"¿Qué sabores están perdiendo popularidad?"
"Comportamiento de ventas por día de semana"
```

### Recomendaciones Inteligentes
```
"¿Qué sabores debería promocionar hoy?"
"Recomienda producción para el fin de semana"
"¿Cuándo debo reponer stock de vainilla?"
```

## 🎯 Comandos Contextuales

### Por Hora del Día

**Mañana (6-10 AM)**:
- "Preparar stock para hoy"
- "¿Qué necesito para abrir?"
- "Estado de equipos de refrigeración"

**Mediodía (10-14)**:
- "¿Cómo van las ventas de la mañana?"
- "Ajustar producción para la tarde"
- "Stock de sabores populares"

**Tarde (14-18)**:
- "Análisis del pico de ventas"
- "¿Necesito reponer algo urgente?"
- "Preparación para el cierre"

**Noche (18-22)**:
- "Resumen del día"
- "Planificar producción de mañana"
- "Generar reporte diario"

## 🤖 Automatización Inteligente

### Alertas Automáticas
```
"Configurar alerta cuando chocolate < 5 kg"
"Avisarme si ventas < $50,000"
"Notificar productos por vencer"
```

### Pedidos Automáticos
```
"Generar pedido automático de productos bajos"
"Crear orden de compra para la semana"
"Pedido recurrente mensual de básicos"
```

### Reportes Programados
```
"Enviar reporte diario a las 9 PM"
"Resumen semanal cada lunes"
"Análisis mensual automático"
```

## 💡 Trucos y Optimizaciones

### 1. Búsquedas Inteligentes
```
"Productos que contengan 'chocolate'"
"Sabores con precio > $5000"
"Helados con stock < 10"
```

### 2. Comparaciones Rápidas
```
"Comparar ventas chocolate vs vainilla"
"Diferencia de stock con la semana pasada"
"Rentabilidad fresa vs menta"
```

### 3. Cálculos Automáticos
```
"¿Cuánto dinero tengo en inventario?"
"Margen de ganancia promedio"
"Costo de producir 50 helados de chocolate"
```

### 4. Filtros Avanzados
```
"Productos activos con margen > 60%"
"Sabores premium más vendidos"
"Ingredientes que vencen este mes"
```

## 🔧 Personalización

### Configurar Preferencias
```javascript
// En consola del navegador
localStorage.setItem('superbot-preferences', JSON.stringify({
  autoExecute: true,          // Ejecutar sin confirmación
  confirmationRequired: false, // No pedir confirmación
  language: 'es-AR',          // Español Argentina
  voiceEnabled: true,         // Comandos por voz
  cacheEnabled: true,         // Usar caché
  defaultUnit: 'kg'           // Unidad por defecto
}));
```

### Comandos Personalizados
```
"Aprender comando: 'stock crítico' = productos con < 3 unidades"
"Crear atajo: 'reporte' = ventas de hoy + stock bajo + proyección"
"Definir: 'mis favoritos' = chocolate, vainilla, fresa"
```

## 📈 Métricas de Rendimiento

### Ver Estadísticas del Bot
```
"Estadísticas de uso del bot"
"¿Cuántos comandos procesé hoy?"
"Tiempo de respuesta promedio"
"Comandos más usados"
```

### Optimización de Caché
```
"Ver estadísticas de caché"
"Limpiar caché de productos"
"Comandos más cacheados"
```

## 🚨 Comandos de Emergencia

### Modo Crisis
```
"ACTIVAR MODO EMERGENCIA"
"Backup completo del sistema"
"Diagnóstico rápido del negocio"
"Plan de contingencia stock cero"
```

### Recuperación Rápida
```
"Recuperar ventas del día anterior"
"Restaurar precios anteriores"
"Deshacer última operación masiva"
```

## 🎮 Atajos de Teclado

- **Ctrl + K**: Abrir chat rápido
- **Ctrl + /**: Ver comandos disponibles
- **Ctrl + Enter**: Ejecutar sin confirmación
- **Esc**: Cancelar operación actual
- **↑/↓**: Navegar historial de comandos

## 🌟 Funciones Beta

### Integración con Voz
```
"Activar comandos por voz"
"Configurar palabra de activación"
"Entrenar mi voz"
```

### IA Predictiva
```
"Modo predictivo activado"
"Sugerir acciones basadas en contexto"
"Aprendizaje automático de patrones"
```

### Multi-Idioma
```
"Change language to English"
"Mudar idioma para português"
"Cambiar a español neutro"
```

## 📚 Recursos Adicionales

- [Guía Básica](./SUPERBOT.md)
- [Configuración Gemini](./GEMINI_SETUP.md)
- [API Reference](./API_REFERENCE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

💡 **Pro Tip**: Combina comandos para flujos de trabajo completos:
```
"Analizar salud del negocio, generar recomendaciones y crear plan de acción para mañana"
```