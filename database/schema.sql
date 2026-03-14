-- ============================================================
-- MSU Automated Classroom Attendance System
-- Complete & Consolidated DDL  (includes all migrations 001-007)
-- Paste the entire file into HeidiSQL and click "Run SQL"
-- ============================================================

DROP DATABASE IF EXISTS msu_attendance_db;
CREATE DATABASE msu_attendance_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE msu_attendance_db;

-- ============================================================
-- TABLE: users  (Instructors & Admins)
-- ============================================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    role            ENUM('instructor','admin') NOT NULL DEFAULT 'instructor',
    department      VARCHAR(100),
    employee_id     VARCHAR(50)     UNIQUE,
    phone           VARCHAR(20),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(50)     NOT NULL UNIQUE,   -- e.g. 2025-001
    first_name      VARCHAR(50)     NOT NULL,
    middle_initial  VARCHAR(10)     NULL,               -- migration 007
    last_name       VARCHAR(50)     NOT NULL,
    email           VARCHAR(100)    UNIQUE,
    parent_email    VARCHAR(100)    NULL,
    parent_name     VARCHAR(100)    NULL,
    phone           VARCHAR(20),
    program         VARCHAR(100),
    year_level      INT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_email      (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: classes
-- ============================================================
CREATE TABLE classes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id   INT             NOT NULL,
    class_name      VARCHAR(150)    NOT NULL,
    class_code      VARCHAR(20)     NOT NULL UNIQUE,
    section         VARCHAR(50),
    description     TEXT,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    days            VARCHAR(100)    NOT NULL,
    room            VARCHAR(50),
    semester        VARCHAR(50),
    academic_year   VARCHAR(20),
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,  -- migration 006
    notify_parents  TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_instructor (instructor_id),
    INDEX idx_class_code (class_code),
    INDEX idx_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: enrollments  (Student <-> Class relationship)
-- ============================================================
CREATE TABLE enrollments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT             NOT NULL,
    class_id        INT             NOT NULL,
    enrolled_date   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('active','dropped','completed') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, class_id),
    INDEX idx_student (student_id),
    INDEX idx_class   (class_id),
    INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: attendance
