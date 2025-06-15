/*
  # Create design files table

  1. New Tables
    - `design_files` - Stores user-uploaded design files
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `file_name` (text)
      - `file_url` (text)
      - `file_type` (text) - 'black', 'white', or 'color'
      - `file_size` (integer)
      - `status` (text) - 'active', 'used', or 'expired'
      - `expires_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `design_files` table
    - Add policy for authenticated users to manage their own design files
  
  3. Indexes
    - Add index on `user_id` for faster queries
    - Add index on `file_type` for filtering
    - Add index on `status` for filtering
    - Add index on `expires_at` for cleanup operations
*/

-- Create design_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS design_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('black', 'white', 'color')),
  file_size INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own design files
CREATE POLICY "Users can manage own design files"
  ON design_files
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_design_files_user_id ON design_files(user_id);
CREATE INDEX IF NOT EXISTS idx_design_files_file_type ON design_files(file_type);
CREATE INDEX IF NOT EXISTS idx_design_files_status ON design_files(status);
CREATE INDEX IF NOT EXISTS idx_design_files_expires_at ON design_files(expires_at);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_design_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_design_files_updated_at
BEFORE UPDATE ON design_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired design files
CREATE OR REPLACE FUNCTION cleanup_expired_design_files()
RETURNS void AS $$
BEGIN
  UPDATE design_files SET status = 'expired' WHERE expires_at < now() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the cleanup function every hour
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you'll need to implement this cleanup in your application logic
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    EXECUTE 'SELECT cron.schedule(''cleanup-design-files'', ''0 * * * *'', ''SELECT cleanup_expired_design_files()'')';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If pg_cron is not available, we'll skip this step
  RAISE NOTICE 'pg_cron extension not available. Skipping cron job creation.';
END $$;