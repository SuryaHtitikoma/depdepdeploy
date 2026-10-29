-- =====================================================================
-- DATABASE SCHEMA: INVENKRAFT STORE INVENTORY MANAGEMENT
-- Dialect: MySQL 5.7+ / 8.0+ / MariaDB
-- =====================================================================

-- 1. Inisialisasi Database
CREATE DATABASE IF NOT EXISTS `invenkraft_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `invenkraft_db`;

-- 2. Hapus Tabel Lama Jika Ada (Sesuai Urutan Relasi)
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- 3. Tabel Pengguna (Users / Authenticated Staff)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Produk / Barang Inventaris
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(40) NOT NULL UNIQUE,
  `name` VARCHAR(160) NOT NULL,
  `category` VARCHAR(60) NOT NULL,
  `purchase_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 5,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
  `description` TEXT NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_created_by` 
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index untuk Optimasi Pencarian & Filter
CREATE INDEX `idx_products_category` ON `products`(`category`);
CREATE INDEX `idx_products_stock` ON `products`(`stock`);
CREATE INDEX `idx_products_name` ON `products`(`name`);

-- =====================================================================
-- SEED DATA (DATA AWAL)
-- =====================================================================

-- 1. Pengguna Awal:
--    Username: admin | Password: admin123
--    Username: staff | Password: staff123
INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `role`) VALUES
(1, 'admin', 'admin@invenkraft.local', '$2a$10$Iovt/VxRLbFD0vBM/svKsub1xXNr07H4C.mip7OLUt/0BCicgsS2q', 'Administrator Toko', 'admin'),
(2, 'staff', 'staff@invenkraft.local', '$2a$10$ZhIkp3AfenzjcRT8PfPB.us7FQiRwFpnwULIsyRLePe.OuB6Xx67e', 'Staff Pergudangan', 'staff');

-- 2. Contoh Data Barang Inventaris (Menampilkan Kondisi Aman, Menipis, dan Habis)
INSERT INTO `products` (`id`, `sku`, `name`, `category`, `purchase_price`, `selling_price`, `stock`, `min_stock`, `unit`, `description`, `created_by`) VALUES
(1, 'ELK-001-MOU', 'Logitech Silent Wireless Mouse M220', 'Elektronik', 145000.00, 185000.00, 24, 5, 'unit', 'Mouse optik nirkabel hemat daya dengan tombol senyap.', 1),
(2, 'ELK-002-KBD', 'Keychron K2 Mechanical Keyboard Gateron Brown', 'Elektronik', 1150000.00, 1420000.00, 4, 5, 'unit', 'Keyboard mechanical 75% nirkabel Bluetooth dan Type-C.', 1),
(3, 'ELK-003-HUB', 'Anker 7-in-1 USB-C Hub Power Delivery', 'Elektronik', 420000.00, 560000.00, 0, 3, 'unit', 'Adapter multi-port HDMI 4K, USB 3.0, SD card reader.', 1),
(4, 'ATK-101-PPR', 'PaperOne Kertas HVS A4 80gsm (Box 5 Rim)', 'Alat Tulis Kantor', 190000.00, 235000.00, 35, 10, 'box', 'Kertas HVS kualitas premium ultra-white untuk cetak presisi.', 2),
(5, 'ATK-102-PEN', 'Pilot G-2 Gel Pen 0.5mm Hitam (Lusin)', 'Alat Tulis Kantor', 135000.00, 168000.00, 8, 10, 'lusin', 'Pena gel kenyamanan tinggi dengan grip karet ergonomis.', 2),
(6, 'ATK-103-STP', 'Kangaro Stapler Heavy Duty HD-23S17', 'Alat Tulis Kantor', 210000.00, 275000.00, 3, 4, 'unit', 'Stapler jilid kapasitas hingga 170 lembar.', 2),
(7, 'PRL-201-SCN', 'Honeywell Barcode Scanner 1D/2D QR Handheld', 'Peralatan Toko', 620000.00, 790000.00, 7, 3, 'unit', 'Pemindai barcode kasir USB Plug & Play kecepatan tinggi.', 1),
(8, 'PRL-202-THM', 'Epson Thermal Receipt Printer TM-T82X', 'Peralatan Toko', 1850000.00, 2250000.00, 0, 2, 'unit', 'Printer kasir struk auto-cutter ukuran kertas 80mm.', 1),
(9, 'KMS-301-BBL', 'Bubble Wrap Roll Tebal 50m x 125cm', 'Kemasan & Packing', 115000.00, 145000.00, 18, 5, 'roll', 'Plastik gelembung proteksi pengiriman paket tebal 4mm.', 2),
(10, 'KMS-302-DSK', 'Kardus Karton Corrugated Box Ukuran 30x20x15cm', 'Kemasan & Packing', 3200.00, 4800.00, 120, 25, 'pcs', 'Kardus coklat single wall polos untuk packing e-commerce.', 2);
