const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticateToken } = require('../middleware/auth');

// Seluruh route produk dilindungi oleh autentikasi JWT
router.use(authenticateToken);

// GET /api/products/stats - Ringkasan statistik inventaris
router.get('/stats', productController.getStats);

// GET /api/products - Ambil daftar produk (dengan search, filter, pagination)
router.get('/', productController.getAll);

// GET /api/products/:id - Ambil satu produk berdasarkan ID
router.get('/:id', productController.getById);

// POST /api/products - Tambah produk baru
router.post('/', productController.create);

// PUT /api/products/:id - Perbarui data produk
router.put('/:id', productController.update);

// DELETE /api/products/:id - Hapus produk
router.delete('/:id', productController.remove);

module.exports = router;
