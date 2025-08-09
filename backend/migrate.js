#!/usr/bin/env node
/*
  Runner de migraciones locales (SQLite)
  - Aplica backend/sql/003_admin_codes_discount.sql
  - Aplica backend/sql/004_admin_codes_uses.sql
  Idempotente: ignora errores de columnas ya existentes/índices y continúa.
*/

const fs = require('fs');
const path = require('path');
const { runAsync, allAsync } = require('./database/db');

const sqlDir = path.join(__dirname, 'sql');

async function apply003() {
  // Verificar columnas antes de ALTER TABLE para evitar errores
  const cols = await allAsync("PRAGMA table_info('admin_codes')");
  const hasDiscountType = cols.some((c) => c.name === 'discount_type');
  const hasDiscountValue = cols.some((c) => c.name === 'discount_value');

  const statements = [];
  if (!hasDiscountType) {
    statements.push(
      "ALTER TABLE admin_codes ADD COLUMN discount_type TEXT NULL CHECK(discount_type IN ('percent','amount'))"
    );
  }
  if (!hasDiscountValue) {
    statements.push(
      'ALTER TABLE admin_codes ADD COLUMN discount_value REAL NULL CHECK(discount_value >= 0)'
    );
  }

  if (statements.length === 0) {
    console.log('✔ 003_admin_codes_discount ya aplicado');
    return;
  }

  console.log('▶ Aplicando 003_admin_codes_discount.sql ...');
  for (const sql of statements) {
    try {
      await runAsync(sql);
    } catch (e) {
      console.warn('⚠️  003 aviso:', e.message);
    }
  }
  console.log('✔ 003_admin_codes_discount aplicado');
}

async function apply004() {
  console.log('▶ Aplicando 004_admin_codes_uses.sql ...');
  const filePath = path.join(sqlDir, '004_admin_codes_uses.sql');
  const raw = fs.readFileSync(filePath, 'utf8');
  // Separar por ';' respetando líneas en blanco simples
  const statements = raw
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await runAsync(stmt);
    } catch (e) {
      // Índices/tabla ya creados
      console.warn('⚠️  004 aviso:', e.message);
    }
  }
  console.log('✔ 004_admin_codes_uses aplicado');
}

async function main() {
  try {
    // Validar existencia de carpeta SQL
    if (!fs.existsSync(sqlDir)) {
      console.error('❌ Carpeta SQL no encontrada:', sqlDir);
      process.exit(1);
    }

    await apply003();
    await apply004();
    // 005 seed products
    try {
      console.log('▶ Aplicando 005_seed_products.sql ...');
      const filePath = path.join(sqlDir, '005_seed_products.sql');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const statements = raw
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const stmt of statements) {
          try { await runAsync(stmt); } catch (e) { console.warn('⚠️  005 aviso:', e.message); }
        }
        console.log('✔ 005_seed_products aplicado');
      } else {
        console.log('ℹ️  005_seed_products.sql no encontrado, saltando');
      }
    } catch (e) {
      console.warn('⚠️  Error al aplicar 005_seed_products:', e.message);
    }

    console.log('🎉 Migraciones completadas');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al ejecutar migraciones:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}


