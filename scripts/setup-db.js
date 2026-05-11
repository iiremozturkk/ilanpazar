/**
 * MySQL Database Setup Script for Pazarla
 * Run this ONCE against your local MySQL server:
 *   node scripts/setup-db.js
 *
 * Make sure to set env vars first:
 *   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 * or edit the defaults below.
 */

import mysql from 'mysql2/promise'

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  multipleStatements: true,
}

const DB_NAME = process.env.MYSQL_DATABASE || 'pazarla'

const schema = `

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  buyer_user_id BIGINT UNSIGNED NULL,
  listing_id BIGINT UNSIGNED NOT NULL,
  seller_user_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(50) NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping JSON NULL,
  payment JSON NULL,
  status ENUM('created','paid','shipped','cancel_requested','return_requested','returned','cancelled') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_orders_buyer (buyer_user_id, created_at),
  INDEX idx_orders_seller (seller_user_id, created_at),
  INDEX idx_orders_listing (listing_id),
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_seller FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  listing_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_listing_favorites_user_listing (user_id, listing_id),
  INDEX idx_listing_favorites_user_created_at (user_id, created_at),
  INDEX idx_listing_favorites_listing_created_at (listing_id, created_at),
  CONSTRAINT fk_listing_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_listing_favorites_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  reporter_user_id BIGINT UNSIGNED NULL,
  reason TEXT NOT NULL,
  status ENUM('open','reviewed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_listing_reports_listing_id_created_at (listing_id, created_at),
  INDEX idx_listing_reports_status_created_at (status, created_at),
  CONSTRAINT fk_listing_reports_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_listing_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_listing_comments_listing_id_created_at (listing_id, created_at),
  CONSTRAINT fk_listing_comments_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE \`${DB_NAME}\`;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(120) NOT NULL DEFAULT '',
  status ENUM('active','passive') NOT NULL DEFAULT 'active',
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  cover_image VARCHAR(500) DEFAULT NULL,
  images JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_listings_user (user_id),
  INDEX idx_listings_category (category),
  INDEX idx_listings_status (status),
  INDEX idx_listings_created (created_at),
  FULLTEXT INDEX ft_listings_search (title, description),
  CONSTRAINT fk_listings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed demo data (optional — comment out if not needed)
INSERT IGNORE INTO users (id, name, email, password_hash, phone) VALUES
(1, 'Demo Kullanıcı', 'demo@pazarla.com', '$2a$10$YvFmNbM2DqYUYYZd1rHJ4.hpOJhVwFpB0X9Bz4FQJQYOBKIlBEfJa', '05001234567');

-- demo password = "demo123"

INSERT IGNORE INTO listings (user_id, title, description, price, stock, category, location, status, cover_image, images) VALUES
(1, 'iPhone 15 Pro Max 256GB Natural Titanium', 'Sıfır kutusunda, açılmamış iPhone 15 Pro Max. Fatura ve garanti belgesi ile birlikte. Renk: Natural Titanium. Kapasite: 256GB.', 65000, 1, 'electronics', 'İstanbul, Kadıköy', 'active', 'https://images.unsplash.com/photo-1696446700704-45a9b0fbeea0?w=800&q=80', '["https://images.unsplash.com/photo-1696446700704-45a9b0fbeea0?w=800&q=80"]'),
(1, 'MacBook Pro M3 14 inch Space Black', 'Apple MacBook Pro M3 Pro chip, 18GB RAM, 512GB SSD. Sıfır kutusunda. Türkiye garantili.', 85000, 1, 'electronics', 'İstanbul, Beşiktaş', 'active', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"]'),
(1, 'Tesla Model 3 2023 Long Range', '2023 Tesla Model 3 Long Range AWD, 36.000 km, hasar kayıtsız, tam servis bakımlı. Beyaz renk, siyah iç mekan.', 1850000, 1, 'vehicles', 'Ankara, Çankaya', 'active', 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80', '["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"]'),
(1, 'Modern 3+1 Daire — Bağcılar', '125m² brüt, 105m² net. 3. katta, asansörlü bina. Sıfır yapı, 2022 inşaat. Site içi, güvenlikli. Otopark dahil.', 4500000, 1, 'realestate', 'İstanbul, Bağcılar', 'active', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"]'),
(1, 'Nike Air Jordan 1 Retro High — 42 Numara', 'Orijinal Nike Air Jordan 1 Retro High OG, Chicago colorway. Kutusuyla birlikte, ayakkabı poşeti mevcut. Hiç giyilmedi.', 4500, 1, 'fashion', 'İzmir, Karşıyaka', 'active', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"]'),
(1, 'Vintage Ahşap Yemek Masası 6 Kişilik', 'Masif meşe ahşap, el yapımı yemek masası. Boyutlar: 200x90cm. 6 adet sandalye dahildir. Hafif çizikler mevcut, genel durum çok iyi.', 12000, 1, 'home', 'İstanbul, Şişli', 'active', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"]'),
(1, 'Trek Marlin 5 Mountain Bike 2022', '29 jant dağ bisikleti, M beden, 21 vites. 500km kullanılmış, tüm bakımları yapılmış. Aksesuar olarak ışık seti ve kask dahildir.', 8500, 1, 'sports', 'Bursa, Osmangazi', 'active', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"]'),
(1, 'Golden Retriever Yavruları — 2 Aylık', 'Anne ve baba köpekler yanında 2 aylık sağlıklı Golden Retriever yavrular. Veteriner kontrollerinden geçti, aşıları yapıldı.', 15000, 1, 'pets', 'İstanbul, Ümraniye', 'active', 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800&q=80', '["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800&q=80"]');
`

async function run() {
  console.log('[Pazarla DB Setup] Connecting to MySQL...')
  let conn
  try {
    conn = await mysql.createConnection(config)
    console.log('[Pazarla DB Setup] Connected. Running schema...')
    await conn.query(schema)
    console.log('[Pazarla DB Setup] Database and tables created successfully!')
    console.log(`[Pazarla DB Setup] Database: ${DB_NAME}`)
    console.log('[Pazarla DB Setup] Core marketplace tables created/updated.')
    console.log('[Pazarla DB Setup] Demo data inserted.')
    console.log('[Pazarla DB Setup] Done!')
  } catch (err) {
    console.error('[Pazarla DB Setup] ERROR:', err.message)
    process.exit(1)
  } finally {
    if (conn) await conn.end()
  }
}

run()
