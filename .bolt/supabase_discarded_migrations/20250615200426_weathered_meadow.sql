/*
  # Create temporary files table

  1. New Tables
    - `temporary_files` - Stores temporary files with auto-expiration
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `expires_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `temporary_files` table
    - Add policy for authenticated users to manage their own temporary files
  
  3. Indexes
    - Add index on `user_id` for faster queries
    - Add index on `expires_at` for cleanup operations
*/

-- Create temporary_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS temporary_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  file_size INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE temporary_files ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own temporary files
CREATE POLICY "Users can manage own temporary files"
  ON temporary_files
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temporary_files_user_id ON temporary_files(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_files_expires_at ON temporary_files(expires_at);

-- Create a function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_files()
RETURNS void AS $$
BEGIN
  DELETE FROM temporary_files WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the cleanup function every 5 minutes
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you'll need to implement this cleanup in your application logic
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    EXECUTE 'SELECT cron.schedule(''cleanup-temp-files'', ''*/5 * * * *'', ''SELECT cleanup_expired_temporary_files()'')';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If pg_cron is not available, we'll skip this step
  RAISE NOTICE 'pg_cron extension not available. Skipping cron job creation.';
END $$;