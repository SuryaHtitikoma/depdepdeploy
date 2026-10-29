const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Muat variabel environment
dotenv.config();

// Buat Connection Pool untuk efisiensi koneksi MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'invenkraft_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper untuk verifikasi koneksi saat server mulai
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Terhubung ke MySQL database: ${process.env.DB_NAME || 'invenkraft_db'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB ERROR] Gagal terhubung ke MySQL database:');
    console.error(`- Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.error(`- Database: ${process.env.DB_NAME || 'invenkraft_db'}`);
    console.error(`- Pesan: ${error.message}`);
    console.error('Pastikan layanan MySQL (XAMPP/Laragon) aktif dan database telah diimpor dari file database/schema.sql');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
