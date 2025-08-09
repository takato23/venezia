const { runAsync, getAsync, allAsync } = require('../database/db');
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth');
const config = require('../config/environment');
const crypto = require('crypto');

module.exports = (app) => {
  // Asegurar tabla mínima si no existe (pequeño guard para dev)
  runAsync(`CREATE TABLE IF NOT EXISTS admin_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'event',
    status TEXT DEFAULT 'active',
    store_id INTEGER,
    capacity INTEGER,
    max_uses INTEGER DEFAULT 1,
    uses INTEGER DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
  )`).catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_code ON admin_codes(code)').catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_status ON admin_codes(status)').catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_expires ON admin_codes(expires_at)').catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_store_code ON admin_codes(store_id, code)').catch(()=>{});

  // Asegurar columnas de descuento si no existen
  (async () => {
    try {
      const cols = await allAsync("PRAGMA table_info('admin_codes')");
      const hasDiscountType = cols.some(c => c.name === 'discount_type');
      const hasDiscountValue = cols.some(c => c.name === 'discount_value');
      if (!hasDiscountType) {
        await runAsync("ALTER TABLE admin_codes ADD COLUMN discount_type TEXT NULL CHECK(discount_type IN ('percent','amount'))");
      }
      if (!hasDiscountValue) {
        await runAsync("ALTER TABLE admin_codes ADD COLUMN discount_value REAL NULL CHECK(discount_value >= 0)");
      }
    } catch (e) {
      // Ignorar errores de migración si columnas ya existen
    }
  })();

  // Asegurar tabla de usos
  runAsync(`CREATE TABLE IF NOT EXISTS admin_codes_uses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_id INTEGER NOT NULL,
    sale_id INTEGER NOT NULL,
    user_id INTEGER NULL,
    store_id INTEGER NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code_id, sale_id)
  )`).catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_uses_code ON admin_codes_uses(code_id)').catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_uses_sale ON admin_codes_uses(sale_id)').catch(()=>{});
  runAsync('CREATE INDEX IF NOT EXISTS idx_admin_codes_uses_store_code ON admin_codes_uses(store_id, code_id)').catch(()=>{});

  const enforceAdmin = (req, res, next) => {
    if (!config.ENABLE_AUTH) return next();
    return requireRole(['admin'])(req, res, next);
  };

  const withAuthIfEnabled = [optionalAuth, enforceAdmin];

  // Utils
  const nowUtcIso = () => new Date().toISOString();
  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };
  const genCode = () => crypto.randomBytes(6).toString('base64url');

  // GET list with pagination/filters
  app.get('/api/admin/admin_codes', withAuthIfEnabled, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 100);
      const search = (req.query.search || '').trim();
      const status = (req.query.status || '').trim();
      const storeId = (req.query.store_id || '').toString().trim();

      const where = [];
      const params = [];
      if (search) { where.push('code LIKE ?'); params.push(`%${search}%`); }
      if (status) { where.push('status = ?'); params.push(status); }
      if (storeId) { where.push('store_id = ?'); params.push(storeId); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const totalRow = await getAsync(`SELECT COUNT(*) as c FROM admin_codes ${whereSql}`, params);
      const total = totalRow ? totalRow.c : 0;

      const rows = await allAsync(
        `SELECT * FROM admin_codes ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, (page - 1) * pageSize]
      );

      const items = (rows || []).map(r => ({
        ...r,
        is_expired: isExpired(r.expires_at)
      }));

      return res.json({ success: true, data: { items, total, page, pageSize }, error: null });
    } catch (error) {
      console.error('List admin_codes error:', error);
      return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', msg: 'Error al listar códigos' } });
    }
  });

  // POST create
  app.post('/api/admin/admin_codes', withAuthIfEnabled, async (req, res) => {
    try {
      const { code, type, status, store_id, capacity, max_uses, expires_at, discount_type, discount_value } = req.body || {};
      const finalCode = code && String(code).trim().length > 0 ? String(code).trim() : genCode();
      const finalMaxUses = Number(max_uses || 1);
      if (!finalMaxUses || finalMaxUses < 1) {
        return res.status(400).json({ success: false, data: null, error: { code: 'INVALID', msg: 'max_uses debe ser >= 1' } });
      }
      const now = nowUtcIso();
      await runAsync(
        `INSERT INTO admin_codes (code, type, status, store_id, capacity, max_uses, uses, expires_at, discount_type, discount_value, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [finalCode, type || 'event', status || 'active', store_id || null, capacity || null, finalMaxUses, expires_at || null, discount_type || null, (discount_value ?? null), now, now]
      );
      const row = await getAsync('SELECT * FROM admin_codes WHERE code = ?', [finalCode]);
      return res.status(201).json({ success: true, data: row, error: null });
    } catch (error) {
      console.error('Create admin_code error:', error);
      return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', msg: 'Error al crear código' } });
    }
  });

  // PATCH disable
  app.patch('/api/admin/admin_codes/:id', withAuthIfEnabled, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body || {};
      if (!id || !status) {
        return res.status(400).json({ success: false, data: null, error: { code: 'INVALID', msg: 'Parámetros inválidos' } });
      }
      const now = nowUtcIso();
      await runAsync('UPDATE admin_codes SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
      const row = await getAsync('SELECT * FROM admin_codes WHERE id = ?', [id]);
      return res.json({ success: true, data: row, error: null });
    } catch (error) {
      console.error('Disable admin_code error:', error);
      return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', msg: 'Error al actualizar código' } });
    }
  });

  // POST validate (permitir admin y manager; opcional auth en dev)
  app.post('/api/admin/admin_codes/validate', optionalAuth, async (req, res) => {
    try {
      if (config.ENABLE_AUTH) {
        const role = req.user?.role;
        if (!role || !['admin', 'manager'].includes(role)) {
          return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', msg: 'No autorizado' } });
        }
      }
      const codeStr = String(req.body?.code || '').trim();
      const storeId = req.body?.store_id || req.user?.store_id || null;
      if (!codeStr) {
        return res.status(400).json({ success: false, data: null, error: { code: 'INVALID', msg: 'Código requerido' } });
      }
      const row = await getAsync('SELECT * FROM admin_codes WHERE code = ?', [codeStr]);
      if (!row) {
        return res.status(400).json({ success: false, data: null, error: { code: 'INVALID', msg: 'Código inválido' } });
      }
      if (row.status !== 'active') {
        return res.status(400).json({ success: false, data: null, error: { code: 'DISABLED', msg: 'Código deshabilitado' } });
      }
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        return res.status(400).json({ success: false, data: null, error: { code: 'EXPIRED', msg: 'Código expirado' } });
      }
      if (row.max_uses !== null && typeof row.max_uses !== 'undefined' && row.uses >= row.max_uses) {
        return res.status(400).json({ success: false, data: null, error: { code: 'CAPACITY_REACHED', msg: 'Límite de usos alcanzado' } });
      }
      if (row.store_id && storeId && Number(row.store_id) !== Number(storeId)) {
        return res.status(400).json({ success: false, data: null, error: { code: 'STORE_MISMATCH', msg: 'Código no aplicable a esta tienda' } });
      }
      return res.json({ success: true, data: {
        code: row.code,
        type: row.type,
        discount_type: row.discount_type || null,
        discount_value: row.discount_value || null,
        status: row.status,
        expires_at: row.expires_at,
        store_id: row.store_id ?? null
      }, error: null });
    } catch (error) {
      console.error('Validate admin_code error:', error);
      return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', msg: 'Error al validar código' } });
    }
  });
};


