-- Actualizar la tabla de usuarios existente para agregar campos multi-sucursal
-- NOTA: Si la tabla users no existe, primero créala con tu esquema base

-- Agregar columnas para multi-sucursal si no existen
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS branch_access UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS role_per_branch JSONB DEFAULT '{}';