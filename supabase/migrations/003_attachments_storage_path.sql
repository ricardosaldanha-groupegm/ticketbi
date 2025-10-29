-- Add storage_path to attachments for private bucket signed URLs
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS storage_path TEXT;

