const express = require('express');
const router = express.Router();
const { allAsync, getAsync } = require('../database/db');

// GET /api/products?search=&page=&pageSize=
router.get('/', async (req, res) => {
  try {
    const rawPage = parseInt(req.query.page || '1', 10);
    const rawPageSize = parseInt(req.query.pageSize || '20', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, 100) : 20;
    const search = String(req.query.search || '').trim();

    const where = [];
    const params = [];
    if (search) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await getAsync(`SELECT COUNT(*) as c FROM products ${whereSql}`, params);
    const total = totalRow ? totalRow.c : 0;

    const items = await allAsync(
      `SELECT id, name, description, price, current_stock, category_id, active
       FROM products
       ${whereSql}
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return res.json({ success: true, data: { items, total, page, pageSize } });
  } catch (error) {
    console.error('Error fetching products list:', error);
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', msg: 'Error al listar productos' } });
  }
});

module.exports = router;


