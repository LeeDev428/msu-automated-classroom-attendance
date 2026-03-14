-- Migration: Add middle_initial column to students table
-- Run this in HeidiSQL or phpMyAdmin

ALTER TABLE students 
ADD COLUMN middle_initial VARCHAR(10) NULL AFTER first_name;

-- Verify the change
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS 
-- WHERE TABLE_SCHEMA = 'msu_attendance_db' AND TABLE_NAME = 'students';
