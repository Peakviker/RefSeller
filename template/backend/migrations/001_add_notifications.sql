-- Migration: Add Telegram Push Notifications System
-- Feature: 001-telegram-push-notifications
-- Date: 2025-12-10

-- Create notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'referral_registered', 'referral_purchase', 'income_credited')),
    content JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
    telegram_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    purchase_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    referral_registered_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    referral_purchase_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    income_credited_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification_queue table
CREATE TABLE notification_queue (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    job_id VARCHAR(255) UNIQUE,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
    scheduled_for TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0 CHECK (attempts <= 3),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Extend users table (use ALTER TABLE IF EXISTS for safety)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS bot_blocked BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS bot_blocked_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMP;
    ELSE
        RAISE NOTICE 'Table users does not exist, skipping ALTER TABLE';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status IN ('pending', 'sending');
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE UNIQUE INDEX idx_preferences_user ON notification_preferences(user_id);

CREATE INDEX idx_queue_scheduled ON notification_queue(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX idx_queue_notification ON notification_queue(notification_id);
CREATE UNIQUE INDEX idx_queue_job ON notification_queue(job_id);

-- Create index on users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_bot_blocked ON users(bot_blocked) WHERE bot_blocked = TRUE;
    END IF;
END $$;

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ language 'plpgsql';

-- Apply triggers to notification tables
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_add_notifications completed successfully';
END $$;





