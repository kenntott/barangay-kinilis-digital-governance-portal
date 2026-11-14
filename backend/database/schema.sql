-- =====================================================================
-- Barangay Kinilis Community Complaint Resolution and Accountability System
-- MySQL / MariaDB Database Schema (XAMPP Compatible)
-- Database Name: barangay_kinilis_db
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `barangay_kinilis_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `barangay_kinilis_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('resident', 'staff', 'admin') NOT NULL DEFAULT 'resident',
  `phone` VARCHAR(30) NULL,
  `purok` VARCHAR(100) DEFAULT 'Purok 3, Brgy. Kinilis, Polomolok',
  `avatar_url` VARCHAR(255) NULL,
  `department` VARCHAR(100) NULL,
  `position` VARCHAR(100) NULL,
  `status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `head_officer` VARCHAR(150) NULL,
  `staff_count` INT DEFAULT 5,
  `sla_hours` INT DEFAULT 72,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reference_no` VARCHAR(50) NOT NULL UNIQUE,
  `resident_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  `status` ENUM(
    'Submitted',
    'Under Review',
    'Acknowledged',
    'Assigned',
    'Under Investigation',
    'In Progress',
    'Resolution Submitted',
    'Awaiting Resident Verification',
    'Resolved',
    'Closed',
    'Rejected'
  ) NOT NULL DEFAULT 'Submitted',
  `location` VARCHAR(255) NOT NULL,
  `incident_date` DATE NULL,
  `incident_time` VARCHAR(30) NULL,
  `resident_name` VARCHAR(150) NOT NULL,
  `resident_email` VARCHAR(150) NOT NULL,
  `resident_phone` VARCHAR(30) NULL,
  `preferred_contact` VARCHAR(30) DEFAULT 'Phone',
  `target_resolution_date` DATETIME NULL,
  `is_overdue` TINYINT(1) DEFAULT 0,
  `remarks` TEXT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`resident_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_complaints_ref` (`reference_no`),
  INDEX `idx_complaints_status` (`status`),
  INDEX `idx_complaints_priority` (`priority`),
  INDEX `idx_complaints_category` (`category`),
  INDEX `idx_complaints_resident` (`resident_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Status History & Timeline (Append-Only)
CREATE TABLE IF NOT EXISTS `complaint_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `action_title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `performed_by_name` VARCHAR(150) NULL,
  `performed_by_role` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
  INDEX `idx_history_complaint` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Evidence & Attachments Table
