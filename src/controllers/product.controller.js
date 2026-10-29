const { pool } = require('../config/db');

/**
 * Mengambil Ringkasan Statistik Inventaris (Dashboard Metrics)
 * GET /api/products/stats
 */
async function getStats(req, res) {
  try {
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_items,
        COALESCE(SUM(stock), 0) AS total_units,
        COALESCE(SUM(stock * purchase_price), 0) AS total_asset_value,
        COALESCE(SUM(stock * selling_price), 0) AS total_potential_sales,
        COALESCE(SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count,
        COALESCE(SUM(CASE WHEN stock > 0 AND stock <= min_stock THEN 1 ELSE 0 END), 0) AS low_stock_count,
        COALESCE(SUM(CASE WHEN stock > min_stock THEN 1 ELSE 0 END), 0) AS safe_stock_count
      FROM products
    `);

    const [categoryRows] = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY count DESC
    `);

    return res.status(200).json({
      success: true,
      data: {
        summary: summaryRows[0],
        categories: categoryRows
      }
    });
  } catch (error) {
    console.error('[PRODUCT STATS ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat ringkasan statistik inventaris.'
    });
  }
}

/**
 * Mengambil Daftar Produk dengan Search, Filter, Sort & Pagination
 * GET /api/products
 */
async function getAll(req, res) {
  try {
    const {
      search = '',
      category = '',
      stock_status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Filter kondisi dinamis
    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (category.trim()) {
      conditions.push('p.category = ?');
      params.push(category.trim());
    }

    if (stock_status === 'out_of_stock') {
      conditions.push('p.stock = 0');
    } else if (stock_status === 'low_stock') {
      conditions.push('p.stock > 0 AND p.stock <= p.min_stock');
    } else if (stock_status === 'in_stock') {
      conditions.push('p.stock > p.min_stock');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validasi Kolom Sort untuk menghindari SQL Injection
    const validSortColumns = {
      name: 'p.name',
      sku: 'p.sku',
      category: 'p.category',
      stock: 'p.stock',
      purchase_price: 'p.purchase_price',
      selling_price: 'p.selling_price',
      created_at: 'p.created_at'
    };

    const sortColumn = validSortColumns[sortBy] || 'p.created_at';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1. Hitung total baris yang cocok
    const countSql = `SELECT COUNT(*) AS total FROM products p ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const totalRecords = countRows[0].total;
    const totalPages = Math.ceil(totalRecords / limitNum);

    // 2. Ambil data halaman aktif beserta nama pengguna pembuat
    const dataSql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.purchase_price,
        p.selling_price,
        p.stock,
        p.min_stock,
        p.unit,
        p.description,
        p.created_at,
        p.updated_at,
        u.full_name AS created_by_name,
        CASE
          WHEN p.stock = 0 THEN 'out_of_stock'
          WHEN p.stock <= p.min_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${direction}
      LIMIT ? OFFSET ?
    `;

    const [products] = await pool.query(dataSql, [...params, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('[PRODUCT GET_ALL ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar produk inventaris.'
    });
  }
}

/**
 * Mengambil Satu Produk Berdasarkan ID
 * GET /api/products/:id
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        p.*,
        u.full_name AS created_by_name,
        CASE
          WHEN p.stock = 0 THEN 'out_of_stock'
          WHEN p.stock <= p.min_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('[PRODUCT GET_BY_ID ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat rincian produk.'
    });
  }
}

/**
 * Menambahkan Produk Baru
 * POST /api/products
 */
async function create(req, res) {
  try {
    let {
      sku,
      name,
      category,
      purchase_price = 0,
      selling_price = 0,
      stock = 0,
      min_stock = 5,
      unit = 'pcs',
      description = ''
    } = req.body;

    // Validasi field wajib
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Kategori produk wajib diisi.' });
    }

    // Auto-generate SKU bila dikosongkan
    if (!sku || !sku.trim()) {
      const prefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      sku = `${prefix}-${Date.now().toString().slice(-4)}-${randomNum}`;
    } else {
      sku = sku.trim().toUpperCase();
    }

    // Cek duplikasi SKU
    const [existing] = await pool.query('SELECT id FROM products WHERE sku = ? LIMIT 1', [sku]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `SKU '${sku}' sudah digunakan oleh produk lain. Gunakan kode SKU yang unik.`
      });
    }

    const createdBy = req.user ? req.user.id : null;

    const [result] = await pool.query(`
      INSERT INTO products 
      (sku, name, category, purchase_price, selling_price, stock, min_stock, unit, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sku,
      name.trim(),
      category.trim(),
      parseFloat(purchase_price) || 0,
      parseFloat(selling_price) || 0,
      parseInt(stock, 10) || 0,
      parseInt(min_stock, 10) || 5,
      (unit || 'pcs').trim().toLowerCase(),
      description ? description.trim() : null,
      createdBy
    ]);

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Produk baru berhasil ditambahkan ke inventaris.',
      data: newProduct[0]
    });
  } catch (error) {
    console.error('[PRODUCT CREATE ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk baru ke database.'
    });
  }
}

/**
 * Mengubah / Memperbarui Data Produk
 * PUT /api/products/:id
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    let {
      sku,
      name,
      category,
      purchase_price,
      selling_price,
      stock,
      min_stock,
      unit,
      description
    } = req.body;

    // Periksa keberadaan produk
    const [existingRows] = await pool.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk yang ingin diubah tidak ditemukan.'
      });
    }

    const current = existingRows[0];

    // Validasi field wajib
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk tidak boleh kosong.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Kategori produk tidak boleh kosong.' });
    }

    const updatedSku = (sku && sku.trim()) ? sku.trim().toUpperCase() : current.sku;

    // Periksa apakah SKU baru bentrok dengan produk lain
    if (updatedSku !== current.sku) {
      const [duplicate] = await pool.query('SELECT id FROM products WHERE sku = ? AND id != ? LIMIT 1', [updatedSku, id]);
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: `SKU '${updatedSku}' sudah digunakan oleh produk lain.`
        });
      }
    }

    await pool.query(`
      UPDATE products SET
        sku = ?,
        name = ?,
        category = ?,
        purchase_price = ?,
        selling_price = ?,
        stock = ?,
        min_stock = ?,
        unit = ?,
        description = ?
      WHERE id = ?
    `, [
      updatedSku,
      name.trim(),
      category.trim(),
      purchase_price !== undefined ? parseFloat(purchase_price) : current.purchase_price,
      selling_price !== undefined ? parseFloat(selling_price) : current.selling_price,
      stock !== undefined ? parseInt(stock, 10) : current.stock,
      min_stock !== undefined ? parseInt(min_stock, 10) : current.min_stock,
      (unit ? unit.trim().toLowerCase() : current.unit),
      description !== undefined ? description.trim() : current.description,
      id
    ]);

    const [updatedRow] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Data produk berhasil diperbarui.',
      data: updatedRow[0]
    });
  } catch (error) {
    console.error('[PRODUCT UPDATE ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data produk.'
    });
  }
}

/**
 * Menghapus Data Produk
 * DELETE /api/products/:id
 */
async function remove(req, res) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, name, sku FROM products WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan atau telah dihapus sebelumnya.'
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Produk '${existing[0].name}' (${existing[0].sku}) berhasil dihapus.`
    });
  } catch (error) {
    console.error('[PRODUCT DELETE ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk.'
    });
  }
}

module.exports = {
  getStats,
  getAll,
  getById,
  create,
  update,
  remove
};
