const jwt = require('jsonwebtoken');

/**
 * Middleware Autentikasi JWT
 * Memverifikasi header 'Authorization: Bearer <token>'
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login kembali.'
    });
  }

  const secret = process.env.JWT_SECRET || 'invenkraft_super_secret_jwt_key_2026_production_grade';

  jwt.verify(token, secret, (err, decodedUser) => {
    if (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(403).json({
        success: false,
        message: isExpired
          ? 'Sesi login telah kedaluwarsa. Silakan login ulang.'
          : 'Token autentikasi tidak valid atau telah rusak.'
      });
    }

    // Pasang payload data user ke object request
    req.user = decodedUser;
    next();
  });
}

/**
 * Middleware Opsional: Cek role khusus (contoh: admin only)
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses terbatas: Tindakan ini memerlukan hak akses Administrator.'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};
