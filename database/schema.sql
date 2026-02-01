-- MSU Automated Classroom Attendance System
-- Database Schema for MySQL
-- Use this file with HeidiSQL or phpMyAdmin in Laragon

-- Create database
CREATE DATABASE IF NOT EXISTS msu_attendance_db;
USE msu_attendance_db;

-- ============================================
-- Users Table (Instructors & Admins)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('instructor', 'admin') NOT NULL DEFAULT 'instructor',
    department VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Students Table
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    program VARCHAR(100),
    year_level INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Classes Table
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    class_name VARCHAR(150) NOT NULL,
    description TEXT,
    schedule VARCHAR(100),
    room VARCHAR(50),
    instructor_id INT NOT NULL,
    semester VARCHAR(50),
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id),
    INDEX idx_class_code (class_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Enrollments Table (Student-Class Relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, class_id),
    INDEX idx_student (student_id),
    INDEX idx_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Attendance Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
    notes TEXT,
    qr_code_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_class (class_id),
    INDEX idx_date (check_in_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- QR Codes Table (Generated QR codes for attendance)
-- ============================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    generated_by INT NOT NULL,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_qr_code (qr_code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Attendance Reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    report_type ENUM('daily', 'weekly', 'monthly', 'semester') NOT NULL,
    report_date DATE NOT NULL,
    total_students INT,
    present_count INT,
    absent_count INT,
    late_count INT,
    attendance_rate DECIMAL(5,2),
    generated_by INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Sample Data
-- ============================================

-- Sample Instructor (Password: instructor123)
INSERT INTO users (name, email, password, role, department, employee_id, phone) VALUES
('Prof. Rodriguez', 'rodriguez@msuiit.edu.ph', '$2y$10$YourHashedPasswordHere', 'instructor', 'Computer Science', 'MSU-2024-001', '+63 912 345 6789'),
('Dr. Santos', 'santos@msuiit.edu.ph', '$2y$10$YourHashedPasswordHere', 'instructor', 'Information Technology', 'MSU-2024-002', '+63 912 345 6788');

-- Sample Students
INSERT INTO students (student_id, first_name, last_name, email, phone, program, year_level) VALUES
('2024-001', 'Juan', 'Dela Cruz', 'juan.delacruz@student.msuiit.edu.ph', '+63 912 111 1111', 'BS Computer Science', 3),
('2024-002', 'Maria', 'Santos', 'maria.santos@student.msuiit.edu.ph', '+63 912 222 2222', 'BS Computer Science', 3),
('2024-003', 'Pedro', 'Reyes', 'pedro.reyes@student.msuiit.edu.ph', '+63 912 333 3333', 'BS Information Technology', 2),
('2024-004', 'Ana', 'Garcia', 'ana.garcia@student.msuiit.edu.ph', '+63 912 444 4444', 'BS Computer Science', 3),
('2024-005', 'Carlos', 'Mendoza', 'carlos.mendoza@student.msuiit.edu.ph', '+63 912 555 5555', 'BS Information Technology', 2);

-- Sample Classes
INSERT INTO classes (class_code, class_name, description, schedule, room, instructor_id, semester, academic_year) VALUES
('CS101', 'Introduction to Computer Science', 'Fundamentals of computing and programming', 'Mon, Wed, Fri - 8:00 AM', 'Room 301', 1, '1st Semester', '2024-2025'),
('CS102', 'Data Structures and Algorithms', 'Study of data structures and algorithm design', 'Tue, Thu - 10:00 AM', 'Room 302', 1, '1st Semester', '2024-2025'),
('CS201', 'Database Management Systems', 'Introduction to database design and SQL', 'Mon, Wed - 2:00 PM', 'Lab 201', 1, '1st Semester', '2024-2025'),
('CS301', 'Software Engineering', 'Software development methodologies and practices', 'Tue, Thu - 3:30 PM', 'Room 401', 1, '1st Semester', '2024-2025');

-- Sample Enrollments
INSERT INTO enrollments (student_id, class_id, status) VALUES
(1, 1, 'active'),
(1, 2, 'active'),
(2, 1, 'active'),
(2, 3, 'active'),
(3, 2, 'active'),
(3, 3, 'active'),
(4, 1, 'active'),
(4, 4, 'active'),
(5, 2, 'active'),
(5, 4, 'active');

-- Sample Attendance Records
INSERT INTO attendance (student_id, class_id, check_in_time, status) VALUES
(1, 1, '2024-12-15 08:05:00', 'present'),
(2, 1, '2024-12-15 08:10:00', 'present'),
(4, 1, '2024-12-15 08:03:00', 'present'),
(1, 2, '2024-12-15 10:05:00', 'present'),
(3, 2, '2024-12-15 10:15:00', 'late'),
(5, 2, '2024-12-15 10:07:00', 'present');

-- ============================================
-- Useful Views for Reports
-- ============================================

-- View: Current Attendance Summary by Class
CREATE OR REPLACE VIEW view_class_attendance_summary AS
SELECT 
    c.id AS class_id,
    c.class_code,
    c.class_name,
    COUNT(DISTINCT e.student_id) AS total_enrolled,
    COUNT(DISTINCT CASE WHEN a.status = 'present' AND DATE(a.check_in_time) = CURDATE() THEN a.student_id END) AS present_today,
    COUNT(DISTINCT CASE WHEN a.status = 'absent' AND DATE(a.check_in_time) = CURDATE() THEN a.student_id END) AS absent_today,
    ROUND((COUNT(DISTINCT CASE WHEN a.status = 'present' AND DATE(a.check_in_time) = CURDATE() THEN a.student_id END) / 
           NULLIF(COUNT(DISTINCT e.student_id), 0)) * 100, 2) AS attendance_rate
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
LEFT JOIN attendance a ON e.student_id = a.student_id AND e.class_id = a.class_id
GROUP BY c.id, c.class_code, c.class_name;

-- View: Student Attendance History
CREATE OR REPLACE VIEW view_student_attendance_history AS
SELECT 
    s.id AS student_id,
    s.student_id AS student_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.class_code,
    c.class_name,
    a.check_in_time,
    a.status,
    a.notes
FROM students s
INNER JOIN attendance a ON s.id = a.student_id
INNER JOIN classes c ON a.class_id = c.id
ORDER BY a.check_in_time DESC;

-- ============================================
-- Stored Procedures
-- ============================================

-- Procedure: Calculate Attendance Rate for a Class
DELIMITER //
CREATE PROCEDURE sp_calculate_class_attendance_rate(
    IN p_class_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_attendance_rate DECIMAL(5,2)
)
BEGIN
    DECLARE total_expected INT;
    DECLARE total_present INT;
    
    -- Calculate total expected attendance (students * days)
    SELECT COUNT(DISTINCT e.student_id) INTO total_expected
    FROM enrollments e
    WHERE e.class_id = p_class_id AND e.status = 'active';
    
    -- Calculate total present
    SELECT COUNT(*) INTO total_present
    FROM attendance a
    WHERE a.class_id = p_class_id
    AND DATE(a.check_in_time) BETWEEN p_start_date AND p_end_date
    AND a.status IN ('present', 'late');
    
    -- Calculate rate
    IF total_expected > 0 THEN
        SET p_attendance_rate = (total_present / total_expected) * 100;
    ELSE
        SET p_attendance_rate = 0;
    END IF;
END //
DELIMITER ;

-- ============================================
-- Triggers
-- ============================================

-- Trigger: Update QR code usage count when used for attendance
DELIMITER //
CREATE TRIGGER trg_update_qr_usage
AFTER INSERT ON attendance
FOR EACH ROW
BEGIN
    IF NEW.qr_code_id IS NOT NULL THEN
        UPDATE qr_codes 
        SET usage_count = usage_count + 1
        WHERE qr_code = NEW.qr_code_id;
    END IF;
END //
DELIMITER ;

-- ============================================
-- Indexes for Performance Optimization
-- ============================================

-- Additional composite indexes
CREATE INDEX idx_attendance_class_date ON attendance(class_id, check_in_time);
CREATE INDEX idx_enrollment_status ON enrollments(status);
CREATE INDEX idx_qr_active_class ON qr_codes(is_active, class_id);

-- ============================================
-- Database Setup Complete
-- ============================================
-- Note: Update the hashed passwords in the INSERT statements above
-- You can generate password hashes using: password_hash('password', PASSWORD_BCRYPT)
