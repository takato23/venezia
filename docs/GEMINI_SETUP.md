# Configuración de Gemini API para SuperBot Venezia

## 🔑 Obtener tu API Key de Gemini

1. **Visita Google AI Studio**
   - Ve a: https://makersuite.google.com/app/apikey
   - Inicia sesión con tu cuenta de Google

2. **Crear una nueva API Key**
   - Click en "Create API key"
   - Selecciona tu proyecto o crea uno nuevo
   - Copia la API key generada

## 🛠️ Configurar en Venezia

### Método 1: Variables de Entorno (Recomendado)

1. **Edita el archivo `.env`** en la raíz del proyecto:
```env
# Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=tu_api_key_aqui
```

2. **Reinicia el servidor** de desarrollo:
```bash
npm run kill:all
npm run dev
```

### Método 2: Configuración Manual (UI)

1. Abre la aplicación Venezia
2. Ve a **Configuración** → **AI** → **Gemini API Key**
3. Pega tu API key
4. Click en **Guardar**

### Método 3: localStorage (Desarrollo)

En la consola del navegador:
```javascript
localStorage.setItem('gemini-api-key', 'tu_api_key_aqui');
location.reload();
```

## ✅ Verificar Configuración

### Indicador Visual

En el chat, verás:
- 🟢 **"Usando: Gemini AI"** - API key configurada correctamente
- 🔴 **"Usando: Mock AI"** - No hay API key o hay un error

### Verificar en Consola

Abre la consola del navegador (F12) y busca:
```
🔑 API Key encontrada en process.env
✅ Gemini disponible: true
🎉 Usando Gemini AI para respuesta inteligente
```

### Estado del Servicio

Click en el indicador de AI en el chat para ver:
- Estado de Gemini: ✅ Disponible
- Requests restantes: 1490/1500
- Origen de API Key: Configurado

## 📊 Límites y Uso

### Límites Gratuitos de Gemini
- **Requests por día**: 1,500
- **Tokens por request**: 32,768
- **Renovación**: Cada 24 horas (medianoche PST)

### Optimización de Uso
- **Caché automático**: Reduce ~60% de requests repetidos
- **Respuestas inteligentes**: Solo usa Gemini cuando es necesario
- **Fallback a SuperBot**: Para comandos simples no usa API

## 🚨 Solución de Problemas

### "API Key no detectada"

1. **Verifica el nombre exacto** en `.env`:
   ```env
   REACT_APP_GEMINI_API_KEY=AIza...
   ```

2. **Asegúrate de reiniciar** el servidor después de cambiar `.env`

3. **Revisa la consola** para mensajes de error

### "Error 401: Unauthorized"

- API key inválida o expirada
- Verifica que copiaste la key completa
- Genera una nueva key en Google AI Studio

### "Error 429: Too Many Requests"

- Límite diario alcanzado (1,500 requests)
- Espera hasta medianoche PST para renovación
- El sistema usará Mock AI automáticamente

### "Gemini no disponible"

Posibles causas:
- Sin conexión a internet
- API key incorrecta
- Servicio de Google temporalmente caído

## 🎯 Mejores Prácticas

1. **Guarda tu API Key de forma segura**
   - No la compartas públicamente
   - No la subas a GitHub
   - Usa `.env` para desarrollo

2. **Monitorea tu uso**
   - Revisa el contador de requests
   - El indicador cambia de color según uso

3. **Aprovecha el caché**
   - Consultas repetidas no gastan requests
   - El caché dura 1 hora

4. **Usa comandos eficientes**
   - Sé específico para mejores respuestas
   - Evita consultas muy generales

## 📞 Soporte

Si necesitas ayuda:
- Email: soporte@veneziaicecream.com
- Documentación: `/docs/SUPERBOT.md`
- Consola del navegador para debugging