-- ==========================================
-- Database Schema for pce_management
-- Pakistan Chamber of Education (Bahawalpur)
-- 3NF Normalized, Enterprise-Grade Architecture
-- ==========================================

CREATE DATABASE IF NOT EXISTS `pce_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pce_management`;

-- Disable foreign key checks temporarily to allow clean recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `notifications_log`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `account_categories`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `dues_records`;
DROP TABLE IF EXISTS `challans`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. Roles
-- ==========================================
CREATE TABLE `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. Users
-- ==========================================
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT UNSIGNED NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL, -- Hashed with bcrypt
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_users_status` ON `users` (`status`);

-- ==========================================
-- 3. Applications
-- ==========================================
CREATE TABLE `applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `father_husband_name` VARCHAR(100) NOT NULL,
  `cnic` VARCHAR(15) NOT NULL UNIQUE, -- Format: XXXXX-XXXXXXX-X
  `dob` DATE NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `mobile_no` VARCHAR(15) NOT NULL,
  `whatsapp_no` VARCHAR(15) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `qualification` VARCHAR(100) NOT NULL, -- e.g., M.Phil, PhD, MA, etc.
  `institute` VARCHAR(150) NOT NULL,
  `passing_year` INT UNSIGNED NOT NULL,
  `occupation_designation` VARCHAR(100) NOT NULL, -- e.g., Principal, Lecturer
  `organization_school_name` VARCHAR(150) NOT NULL,
  `office_address` TEXT NOT NULL,
  `residential_address` TEXT NOT NULL,
  `district` ENUM('Bahawalpur', 'Bahawalnagar', 'Rahim Yar Khan') NOT NULL,
  `tehsil` VARCHAR(50) NOT NULL,
  `status` ENUM('Pending', 'Approved - Awaiting Payment', 'Rejected', 'Needs More Information') NOT NULL DEFAULT 'Pending',
  `officer_remarks` TEXT NULL,
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_applications_cnic` ON `applications` (`cnic`);
CREATE INDEX `idx_applications_status` ON `applications` (`status`);
CREATE INDEX `idx_applications_district` ON `applications` (`district`);

-- ==========================================
-- 4. Members
-- ==========================================
CREATE TABLE `members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `membership_id` VARCHAR(30) NOT NULL UNIQUE, -- Format: PCE-BWP-YYYY-XXXXX
  `application_id` INT UNSIGNED NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NULL UNIQUE, -- Hashed member portal login (created upon payment verification)
  `full_name` VARCHAR(100) NOT NULL,
  `father_husband_name` VARCHAR(100) NOT NULL,
  `cnic` VARCHAR(15) NOT NULL UNIQUE,
  `dob` DATE NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `mobile_no` VARCHAR(15) NOT NULL,
  `whatsapp_no` VARCHAR(15) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `qualification` VARCHAR(100) NOT NULL,
  `institute` VARCHAR(150) NOT NULL,
  `passing_year` INT UNSIGNED NOT NULL,
  `occupation_designation` VARCHAR(100) NOT NULL,
  `organization_school_name` VARCHAR(150) NOT NULL,
  `office_address` TEXT NOT NULL,
  `residential_address` TEXT NOT NULL,
  `district` ENUM('Bahawalpur', 'Bahawalnagar', 'Rahim Yar Khan') NOT NULL,
  `tehsil` VARCHAR(50) NOT NULL,
  `status` ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
  `activated_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_members_membership_id` ON `members` (`membership_id`);
CREATE INDEX `idx_members_cnic` ON `members` (`cnic`);
CREATE INDEX `idx_members_status` ON `members` (`status`);

-- ==========================================
-- 5. Documents
-- ==========================================
CREATE TABLE `documents` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NULL,
  `member_id` INT UNSIGNED NULL,
  `document_type` ENUM('CNIC Front', 'CNIC Back', 'Photo', 'Degree Certificate', 'Payment Receipt', 'Other') NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(150) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL, -- in bytes
  `mime_type` VARCHAR(100) NOT NULL,
  `uploaded_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_documents_entity` CHECK (
    (`application_id` IS NOT NULL AND `member_id` IS NULL) OR
    (`application_id` IS NULL AND `member_id` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_documents_application` ON `documents` (`application_id`);
CREATE INDEX `idx_documents_member` ON `documents` (`member_id`);

