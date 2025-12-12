-- Migration: Add image column to products table
-- Run this if the image column doesn't exist yet

ALTER TABLE products
ADD COLUMN IF NOT EXISTS image TEXT NULL;

-- If status and hasVariants columns don't exist, add them too
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS hasVariants BOOLEAN DEFAULT FALSE;






