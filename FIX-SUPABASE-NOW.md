# 🚨 PASOS URGENTES PARA ARREGLAR SUPABASE

## El Problema
Tu proyecto de Supabase estaba suspendido y cuando lo reactivaste, la aplicación intenta leer tablas que no existen, causando errores 406.

## Solución Rápida (3 minutos)

### 1. Ve a Supabase SQL Editor
1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral

### 2. Ejecuta este SQL
Copia y pega TODO este código en el editor SQL:

```sql
-- ==============================================
-- SCHEMA DE AUTENTICACIÓN Y USUARIOS PARA SUPABASE
-- ==============================================

-- Crear tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'heladeria',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de usuarios extendida
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'vendedor',
  organization_id UUID REFERENCES organizations(id),
  branch_access JSONB DEFAULT '[]',
  role_per_branch JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by their members"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.organization_id = organizations.id
      AND users.id = auth.uid()
    )
  );

-- RLS Policies para users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Función para crear usuario después del signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insertar organización por defecto
INSERT INTO organizations (id, name, type)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Venezia Ice Cream', 'heladeria')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

### 3. Ejecuta el SQL
1. Click en **RUN** o presiona `Cmd/Ctrl + Enter`
2. Deberías ver "Success. No rows returned"

### 4. Reinicia el Backend
En tu terminal donde corre el backend:
```bash
# Presiona Ctrl+C para detenerlo
# Luego ejecuta nuevamente:
cd backend && npm start
```

### 5. Recarga la Aplicación
1. Recarga la página en el navegador (Cmd/Ctrl + R)
2. El login debería funcionar sin errores 406
3. El chat del bot debería conectarse correctamente

## ¿Sigues teniendo problemas?

Si aún ves errores 406, es porque hay más tablas faltantes. En ese caso, ejecuta también estos archivos SQL en Supabase:

1. `backend/database/supabase-schema.sql` - Tablas principales
2. `backend/database/supabase-inventory-schema.sql` - Tablas de inventario
3. `backend/database/supabase-notifications-schema.sql` - Tablas de notificaciones

## ¡Listo! 🎉

Tu aplicación debería funcionar perfectamente ahora. El SuperBot con Gemini API está listo para usar.

### Comandos de prueba para el bot:
- "¿Cuánto chocolate nos queda?"
- "Agregar 10 kg de vainilla al inventario"
- "¿Cuánto vendimos hoy?"
- "¿Qué productos tienen poco stock?"