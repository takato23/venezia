-- Insertar datos de demostración

-- 1. Crear organización de demo
INSERT INTO organizations (id, name, subscription_plan, subscription_status)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Heladería Venezia Demo', 'professional', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Crear sucursales de demo
INSERT INTO branches (id, organization_id, name, code, address, phone, is_main_branch, is_active, coordinates, opening_hours, features)
VALUES 
-- Sucursal Principal
('b1c2d3e4-f5a6-7890-bcde-f12345678901', 
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Sucursal Centro', 
 'SUC001', 
 'Av. Corrientes 1234, CABA', 
 '+54 11 4567-8900',
 true, 
 true,
 '{"lat": -34.603684, "lng": -58.381559}',
 '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "12:00", "close": "22:00"}}',
 '["delivery", "dine_in", "takeaway", "wifi", "parking"]'
),
-- Sucursal Palermo
('b2c3d4e5-f6a7-8901-cdef-234567890123', 
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Sucursal Palermo', 
 'SUC002', 
 'Av. Santa Fe 4567, CABA',
 '+54 11 4567-8901', 
 false, 
 true,
 '{"lat": -34.588171, "lng": -58.426071}',
 '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "12:00", "close": "22:00"}}',
 '["delivery", "takeaway", "wifi", "outdoor"]'
),
-- Sucursal Belgrano
('b3c4d5e6-f7a8-9012-def0-345678901234', 
 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Sucursal Belgrano', 
 'SUC003', 
 'Av. Cabildo 2345, CABA',
 '+54 11 4567-8902', 
 false, 
 true,
 '{"lat": -34.557849, "lng": -58.454371}',
 '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "12:00", "close": "22:00"}}',
 '["dine_in", "takeaway", "accessibility", "parking"]'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Actualizar usuarios existentes con acceso multi-sucursal
UPDATE users 
SET 
    organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    branch_access = ARRAY[
        'b1c2d3e4-f5a6-7890-bcde-f12345678901'::UUID, 
        'b2c3d4e5-f6a7-8901-cdef-234567890123'::UUID,
        'b3c4d5e6-f7a8-9012-def0-345678901234'::UUID
    ],
    role_per_branch = jsonb_build_object(
        'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'admin',
        'b2c3d4e5-f6a7-8901-cdef-234567890123', 'manager',
        'b3c4d5e6-f7a8-9012-def0-345678901234', 'manager'
    )
WHERE role = 'admin' OR email = 'admin@venezia.com';

-- 4. Crear vista para facilitar consultas
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