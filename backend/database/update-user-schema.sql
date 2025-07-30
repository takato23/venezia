-- Actualizar el esquema de usuarios para multi-sucursal

-- Agregar columnas para multi-sucursal si no existen
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS branch_access UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS role_per_branch JSONB DEFAULT '{}';

-- Crear un usuario de prueba con acceso a múltiples sucursales
-- Solo ejecutar esto si no existe el usuario
DO $$
BEGIN
    -- Verificar si existe la organización
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') THEN
        INSERT INTO organizations (id, name, subscription_plan) 
        VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Heladería Demo', 'professional');
    END IF;
    
    -- Verificar si existen las sucursales
    IF NOT EXISTS (SELECT 1 FROM branches WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') THEN
        -- Crear sucursal principal
        INSERT INTO branches (id, organization_id, name, code, address, is_main_branch, is_active)
        VALUES 
        ('b1c2d3e4-f5a6-7890-bcde-f12345678901', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
         'Sucursal Centro', 'SUC001', 'Av. Corrientes 1234, CABA', true, true);
        
        -- Crear sucursal secundaria
        INSERT INTO branches (id, organization_id, name, code, address, is_main_branch, is_active)
        VALUES 
        ('b2c3d4e5-f6a7-8901-cdef-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
         'Sucursal Palermo', 'SUC002', 'Av. Santa Fe 4567, CABA', false, true);
    END IF;
    
    -- Actualizar usuarios existentes con acceso a sucursales
    UPDATE users 
    SET 
        organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        branch_access = ARRAY['b1c2d3e4-f5a6-7890-bcde-f12345678901', 'b2c3d4e5-f6a7-8901-cdef-234567890123']::UUID[],
        role_per_branch = '{"b1c2d3e4-f5a6-7890-bcde-f12345678901": "admin", "b2c3d4e5-f6a7-8901-cdef-234567890123": "manager"}'::JSONB
    WHERE email = 'admin@venezia.com' OR role = 'admin';
    
END $$;

-- Crear vista para facilitar consultas de usuarios con sucursales
CREATE OR REPLACE VIEW user_branch_access AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role as global_role,
    u.organization_id,
    o.name as organization_name,
    b.id as branch_id,
    b.name as branch_name,
    b.code as branch_code,
    COALESCE(u.role_per_branch->>(b.id::text), u.role) as branch_role
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN branches b ON b.organization_id = u.organization_id AND b.id = ANY(u.branch_access)
WHERE b.is_active = true;