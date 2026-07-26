-- ==========================================
-- Seed Data for pce_management
-- Pakistan Chamber of Education (Bahawalpur)
-- ==========================================

USE `pce_management`;

-- ==========================================
-- 1. Seed Roles
-- ==========================================
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'Super Admin', 'Full system access, manages settings, users, and has complete visibility.'),
(2, 'Finance Officer', 'Manages dues, challans, processes payment verifications, and manages accounting transactions.'),
(3, 'Membership Officer', 'Manages applications, reviews submitted forms, updates member profile statuses.'),
(4, 'Viewer', 'Read-only access to directory, status checking, and audit records.');

-- ==========================================
-- 2. Seed Super Admin User
-- Password Plaintext: 'AdminPCE@2026'
-- Hashed using Bcrypt with 10 rounds
-- ==========================================
INSERT INTO `users` (`id`, `role_id`, `full_name`, `email`, `password`, `status`) VALUES
(1, 1, 'PCE Super Admin', 'admin@pce.org.pk', '$2a$10$KFh9yDMKbFCDQQuIZKLDgeX3M1ZF4FmXSKRz6TkwRAIRFmtKGbMrm', 'Active');

-- ==========================================
-- 3. Seed Default System Settings
-- ==========================================
INSERT INTO `settings` (`setting_key`, `setting_value`, `description`, `category`, `updated_by`) VALUES
('org_name', 'Pakistan Chamber of Education', 'Official Organization Name', 'General', 1),
('division_name', 'Bahawalpur Division', 'Administrative Division Name', 'General', 1),
('org_logo_path', '/uploads/settings/pce_logo.png', 'Path to organization logo', 'General', 1),
('org_email', 'info@pce.org.pk', 'Contact email address', 'General', 1),
('org_phone', '+92 62 1234567', 'Official office telephone number', 'General', 1),
('org_address', 'PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan', 'Physical postal address of the Chamber office', 'General', 1),
('stat_total_members', '1,250+', 'Total registered members statistics', 'General', 1),
('stat_provinces_covered', '4', 'Number of provinces covered', 'General', 1),
('stat_institutions', '380+', 'Total affiliated institutions', 'General', 1),
('stat_years_of_service', '12+', 'Years of chamber operations', 'General', 1),

-- Financial Settings
('admission_fee_pkr', '5000.00', 'Default registration/admission fee for new applications', 'Financial', 1),
('monthly_fee_pkr', '2000.00', 'Standard monthly contribution fee per member', 'Financial', 1),
('late_fee_pkr', '500.00', 'Default fine for late payments after due date', 'Financial', 1),
('bank_name', 'Habib Bank Limited (HBL)', 'Official bank name for dues collection', 'Financial', 1),
('bank_account_title', 'Pakistan Chamber of Education Bahawalpur', 'Official bank account title for deposits', 'Financial', 1),
('bank_account_no', '1234-56789012-03', 'Official account number', 'Financial', 1),
('bank_iban', 'PK12 HABB 0012 3456 7890 1203', 'Official bank IBAN for online transfers', 'Financial', 1),

-- Notification & SMTP Settings
('smtp_host', 'smtp.pce.org.pk', 'Outgoing mail server host', 'Notification', 1),
('smtp_port', '587', 'SMTP port (typically 587 for TLS, 465 for SSL)', 'Notification', 1),
('smtp_user', 'notifications@pce.org.pk', 'SMTP authentication username', 'Notification', 1),
('smtp_pass', 'smtp_encrypted_placeholder_pass', 'SMTP authentication password', 'Notification', 1),
('whatsapp_api_provider', 'none', 'API provider configuration key (e.g. Twilio, WhatsApp Cloud API)', 'Notification', 1);

-- ==========================================
-- 4. Seed Account Categories
-- ==========================================
INSERT INTO `account_categories` (`id`, `name`, `type`, `description`) VALUES
-- Income Categories
(1, 'Admission Fees', 'Income', 'Fees paid by new applicants upon membership acceptance.'),
(2, 'Monthly Subscription Dues', 'Income', 'Recurring monthly contributions from active members.'),
(3, 'Late Dues Surcharges', 'Income', 'Late fee penalties collected on overdue challans.'),
(4, 'Donations & Grants', 'Income', 'Voluntary donations and government/educational grants.'),
(5, 'Event Sponsorships', 'Income', 'Income received from corporate sponsors for seminars/conferences.'),

-- Expense Categories
(6, 'Office Rent', 'Expense', 'Monthly office building lease payments.'),
(7, 'Staff Salaries', 'Expense', 'Salaries of officers, administrative staff, and security.'),
(8, 'Utility Bills', 'Expense', 'Electricity, gas, high-speed internet, and water service charges.'),
(9, 'Events & Seminars', 'Expense', 'Costs associated with organizing educational workshops and events.'),
(10, 'Printing & Stationary', 'Expense', 'Costs for printing physical certificates, challans, marketing booklets.'),
(11, 'IT Infrastructure & Software', 'Expense', 'Web hosting, domain registrations, SMS API packages, and server maintenance.');
