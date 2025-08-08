-- Add metadata column to notifications to satisfy triggers inserting JSON payloads
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure column is writable under existing RLS policies (no policy changes here)
-- Optional: comment for documentation
COMMENT ON COLUMN public.notifications.metadata IS 'Arbitrary JSON metadata for notification context (e.g., sender_user_id, room_id).';