CREATE TABLE IF NOT EXISTS `complaint_evidence` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` VARCHAR(50) NULL,
  `file_type` VARCHAR(50) NULL,
  `uploaded_by` VARCHAR(150) NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
  INDEX `idx_evidence_complaint` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Department Routing and Officer Assignment Table
CREATE TABLE IF NOT EXISTS `complaint_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `department_name` VARCHAR(100) NOT NULL,
  `assigned_staff` VARCHAR(150) NULL,
  `assigned_by_name` VARCHAR(150) NULL,
  `routing_status` VARCHAR(50) DEFAULT 'Automatically Routed',
  `notes` TEXT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
  INDEX `idx_assignments_complaint` (`complaint_id`),
  INDEX `idx_assignments_dept` (`department_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Resident Follow-Up Communication Table
CREATE TABLE IF NOT EXISTS `complaint_followups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `sender_id` INT NULL,
  `sender_name` VARCHAR(150) NOT NULL,
  `sender_role` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `attachment_path` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
  INDEX `idx_followups_complaint` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Complaint Resolutions Table
CREATE TABLE IF NOT EXISTS `complaint_resolutions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL UNIQUE,
  `resolved_by` VARCHAR(150) NOT NULL,
  `summary` TEXT NOT NULL,
  `evidence_url` VARCHAR(255) NULL,
  `resolved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Resident Feedback & Verification Table
CREATE TABLE IF NOT EXISTS `resident_feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL UNIQUE,
  `resident_id` INT NULL,
  `action_status` ENUM('Accepted', 'Request Further Action') DEFAULT 'Accepted',
  `rating` INT CHECK (`rating` BETWEEN 1 AND 5),
  `satisfaction_level` VARCHAR(50) NULL,
  `comments` TEXT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AI Classification & Duplicate Detection Logs
CREATE TABLE IF NOT EXISTS `ai_classification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `priority` VARCHAR(50) NOT NULL,
  `suggested_department` VARCHAR(100) NOT NULL,
  `confidence` INT NOT NULL,
  `reasoning` TEXT NULL,
  `keywords` TEXT NULL,
  `was_overridden` TINYINT(1) DEFAULT 0,
  `override_reason` TEXT NULL,
  `overridden_by` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON DELETE CASCADE,
  INDEX `idx_ai_complaint` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Category Routing Rules (Admin Configurable)
CREATE TABLE IF NOT EXISTS `complaint_routing_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(100) NOT NULL UNIQUE,
  `department` VARCHAR(100) NOT NULL,
  `default_priority` ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `keywords` TEXT NOT NULL,
  `assigned_staff` VARCHAR(150) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. In-App Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `target_role` ENUM('all', 'resident', 'staff', 'admin') DEFAULT 'all',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `reference_no` VARCHAR(50) NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_target` (`target_role`),
  INDEX `idx_notif_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. System Audit Logs Table (Tamper-Resistant)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `entity_ref` VARCHAR(100) NOT NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_module` (`module`),
  INDEX `idx_audit_entity` (`entity_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SEED DATA (Departments, Routing Rules, Default Accounts, Initial Complaints)
-- =====================================================================

-- Seed Departments
INSERT INTO `departments` (`id`, `name`, `description`, `head_officer`, `staff_count`, `sla_hours`, `status`) VALUES
(1, 'Sanitation Department', 'Manages solid waste collection, street cleaning, and environmental hygiene.', 'Maria Santos', 8, 48, 'Active'),
(2, 'Peace & Order Bureau', 'Handles community security, barangay tanod patrol, noise, and dispute conciliation.', 'Officer Cardo Dimaano', 12, 24, 'Active'),
(3, 'Infrastructure & Public Works', 'Maintains barangay roads, streetlights, drainage canals, and public buildings.', 'Engr. Roberto Cruz', 6, 72, 'Active'),
(4, 'Barangay Health Center', 'Coordinates disease control, immunizations, maternal care, and community sanitation.', 'Nurse Elena Ramos', 10, 48, 'Active'),
(5, 'Social Welfare Office', 'Manages senior citizen aid, PWD support, educational assistance, and relief distribution.', 'Social Worker Ana Garcia', 5, 96, 'Active'),
(6, 'Barangay Administrative Office', 'Overlooks clearances, permits, secretarial records, and executive public service.', 'Sec. Danilo Lopez', 7, 48, 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed Users with bcrypt hashed passwords ('password123')
INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `phone`, `purok`, `avatar_url`, `department`, `position`) VALUES
(1, 'Juan dela Cruz', 'juan.delacruz@kinilis.gov.ph', '$2y$10$4.T9L/lC5L48w6Hw4J9W1eY8aBqX2Vj9tG6iK0xV0xU4yS2F8rX0a', 'resident', '0917-123-4567', 'Purok 3, Brgy. Kinilis, Polomolok', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', NULL, NULL),
(2, 'Maria Santos', 'maria.santos@kinilis.gov.ph', '$2y$10$4.T9L/lC5L48w6Hw4J9W1eY8aBqX2Vj9tG6iK0xV0xU4yS2F8rX0a', 'staff', '0920-987-6543', 'Purok 1, Brgy. Kinilis', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Sanitation Department', 'Sanitation Officer'),
(3, 'Admin Desk (Capt. Hon. Escabarte)', 'admin@kinilis.gov.ph', '$2y$10$4.T9L/lC5L48w6Hw4J9W1eY8aBqX2Vj9tG6iK0xV0xU4yS2F8rX0a', 'admin', '0918-000-1122', 'Brgy. Hall Complex, Kinilis', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'Barangay Administrative Office', 'Barangay Administrator'),
(4, 'Engr. Roberto Cruz', 'roberto.cruz@kinilis.gov.ph', '$2y$10$4.T9L/lC5L48w6Hw4J9W1eY8aBqX2Vj9tG6iK0xV0xU4yS2F8rX0a', 'staff', '0917-555-4433', 'Purok 2, Brgy. Kinilis', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Infrastructure & Public Works', 'Public Works Engineer'),
(5, 'Nurse Elena Ramos', 'elena.ramos@kinilis.gov.ph', '$2y$10$4.T9L/lC5L48w6Hw4J9W1eY8aBqX2Vj9tG6iK0xV0xU4yS2F8rX0a', 'staff', '0922-111-9988', 'Purok 4, Brgy. Kinilis', 'https://images.unsplash.com/photo-1594824813576-921c5f3c966a?w=150&auto=format&fit=crop&q=80', 'Barangay Health Center', 'Head Nurse')
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

-- Seed Routing Rules
INSERT INTO `complaint_routing_rules` (`id`, `category`, `department`, `default_priority`, `keywords`, `assigned_staff`) VALUES
(1, 'Waste Management', 'Sanitation Department', 'Medium', 'garbage,basura,uncollected,waste,trash,smell,dumping,litter', 'Maria Santos (Sanitation Officer)'),
(2, 'Peace & Order', 'Peace & Order Bureau', 'High', 'noise,ingay,fight,drunk,thief,security,curfew,gambling,riot,rowdy', 'Tanod Desk Officer'),
(3, 'Infrastructure', 'Infrastructure & Public Works', 'Medium', 'road,kalsada,bridge,pothole,drainage,canal,street light,post,flood,baha,broken', 'Engr. Roberto Cruz'),
(4, 'Health Services', 'Barangay Health Center', 'Medium', 'fever,dengue,mosquito,sick,clinic,medicine,vaccine,sanitation,covid,health', 'Nurse Elena Ramos'),
(5, 'Social Welfare', 'Social Welfare Office', 'Low', 'senior,pwd,assistance,food pack,relief,aid,financial,indigent,solar', 'Social Worker Ana Garcia'),
(6, 'Barangay Administration', 'Barangay Administrative Office', 'Low', 'clearance,permit,certificate,inquiry,schedule,fee,document,secretary', 'Sec. Danilo Lopez')
ON DUPLICATE KEY UPDATE `category`=VALUES(`category`);

-- Seed Baseline Complaints
INSERT INTO `complaints` (`id`, `reference_no`, `resident_id`, `title`, `description`, `category`, `priority`, `status`, `location`, `incident_date`, `incident_time`, `resident_name`, `resident_email`, `resident_phone`, `preferred_contact`, `target_resolution_date`, `remarks`) VALUES
(1, 'KIN-2026-000123', 1, 'Garbage not collected along Purok 3 main street', 'Unhygienic uncollected garbage piles left for 4 days near the corner store causing foul smell and attracting stray animals.', 'Waste Management', 'Medium', 'In Progress', 'Purok 3, Main Street, Brgy. Kinilis', '2026-04-26', '10:30 AM', 'Juan dela Cruz', 'juan.delacruz@kinilis.gov.ph', '0917-123-4567', 'Phone', DATE_ADD(NOW(), INTERVAL 48 HOUR), 'Dispatched 6-wheeler waste management truck to site.'),
(2, 'KIN-2026-000122', 1, 'Deep pothole hazard on Purok 1 access road', 'Large damaged road section causing motorcycle accidents near the elementary school perimeter line.', 'Infrastructure', 'High', 'Assigned', 'Purok 1 Road near Elementary School', '2026-04-25', '02:15 PM', 'Pedro Penduko', 'pedro@kinilis.gov.ph', '0918-999-8877', 'SMS', DATE_ADD(NOW(), INTERVAL 24 HOUR), 'Site inspection scheduled for tomorrow morning.'),
(3, 'KIN-2026-000121', 1, 'Loud videoke past midnight at Purok 4', 'Continuous loud music and videoke noise past 12:00 AM disturbing sleep on a weekday night.', 'Peace & Order', 'Low', 'Submitted', 'Purok 4 near basketball court', '2026-04-24', '11:45 PM', 'Maria Clara', 'maria.clara@kinilis.gov.ph', '0920-111-2233', 'Phone', DATE_ADD(NOW(), INTERVAL 72 HOUR), 'Pending Tanod night patrol assignment.'),
(4, 'KIN-2026-000120', 1, 'Stagnant water breeding dengue mosquitoes in vacant lot', 'Large open puddle and dumped tires holding stagnant rainwater after heavy typhoon downpour.', 'Health Services', 'High', 'Resolved', 'Purok 2 interior access path', '2026-04-22', '09:00 AM', 'Juan dela Cruz', 'juan.delacruz@kinilis.gov.ph', '0917-123-4567', 'Email', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Operation successful with zero new fever reports.'),
(5, 'KIN-2026-000118', 1, 'Flash flooding risk due to clogged drainage culvert', 'Heavy rain causes overflowing canal into 3 houses near Purok 5 bridge line due to trapped logs and trash.', 'Infrastructure', 'Urgent', 'In Progress', 'Purok 5 Drainage Canal near Creek Bridge', '2026-04-21', '08:30 AM', 'Santanina Santos', 'santanina@kinilis.gov.ph', '0919-888-7766', 'Phone', DATE_ADD(NOW(), INTERVAL 12 HOUR), 'Heavy machinery clearing debris currently.')
ON DUPLICATE KEY UPDATE `reference_no`=VALUES(`reference_no`);

-- Seed Timeline Records for Complaint 1
INSERT INTO `complaint_status_history` (`complaint_id`, `status`, `action_title`, `description`, `performed_by_name`, `performed_by_role`, `created_at`) VALUES
(1, 'Submitted', 'Complaint Submitted', 'Complaint registered online by resident Juan dela Cruz.', 'Juan dela Cruz', 'Resident', '2026-04-26 10:30:00'),
(1, 'Under Review', 'AI Classification Completed', 'Classification engine suggested category Waste Management (92% confidence).', 'System AI', 'System', '2026-04-26 10:30:05'),
(1, 'Assigned', 'Department Assignment', 'Routed to Sanitation Department under officer Maria Santos.', 'Admin Desk', 'Admin', '2026-04-26 10:35:00'),
(1, 'Acknowledged', 'Complaint Acknowledged', 'Acknowledged by Maria Santos (Sanitation Officer).', 'Maria Santos', 'Staff', '2026-04-26 11:00:00'),
(1, 'In Progress', 'Field Dispatch', 'Sanitation truck dispatched to clear Purok 3 main street.', 'Maria Santos', 'Staff', '2026-04-26 11:20:00');

-- Seed Assignments
INSERT INTO `complaint_assignments` (`complaint_id`, `department_name`, `assigned_staff`, `assigned_by_name`, `routing_status`, `notes`) VALUES
(1, 'Sanitation Department', 'Maria Santos', 'Admin Desk', 'Automatically Routed', 'Dispatched 6-wheeler truck'),
(2, 'Infrastructure & Public Works', 'Engr. Roberto Cruz', 'Admin Desk', 'Automatically Routed', 'Scheduled road patching'),
(4, 'Barangay Health Center', 'Nurse Elena Ramos', 'Admin Desk', 'Automatically Routed', 'Scheduled fogging operation'),
(5, 'Infrastructure & Public Works', 'Engr. Roberto Cruz', 'Admin Desk', 'Escalated Urgently', 'Emergency backhoe clearing');

-- Seed Resolution for Complaint 4
INSERT INTO `complaint_resolutions` (`complaint_id`, `resolved_by`, `summary`, `evidence_url`, `resolved_at`) VALUES
(4, 'Nurse Elena Ramos', 'Fogging conducted across all 4 streets of Purok 2. 50 dengue prevention kits turned over to Purok Leader.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80', '2026-04-23 16:00:00')
ON DUPLICATE KEY UPDATE `resolved_by`=VALUES(`resolved_by`);

-- Seed Feedback for Complaint 4
INSERT INTO `resident_feedback` (`complaint_id`, `resident_id`, `action_status`, `rating`, `satisfaction_level`, `comments`, `submitted_at`) VALUES
(4, 1, 'Accepted', 5, 'Very Satisfied', 'Very fast response from the health center team! Thank you Barangay Kinilis!', '2026-04-23 17:30:00')
ON DUPLICATE KEY UPDATE `rating`=VALUES(`rating`);

-- Seed Notifications
INSERT INTO `notifications` (`id`, `user_id`, `target_role`, `title`, `message`, `reference_no`, `type`, `is_read`, `created_at`) VALUES
(1, NULL, 'all', 'New complaint submitted', 'KIN-2026-000123 - Garbage not collected along Purok 3 main street', 'KIN-2026-000123', 'submission', 0, NOW()),
(2, 2, 'staff', 'Complaint routed automatically', 'Routed to Sanitation Department under Maria Santos', 'KIN-2026-000123', 'routing', 0, NOW()),
(3, 1, 'resident', 'Status updated to In Progress', 'KIN-2026-000123 status updated by Maria Santos', 'KIN-2026-000123', 'status', 1, NOW()),
(4, 3, 'admin', 'Urgent complaint alert', 'KIN-2026-000118 - Flash flooding risk in Purok 5', 'KIN-2026-000118', 'urgent', 0, NOW())
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Seed Audit Logs
INSERT INTO `audit_logs` (`user_name`, `user_role`, `action`, `module`, `entity_ref`, `old_value`, `new_value`, `ip_address`, `created_at`) VALUES
('System AI', 'System', 'AI Classified & Routed', 'Classification Engine', 'KIN-2026-000123', 'Unclassified', 'Waste Management -> Sanitation Dept', '127.0.0.1', '2026-04-26 10:30:05'),
('Maria Santos', 'Staff', 'Acknowledged Complaint', 'Staff Portal', 'KIN-2026-000123', 'Pending', 'In Progress', '127.0.0.1', '2026-04-26 11:00:00'),
('Admin Desk', 'Admin', 'Category Mapping Updated', 'Routing Config', 'Waste Management Rule', 'Default Priority: Low', 'Default Priority: Medium', '127.0.0.1', '2026-04-25 09:15:00'),
('Nurse Elena Ramos', 'Staff', 'Resolved Complaint', 'Resolution Engine', 'KIN-2026-000120', 'In Progress', 'Resolved', '127.0.0.1', '2026-04-23 16:00:00');
