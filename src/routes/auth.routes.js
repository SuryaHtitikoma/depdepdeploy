const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/login - Masuk ke sistem
router.post('/login', authController.login);

// POST /api/auth/register - Registrasi akun baru
router.post('/register', authController.register);

// GET /api/auth/me - Cek profil pengguna yang sedang login (Protected)
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
