
-- Add missing tables for conversations, messages, notifications, creator_payout_settings, etc.

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    participant_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(participant_1_id, participant_2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create creator_payout_settings table
CREATE TABLE IF NOT EXISTS creator_payout_settings (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    account_name VARCHAR(255),
    routing_number VARCHAR(50),
    mobile_money_provider VARCHAR(50),
    mobile_money_number VARCHAR(20),
    minimum_payout_amount DECIMAL(10,2) DEFAULT 50.00,
    auto_payout_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add action_url to notifications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
        ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500);
    END IF;
    
    -- Add actor_id to notifications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
        ALTER TABLE notifications ADD COLUMN actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add entity_type to notifications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'entity_type') THEN
        ALTER TABLE notifications ADD COLUMN entity_type VARCHAR(50);
    END IF;
    
    -- Add entity_id to notifications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'entity_id') THEN
        ALTER TABLE notifications ADD COLUMN entity_id INTEGER;
    END IF;
    
    -- Add metadata to notifications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, updated_at)
VALUES ('commission_rate', '0.05', NOW())
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_creator_payout_settings_creator ON creator_payout_settings(creator_id);
