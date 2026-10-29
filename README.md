# INVENKRAFT — Sistem Manajemen Inventaris Toko & Pergudangan

Aplikasi full-stack modern berbasis **Node.js, Express, MySQL**, dan **Vanilla HTML5 + CSS3** yang dirancang dengan art direction **Industrial Precision & Swiss Utility** (Anti-AI Slop: tata letak terstruktur, kontras tinggi, microinteractions halus, tanpa gradien generik ungu/pink).

---

## Fitur Utama

- **Autentikasi Aman:** Login & Registrasi staff dengan enkripsi password `bcryptjs` dan sesi `JSON Web Token (JWT)`.
- **Manajemen Inventaris (CRUD):** Tambah barang, ubah rincian, dan hapus barang dengan modal dialog presisi dan konfirmasi keamanan.
- **Pencarian & Filter Cepat:** Pencarian teks penuh (SKU, Nama, Deskripsi) dengan *debounce*, filter kategori dinamis, dan filter status stok (*In Stock, Low Stock, Out of Stock*).
- **Pengurutan & Paginasi:** Sortir berdasarkan nama, kode SKU, jumlah stok, harga jual, dan waktu dibuat (ASC/DESC) beserta pagination dan pemilihan limit data (10/25/50).
- **Dashboard Ringkasan Operasional:** 4 metrik kartu real-time (Total SKU, Total Unit Fisik, Valuasi Modal Aset, Estimasi Omset Jual, dan Notifikasi Stok Kritis).
- **Micro-Interactions & State Lengkap:** Indikator loading spinner, skeleton placeholder, empty state interaktif, error state dengan tombol coba lagi, dan notifikasi Toast mengambang.

---

## Struktur Folder

```text
web-antigrav/
├── .env.example              # Template variabel konfigurasi environment
├── .env                      # File konfigurasi aktif (port, database, JWT)
├── package.json              # Dependensi npm dan script eksekusi
├── README.md                 # Dokumentasi dan panduan setup
├── database/
│   └── schema.sql            # Script DDL SQL tabel users, products & data seed awal
├── src/
│   ├── config/
│   │   └── db.js             # MySQL connection pool (mysql2/promise)
│   ├── middleware/
│   │   └── auth.js           # Middleware verifikasi token JWT & proteksi route
│   ├── controllers/
│   │   ├── auth.controller.js    # Logic Login, Register, Me profile
│   │   └── product.controller.js # Logic CRUD produk, statistik & query dinamis
│   ├── routes/
│   │   ├── auth.routes.js        # Route /api/auth
│   │   └── product.routes.js     # Route /api/products
│   └── server.js             # Entrypoint server Express & static assets server
└── public/
    ├── css/
    │   └── style.css         # Desain sistem vanilla CSS (Industrial Precision)
    ├── js/
    │   ├── api.js            # Fetch wrapper, JWT token interceptor, toast system
    │   ├── login.js          # Controller interaktif halaman login & register
    │   └── app.js            # Controller interaktif dashboard & tabel inventaris
    ├── login.html            # Halaman autentikasi akun
    └── index.html            # Halaman utama dashboard inventaris
```

---

## Akun Demo Bawaan

| Role | Username | Password | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh manajemen inventaris |
| **Staff Gudang** | `staff` | `staff123` | Akses operasional harian gudang |

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- **Node.js**: Versi 18+ atau versi LTS terbaru.
- **MySQL Server**: Menggunakan **XAMPP**, **Laragon**, atau **MySQL Server Standalone**.

### 2. Impor Database MySQL
1. Buka kontrol panel **XAMPP** atau **Laragon**, lalu pastikan modul **MySQL** sudah berstatus `Running`.
2. Buka antarmuka manajemen database seperti **phpMyAdmin** (`http://localhost/phpmyadmin`) atau terminal MySQL / DBeaver / HeidiSQL.
3. Jalankan / impor query yang terdapat di dalam file:
   ```text
   database/schema.sql
   ```
   *Script ini secara otomatis membuat database `invenkraft_db`, tabel `users`, tabel `products`, index pencarian, serta 10 data barang awal (seed).*

### 3. Konfigurasi Variabel Environment
File `.env` sudah disediakan. Pastikan kredensial MySQL sesuai dengan server lokal Anda:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=invenkraft_db
DB_PORT=3306
JWT_SECRET=invenkraft_super_secret_jwt_key_2026_production_grade
JWT_EXPIRES_IN=24h
```
*(Catatan: Jika MySQL Anda menggunakan password, isi pada kolom `DB_PASS`)*.

### 4. Install Dependensi Node.js
Jalankan perintah berikut di terminal folder proyek:
```bash
npm install
```

### 5. Jalankan Server
- Untuk mode produksi:
  ```bash
  npm start
  ```
- Untuk mode development dengan auto-reload:
  ```bash
  npm run dev
  ```

### 6. Buka di Browser
Akses alamat berikut pada peramban web:
- **Halaman Login**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
- **Halaman Dashboard**: [http://localhost:5000/](http://localhost:5000/)
*(Klik tombol "⚡ Akun Demo Bawaan" pada halaman login untuk masuk secara instan).*
