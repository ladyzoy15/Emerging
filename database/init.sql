CREATE DATABASE IF NOT EXISTS receiptai;
USE receiptai;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    category_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category (user_id, category_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status ENUM('uploaded','processing','completed','failed') DEFAULT 'uploaded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receipts_user_id (user_id),
    INDEX idx_receipts_status (processing_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    receipt_id INT NULL,
    merchant_name VARCHAR(255),
    receipt_number VARCHAR(100),
    receipt_date DATE,
    category VARCHAR(100),
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    vat_amount DECIMAL(12,2) DEFAULT 0.00,
    vatable_sales DECIMAL(12,2) DEFAULT 0.00,
    vat_exempt_sales DECIMAL(12,2) DEFAULT 0.00,
    non_vat_sales DECIMAL(12,2) DEFAULT 0.00,
    verification_status ENUM('verified','needs_review','unverified') DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expenses_user_id (user_id),
    INDEX idx_expenses_receipt_date (receipt_date),
    INDEX idx_expenses_category (category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default categories (user_id NULL = global defaults)
INSERT INTO categories (user_id, category_name) VALUES
(NULL, 'Food and Meals'),
(NULL, 'Transportation'),
(NULL, 'Office Supplies'),
(NULL, 'Utilities'),
(NULL, 'Equipment'),
(NULL, 'Professional Services'),
(NULL, 'Other');

-- Demo user (password: demo123)
INSERT INTO users (name, email, password_hash) VALUES
('Demo User', 'demo@receiptai.com', '$2b$12$LJ3m4ys3Lk0TSwHjmz0ZHeY.gy/5XoFnMVSTB.pGrxy2H4RmgHDYC');