-- ==========================================
-- 6. Challans
-- ==========================================
CREATE TABLE `challans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `challan_number` VARCHAR(30) NOT NULL UNIQUE, -- Format: CHN-YYYYMMDD-XXXX
  `application_id` INT UNSIGNED NULL,
  `member_id` INT UNSIGNED NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('Unpaid', 'Paid', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Unpaid',
  `qr_code_data` TEXT NULL,
  `pdf_file_path` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_challans_entity` CHECK (
    (`application_id` IS NOT NULL AND `member_id` IS NULL) OR
    (`application_id` IS NULL AND `member_id` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_challans_number` ON `challans` (`challan_number`);
CREATE INDEX `idx_challans_status` ON `challans` (`status`);
CREATE INDEX `idx_challans_application` ON `challans` (`application_id`);
CREATE INDEX `idx_challans_member` ON `challans` (`member_id`);

-- ==========================================
-- 7. Dues Records
-- ==========================================
CREATE TABLE `dues_records` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NULL,
  `member_id` INT UNSIGNED NULL,
  `challan_id` INT UNSIGNED NULL,
  `dues_type` ENUM('Admission Fee', 'Monthly Subscription', 'Late Fee', 'Other') NOT NULL,
  `period` VARCHAR(7) NOT NULL, -- e.g., '2026-07'
  `amount` DECIMAL(10, 2) NOT NULL,
  `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Unpaid', 'Partially Paid', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Unpaid',
  `due_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`challan_id`) REFERENCES `challans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_dues_entity` CHECK (
    (`application_id` IS NOT NULL AND `member_id` IS NULL) OR
    (`application_id` IS NULL AND `member_id` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_dues_period` ON `dues_records` (`period`);
CREATE INDEX `idx_dues_status` ON `dues_records` (`status`);
CREATE INDEX `idx_dues_application` ON `dues_records` (`application_id`);
CREATE INDEX `idx_dues_member` ON `dues_records` (`member_id`);

-- ==========================================
-- 8. Payments
-- ==========================================
CREATE TABLE `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `challan_id` INT UNSIGNED NOT NULL,
  `payment_method` ENUM('Bank Transfer', 'EasyPaisa', 'JazzCash', 'Direct Deposit', 'Cash', 'Other') NOT NULL,
  `transaction_ref` VARCHAR(100) NOT NULL UNIQUE, -- E.g. Bank Trx ID / EasyPaisa TRID
  `receipt_document_id` INT UNSIGNED NOT NULL, -- Link to uploaded screenshot/file in documents table
  `amount_paid` DECIMAL(10, 2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `verification_status` ENUM('Submitted', 'Approved', 'Rejected') NOT NULL DEFAULT 'Submitted',
  `verified_by` INT UNSIGNED NULL,
  `verified_at` DATETIME NULL,
  `rejection_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`challan_id`) REFERENCES `challans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`receipt_document_id`) REFERENCES `documents` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_payments_status` ON `payments` (`verification_status`);
CREATE INDEX `idx_payments_trx_ref` ON `payments` (`transaction_ref`);

-- ==========================================
-- 9. Account Categories
-- ==========================================
CREATE TABLE `account_categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `type` ENUM('Income', 'Expense') NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 10. Transactions
-- ==========================================
CREATE TABLE `transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `challan_id` INT UNSIGNED NULL, -- Null if manual general ledger entry
  `payment_id` INT UNSIGNED NULL, -- Null if manual transaction
  `type` ENUM('Income', 'Expense') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `transaction_date` DATE NOT NULL,
  `reference_no` VARCHAR(100) NULL, -- Cheque no, bank ref, manual voucher id
  `description` TEXT NOT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `account_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`challan_id`) REFERENCES `challans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_transactions_date` ON `transactions` (`transaction_date`);
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);

-- ==========================================
-- 11. Notifications Log
-- ==========================================
CREATE TABLE `notifications_log` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `member_id` INT UNSIGNED NULL,
  `application_id` INT UNSIGNED NULL,
  `channel` ENUM('Email', 'SMS', 'WhatsApp') NOT NULL,
  `recipient` VARCHAR(100) NOT NULL, -- Email address or phone number
  `subject` VARCHAR(150) NULL,
  `body` TEXT NOT NULL,
  `status` ENUM('Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Pending',
  `error_message` TEXT NULL,
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_notifications_status` ON `notifications_log` (`status`);

-- ==========================================
-- 12. Audit Log
-- ==========================================
CREATE TABLE `audit_log` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL, -- Null if action by public user (e.g., submitting application)
  `action` VARCHAR(100) NOT NULL, -- E.g. 'SUBMIT_APPLICATION', 'APPROVE_PAYMENT', 'EDIT_MEMBER'
  `entity_name` VARCHAR(50) NOT NULL, -- E.g. 'applications', 'payments', 'members'
  `entity_id` INT UNSIGNED NOT NULL, -- ID of the altered row
  `old_values` JSON NULL, -- JSON snapshot of old data (for updates/deletions)
  `new_values` JSON NULL, -- JSON snapshot of new data
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_audit_entity` ON `audit_log` (`entity_name`, `entity_id`);

-- ==========================================
-- 13. Settings
-- ==========================================
CREATE TABLE `settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'General',
  `updated_by` INT UNSIGNED NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_settings_key` ON `settings` (`setting_key`);
