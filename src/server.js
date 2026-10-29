const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection } = require('./config/db');

// Muat environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Melayani file frontend statis dari folder 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routing API
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Endpoint Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'INVENKRAFT Store Inventory Management API',
    timestamp: new Date().toISOString()
  });
});

// Fallback untuk SPA / routing browser
app.get('*', (req, res) => {
  // Jika request bukan API dan bukan file yang ditemukan, arahkan ke index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      message: 'Endpoint API tidak ditemukan.'
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server aplikasi.'
  });
});

// Mulai Server
app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(` INVENKRAFT Server aktif di: http://localhost:${PORT}`);
  console.log(` Halaman Login     : http://localhost:${PORT}/login.html`);
  console.log(` Halaman Dashboard : http://localhost:${PORT}/index.html`);
  console.log('====================================================');
  
  // Uji koneksi ke database MySQL
  await testConnection();
});
