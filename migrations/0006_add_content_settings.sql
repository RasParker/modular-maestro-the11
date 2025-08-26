
-- Add content settings columns to users table
ALTER TABLE users 
ADD COLUMN auto_post_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN watermark_enabled BOOLEAN NOT NULL DEFAULT TRUE;
