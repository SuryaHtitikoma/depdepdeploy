const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Controller untuk Login Pengguna
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    // Cari user berdasarkan username atau email
    const [rows] = await pool.query(
      'SELECT id, username, email, password, full_name, role FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi username atau password tidak cocok.'
      });
    }

    const user = rows[0];

    // Bandingkan password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi username atau password tidak cocok.'
      });
    }

    // Buat JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'invenkraft_super_secret_jwt_key_2026_production_grade';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil. Selamat datang kembali!',
      data: {
        token,
        user: payload
      }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Terjadi kegagalan login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat memproses login.'
    });
  }
}

/**
 * Controller untuk Registrasi Akun Baru (Staff/Admin)
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Semua field (username, email, password, full_name) wajib diisi.'
      });
    }

    // Periksa apakah username atau email sudah terdaftar
    const [existing] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim()]
    );

    if (existing.length > 0) {
      const isUsernameTaken = existing[0].username.toLowerCase() === username.trim().toLowerCase();
      return res.status(409).json({
        success: false,
        message: isUsernameTaken
          ? 'Username sudah digunakan, silakan pilih yang lain.'
          : 'Alamat email sudah terdaftar di sistem.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const assignedRole = role === 'admin' ? 'admin' : 'staff';

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), hashedPassword, full_name.trim(), assignedRole]
    );

    return res.status(201).json({
      success: true,
      message: 'Akun berhasil didaftarkan.',
      data: {
        id: result.insertId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        role: assignedRole
      }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Terjadi kegagalan registrasi:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mendaftarkan akun.'
    });
  }
}

/**
 * Controller untuk Mengecek Profil Pengguna Aktif
 * GET /api/auth/me
 */
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan dalam sistem.'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('[AUTH ERROR] Gagal mengambil profil user:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil pengguna.'
    });
  }
}

module.exports = {
  login,
  register,
  getProfile
};
