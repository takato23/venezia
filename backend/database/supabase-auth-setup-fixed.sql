-- ====================================
-- CONFIGURACIÓN DE AUTENTICACIÓN (VERSIÓN CORREGIDA)
-- ====================================

-- 1. Primero, eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Allow authenticated read access" ON users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON stores;
DROP POLICY IF EXISTS "Allow authenticated read access" ON customers;
DROP POLICY IF EXISTS "Allow authenticated read access" ON products;
DROP POLICY IF EXISTS "Users can read own sales" ON sales;
DROP POLICY IF EXISTS "Admins can read all sales" ON sales;

-- Eliminar cualquier otra política que pueda existir
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. Verificar si la columna id de users ya es UUID
DO $$
BEGIN
    -- Solo intentar cambiar el tipo si no es UUID
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id') != 'uuid' THEN
        ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
    END IF;
END $$;

-- 3. Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, permissions)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE(new.raw_user_meta_data->'permissions', '{}')::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Habilitar RLS en todas las tablas importantes
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- ====================================
-- POLÍTICAS RLS PARA USERS
-- ====================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Los admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los admins pueden actualizar todos los usuarios
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ====================================
-- POLÍTICAS RLS PARA CUSTOMERS
-- ====================================

-- Todos los usuarios autenticados pueden ver clientes
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Empleados y superiores pueden crear/editar clientes
CREATE POLICY "Employees can manage customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('employee', 'manager', 'admin')
    )
  );

-- ====================================
-- POLÍTICAS RLS PARA PRODUCTS Y CATEGORIES
-- ====================================

-- Todos pueden ver productos activos
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (active = true);

-- Solo managers y admins pueden gestionar productos
CREATE POLICY "Managers can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Todos pueden ver categorías
CREATE POLICY "Anyone can view categories" ON product_categories
  FOR SELECT USING (true);

-- Solo admins pueden gestionar categorías
CREATE POLICY "Admins can manage categories" ON product_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ====================================
-- POLÍTICAS RLS PARA SALES
-- ====================================

-- Los usuarios pueden ver sus propias ventas
CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (user_id = auth.uid());

-- Managers y admins pueden ver todas las ventas
CREATE POLICY "Managers can view all sales" ON sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Empleados pueden crear ventas
CREATE POLICY "Employees can create sales" ON sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('employee', 'manager', 'admin')
    )
  );

-- ====================================
-- POLÍTICAS RLS PARA CASH_FLOW
-- ====================================

-- Solo managers y admins pueden ver flujo de caja
CREATE POLICY "Managers can view cash flow" ON cash_flow
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Solo managers y admins pueden gestionar caja
CREATE POLICY "Managers can manage cash flow" ON cash_flow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- ====================================
-- POLÍTICAS RLS PARA STORES
-- ====================================

-- Todos los usuarios autenticados pueden ver tiendas
CREATE POLICY "Authenticated can view stores" ON stores
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo admins pueden gestionar tiendas
CREATE POLICY "Admins can manage stores" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ====================================
-- FUNCIONES ÚTILES
-- ====================================

-- Función para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario actual es manager o superior
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('manager', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- CREAR USUARIO ADMIN POR DEFECTO
-- ====================================

-- NOTA: Primero crea el usuario desde el dashboard de Supabase
-- Luego ejecuta este UPDATE para darle rol de admin

/*
-- Para ejecutar después de crear el usuario en el dashboard:

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
*/