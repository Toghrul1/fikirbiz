-- Migration: Admin Approval System for Supabase PostgreSQL
-- Step 1: Add is_approved column with default false
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Set role column default to 'user'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Step 3: Approve existing users (admins & existing accounts) so they are not blocked
UPDATE users SET is_approved = TRUE WHERE is_approved IS FALSE OR is_approved IS NULL;