-- ============================================================
CREATE TABLE attendance (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT             NOT NULL,
    class_id        INT             NOT NULL,
    check_in_time   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    check_out_time  TIMESTAMP       NULL,
    status          ENUM('present','absent','late','excused') DEFAULT 'present',
    notes           TEXT,
    qr_code_id      VARCHAR(100),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
    INDEX idx_student    (student_id),
    INDEX idx_class      (class_id),
    INDEX idx_checkin    (check_in_time),
    INDEX idx_status     (status),
    INDEX idx_class_date (class_id, check_in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: qr_codes  (optional - future use)
-- ============================================================
CREATE TABLE qr_codes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    class_id        INT             NOT NULL,
    qr_code         VARCHAR(191)    NOT NULL UNIQUE,
    generated_by    INT             NOT NULL,
    valid_from      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    valid_until     TIMESTAMP       NULL,
    is_active       TINYINT(1)      DEFAULT 1,
    usage_count     INT             DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id)     REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id)   ON DELETE CASCADE,
    INDEX idx_class   (class_id),
    INDEX idx_qr_code (qr_code),
    INDEX idx_active  (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEW: class attendance summary (today)
-- ============================================================
CREATE OR REPLACE VIEW view_class_attendance_summary AS
SELECT
    c.id                                                            AS class_id,
    c.class_code,
    c.class_name,
    COUNT(DISTINCT e.student_id)                                    AS total_enrolled,
    COUNT(DISTINCT CASE
        WHEN a.status = 'present' AND DATE(a.check_in_time) = CURDATE()
        THEN a.student_id END)                                      AS present_today,
    COUNT(DISTINCT CASE
        WHEN a.status = 'absent' AND DATE(a.check_in_time) = CURDATE()
        THEN a.student_id END)                                      AS absent_today,
    ROUND(
        COUNT(DISTINCT CASE
            WHEN a.status = 'present' AND DATE(a.check_in_time) = CURDATE()
            THEN a.student_id END)
        / NULLIF(COUNT(DISTINCT e.student_id), 0) * 100
    , 2)                                                            AS attendance_rate
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
LEFT JOIN attendance  a ON e.student_id = a.student_id AND e.class_id = a.class_id
GROUP BY c.id, c.class_code, c.class_name;

-- ============================================================
-- VIEW: per-student attendance history
-- ============================================================
CREATE OR REPLACE VIEW view_student_attendance_history AS
SELECT
    s.id                                                  AS student_db_id,
    s.student_id                                          AS student_number,
    CONCAT(s.first_name,
           CASE WHEN s.middle_initial IS NOT NULL
                THEN CONCAT(' ', s.middle_initial, '. ')
                ELSE ' ' END,
           s.last_name)                                   AS student_name,
    c.class_code,
    c.class_name,
    a.check_in_time,
    a.status,
    a.notes
FROM students  s
JOIN attendance a ON s.id = a.student_id
JOIN classes    c ON a.class_id = c.id
ORDER BY a.check_in_time DESC;

-- ============================================================
-- SAMPLE DATA  (delete this block if you want a clean start)
-- NOTE: Instructor passwords below are placeholder hashes.
--       Register via the app to get a real bcrypt hash instead.
-- ============================================================

INSERT INTO users (name, email, password, role, department, employee_id, phone) VALUES
('Prof. Rodriguez', 'rodriguez@msuiit.edu.ph',
 '$2y$10$placeholderHashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
 'instructor', 'Computer Science', 'MSU-2024-001', '+63 912 345 6789'),
('Dr. Santos', 'santos@msuiit.edu.ph',
 '$2y$10$placeholderHashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
 'instructor', 'Information Technology', 'MSU-2024-002', '+63 912 345 6788');

INSERT INTO students (student_id, first_name, middle_initial, last_name, email, parent_email, parent_name, phone, program, year_level) VALUES
('2024-001', 'Juan',   'D',  'Dela Cruz', 'juan.delacruz@student.msuiit.edu.ph',  'parent.juan@example.com',   'Juan Parent',   '+63 912 111 1111', 'BS Computer Science',       3),
('2024-002', 'Maria',  'A',  'Santos',    'maria.santos@student.msuiit.edu.ph',   'parent.maria@example.com',  'Maria Parent',  '+63 912 222 2222', 'BS Computer Science',       3),
('2024-003', 'Pedro',  NULL, 'Reyes',     'pedro.reyes@student.msuiit.edu.ph',    'parent.pedro@example.com',  'Pedro Parent',  '+63 912 333 3333', 'BS Information Technology', 2),
('2024-004', 'Ana',    'B',  'Garcia',    'ana.garcia@student.msuiit.edu.ph',     'parent.ana@example.com',    'Ana Parent',    '+63 912 444 4444', 'BS Computer Science',       3),
('2024-005', 'Carlos', NULL, 'Mendoza',   'carlos.mendoza@student.msuiit.edu.ph', 'parent.carlos@example.com', 'Carlos Parent', '+63 912 555 5555', 'BS Information Technology', 2);

INSERT INTO classes (instructor_id, class_name, class_code, section, description, start_time, end_time, days, room, semester, academic_year, is_active) VALUES
(1, 'Introduction to Computer Science', 'CS101', 'Section A', 'Fundamentals of computing',         '08:00:00', '10:00:00', 'Mon, Wed, Fri', 'Room 301', '1st Semester', '2024-2025', 1),
(1, 'Data Structures and Algorithms',   'CS102', 'Section B', 'Data structures & algorithm design', '10:00:00', '12:00:00', 'Tue, Thu',      'Room 302', '1st Semester', '2024-2025', 1),
(1, 'Database Management Systems',      'CS201', 'Section A', 'Database design and SQL',            '14:00:00', '16:00:00', 'Mon, Wed',      'Lab 201',  '1st Semester', '2024-2025', 1),
(1, 'Software Engineering',             'CS301', 'Section C', 'SDLC methodologies',                 '15:30:00', '17:30:00', 'Tue, Thu',      'Room 401', '1st Semester', '2024-2025', 1);

INSERT INTO enrollments (student_id, class_id, status) VALUES
(1,1,'active'),(1,2,'active'),
(2,1,'active'),(2,3,'active'),
(3,2,'active'),(3,3,'active'),
(4,1,'active'),(4,4,'active'),
(5,2,'active'),(5,4,'active');

INSERT INTO attendance (student_id, class_id, check_in_time, status) VALUES
(1,1,'2025-01-15 08:05:00','present'),
(2,1,'2025-01-15 08:10:00','present'),
(4,1,'2025-01-15 08:03:00','present'),
(1,2,'2025-01-15 10:05:00','present'),
(3,2,'2025-01-15 10:15:00','late'),
(5,2,'2025-01-15 10:07:00','present');

-- ============================================================
-- Done. Register your instructor account via the app to get a
-- proper bcrypt password hash stored in the users table.
-- ============================================================
