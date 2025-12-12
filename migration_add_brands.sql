-- Migration: Thêm bảng brands và cột brand_id vào products

-- Tạo bảng brands
CREATE TABLE IF NOT EXISTS brands (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- Thêm cột brand_id vào bảng products (nếu chưa có)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id CHAR(36),
ADD COLUMN IF NOT EXISTS brand VARCHAR(255) DEFAULT '';

-- Thêm foreign key constraint (nếu chưa có)
-- Lưu ý: Cần kiểm tra xem constraint đã tồn tại chưa trước khi thêm
-- ALTER TABLE products 
-- ADD CONSTRAINT fk_product_brand 
-- FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;






