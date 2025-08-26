
-- Add missing columns to users table that are preventing signup
DO $$ 
BEGIN
    -- Add profile_discoverable column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_discoverable') THEN
        ALTER TABLE users ADD COLUMN profile_discoverable BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Add activity_status_visible column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'activity_status_visible') THEN
        ALTER TABLE users ADD COLUMN activity_status_visible BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add is_online column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_online') THEN
        ALTER TABLE users ADD COLUMN is_online BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add last_seen column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_seen') THEN
        ALTER TABLE users ADD COLUMN last_seen TIMESTAMP;
    END IF;
END $$;
