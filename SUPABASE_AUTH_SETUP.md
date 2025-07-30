# Configuración de Autenticación con Supabase

## Paso 1: Configurar Auth en el Dashboard de Supabase

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard/project/axmknxpmapomyegdaogl/auth/users

2. En el menú lateral, ve a **Authentication** → **Providers**

3. Asegúrate de que **Email** esté habilitado (debe estar por defecto)

4. En **Authentication** → **Settings**:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: 
     - `http://localhost:5173`
     - `http://localhost:5173/login`
     - `http://localhost:5173/reset-password`

5. En **Email Templates**, puedes personalizar:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

## Paso 2: Crear tabla de usuarios extendida

Como Supabase Auth maneja la autenticación básica, necesitamos una tabla para datos adicionales del usuario.

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## Paso 3: Configurar políticas RLS básicas

```sql
-- Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Política: Los admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Los admins pueden actualizar todos los usuarios
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Paso 4: Crear usuario administrador por defecto

```sql
-- Primero crea un usuario admin desde el dashboard de Auth
-- Luego actualiza su rol:
UPDATE users 
SET role = 'admin', 
    permissions = '{"all": true}'::jsonb
WHERE email = 'admin@venezia.com';
```

## Notas importantes:

1. **Confirmación de email**: Por defecto, Supabase requiere confirmación por email. Puedes deshabilitarlo en desarrollo en Auth → Settings → Email Auth → Enable email confirmations

2. **Roles disponibles**:
   - `admin`: Acceso total
   - `manager`: Acceso a gestión
   - `employee`: Acceso básico

3. **Seguridad**: Nunca expongas tu `service_role` key en el frontend