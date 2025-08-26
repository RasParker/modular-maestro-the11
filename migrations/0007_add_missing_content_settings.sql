
-- Add missing content settings columns to users table
DO $$ 
BEGIN
    -- Add auto_post_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'auto_post_enabled') THEN
        ALTER TABLE users ADD COLUMN auto_post_enabled BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add watermark_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'watermark_enabled') THEN
        ALTER TABLE users ADD COLUMN watermark_enabled BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;
