-- Add description column to classes table

ALTER TABLE classes 
ADD COLUMN description TEXT DEFAULT NULL AFTER section;
