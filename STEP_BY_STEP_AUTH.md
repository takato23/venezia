# Guía Paso a Paso: Configuración de Autenticación con Supabase

## 🎯 Objetivo
Configurar el sistema de autenticación de Venezia para usar Supabase Auth en lugar del sistema JWT local.

## 📝 Paso 1: Configurar Supabase Auth en el Dashboard

1. **Abre tu proyecto en Supabase**:
   - Ve a: https://supabase.com/dashboard/project/axmknxpmapomyegdaogl

2. **Configura los proveedores de autenticación**:
   - En el menú lateral, click en **Authentication**
   - Luego click en **Providers**
   - Verifica que **Email** esté habilitado (debe estar en verde)

3. **Configura las URLs**:
   - Ve a **Authentication** → **URL Configuration**
   - Configura:
     - **Site URL**: `http://localhost:5173`
     - **Redirect URLs**: Agrega estas URLs:
       ```
       http://localhost:5173
       http://localhost:5173/login
       http://localhost:5173/dashboard
       http://localhost:5173/reset-password
       ```

4. **Desactiva confirmación de email (para desarrollo)**:
   - Ve a **Authentication** → **Settings** → **Auth settings**
   - Desactiva "Enable email confirmations" (para desarrollo)
   - En producción, deberías mantenerlo activado

## 📝 Paso 2: Ejecutar el SQL de configuración

1. **Ve al SQL Editor**:
   - En el menú lateral, click en **SQL Editor**
   - Click en **New query**

2. **Copia y ejecuta el SQL**:
   - Copia TODO el contenido del archivo `backend/database/supabase-auth-setup.sql`
   - Pégalo en el editor
   - Click en **Run** (o Ctrl+Enter)

3. **Verifica que no haya errores**:
   - Deberías ver "Success. No rows returned"
   - Si hay errores, revisa el mensaje y corrige

## 📝 Paso 3: Crear el usuario administrador

1. **Ve a Authentication → Users**:
   - Click en **Add user** → **Create new user**

2. **Crea el usuario admin**:
   - Email: `admin@venezia.com`
   - Password: `admin123`
   - Auto Confirm User: ✅ (marcado)
   - Click en **Create user**

3. **Actualiza el rol del usuario**:
   - Ve al **SQL Editor**
   - Ejecuta este query:
   ```sql
   UPDATE users 
   SET 
     role = 'admin',
     name = 'Administrador',
     permissions = jsonb_build_object(
       'users', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
       'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
       'sales', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
       'cash_flow', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
       'reports', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
     )
   WHERE email = 'admin@venezia.com';
   ```

## 📝 Paso 4: Actualizar el código del frontend

1. **Actualiza el import del auth store**:
   - En `src/App.jsx`, cambia:
   ```javascript
   // Cambiar esta línea:
   import { useAuthStore } from './store/authStore';
   
   // Por esta:
   import { useAuthStore } from './store/authStore.supabase';
   ```

2. **Actualiza el componente Login**:
   - En `src/pages/Login.jsx`, reemplaza todo el archivo con el contenido de `Login.supabase.jsx`
   - O simplemente renombra los archivos:
   ```bash
   mv src/pages/Login.jsx src/pages/Login.old.jsx
   mv src/pages/Login.supabase.jsx src/pages/Login.jsx
   ```

3. **Actualiza otros componentes que usen auth**:
   - Busca todos los archivos que importen `useAuthStore`
   - Actualiza el import para usar la versión de Supabase

## 📝 Paso 5: Probar la autenticación

1. **Reinicia el servidor backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Inicia el frontend**:
   ```bash
   cd ..
   npm run dev
   ```

3. **Prueba el login**:
   - Abre http://localhost:5173
   - Usa las credenciales:
     - Email: `admin@venezia.com`
     - Password: `admin123`

## 🔍 Verificación

Para verificar que todo funciona:

1. **Verifica en Supabase Dashboard**:
   - Ve a **Authentication** → **Users**
   - Deberías ver tu usuario admin
   - El "Last sign in" debería actualizarse cuando inicies sesión

2. **Verifica en la tabla users**:
   - Ve a **Table Editor** → **users**
   - Deberías ver el usuario con rol "admin"

3. **Verifica las políticas RLS**:
   - Ve a **Authentication** → **Policies**
   - Deberías ver todas las políticas creadas

## 🚨 Solución de problemas

### Error: "Invalid login credentials"
- Verifica que el email y contraseña sean correctos
- Asegúrate de que el usuario esté confirmado

### Error: "Email not confirmed"
- Ve a Authentication → Settings
- Desactiva "Enable email confirmations"
- O confirma el email desde el dashboard

### Error: "permission denied for table users"
- Las políticas RLS no están configuradas correctamente
- Vuelve a ejecutar el SQL de configuración

### El usuario no puede ver datos
- Verifica que el usuario tenga el rol correcto en la tabla users
- Revisa las políticas RLS

## ✅ ¡Listo!

Si todo salió bien, ahora tienes:
- ✅ Autenticación con Supabase funcionando
- ✅ Usuario admin creado
- ✅ Políticas de seguridad configuradas
- ✅ Login integrado con el frontend

## 🎯 Próximos pasos
1. Crear más usuarios con diferentes roles
2. Personalizar las plantillas de email
3. Agregar autenticación con Google/GitHub
4. Implementar recuperación de contraseña