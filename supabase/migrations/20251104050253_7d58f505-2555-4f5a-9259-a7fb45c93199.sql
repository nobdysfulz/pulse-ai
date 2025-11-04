-- Add missing preference columns to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS coaching_style text DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS activity_mode text DEFAULT 'get_moving',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS daily_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_reports boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS market_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;