-- Migration: Add member_types table
CREATE TABLE IF NOT EXISTS member_types (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    min_orders INT DEFAULT 0,
    min_spent DECIMAL(10,2) DEFAULT 0,
    discount_percent INT DEFAULT 0,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- Insert default member types
INSERT INTO member_types (id, name, description, min_orders, min_spent, discount_percent) VALUES
(UUID(), 'potential', 'Khách hàng tiềm năng', 10, 5000000, 10),
(UUID(), 'regular', 'Khách hàng thường xuyên', 5, 2000000, 5),
(UUID(), 'occasional', 'Khách hàng thỉnh thoảng', 2, 500000, 2),
(UUID(), 'new', 'Khách hàng mới', 0, 0, 0)
ON DUPLICATE KEY UPDATE name=name;




