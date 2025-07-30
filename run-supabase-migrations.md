# 🚀 INSTRUCCIONES PARA CONFIGURAR SUPABASE

## 1. **Ejecutar el Schema de Autenticación**

Ve a tu proyecto de Supabase y ejecuta este SQL en el editor SQL:

```bash
cat backend/database/supabase-auth-schema.sql
```

Copia todo el contenido y pégalo en el editor SQL de Supabase, luego ejecuta.

## 2. **Reiniciar el Backend**

En la terminal donde está corriendo el backend:
1. Presiona `Ctrl+C` para detenerlo
2. Ejecuta nuevamente:
   ```bash
   cd backend && npm start
   ```

## 3. **Verificar que funciona**

1. Recarga la página de la aplicación
2. Intenta hacer login
3. Abre el chat del bot
4. Prueba comandos como:
   - "¿Cuánto chocolate queda?"
   - "Agregar 10 kg de vainilla"
   - "¿Cuánto vendimos hoy?"

## 4. **Si sigues teniendo errores 406**

Significa que necesitas crear más tablas. Ejecuta también:
- `backend/database/supabase-schema.sql`
- `backend/database/supabase-inventory-schema.sql`
- `backend/database/supabase-notifications-schema.sql`

¡El SuperBot debería funcionar perfectamente ahora! 🤖🍦