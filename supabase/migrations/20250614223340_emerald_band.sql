/*
  # Font Storage Bucket Configuration

  1. Storage Setup
    - Create or update user-fonts bucket with proper configuration
    - Set file size limits and allowed MIME types for font files
    - Keep bucket private for security

  2. Security Policies
    - Users can upload fonts to their own folder
    - Users can read their own font files
    - Users can delete their own font files
    - Users can update their own font files

  3. Helper Functions
    - Font file organization utilities
*/

-- Create or update the user-fonts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-fonts',
  'user-fonts',
  false, -- Keep private for security
  5242880, -- 5MB limit
  ARRAY[
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/font-woff',
    'application/font-woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/octet-stream' -- Sometimes fonts are uploaded as binary
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own fonts" ON storage.objects;

-- Create policies for font file management
-- Users can upload fonts to their own folder (user_id/filename.ttf)
CREATE POLICY "Users can upload own fonts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own font files
CREATE POLICY "Users can read own fonts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own font files
CREATE POLICY "Users can delete own fonts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own font files (for metadata updates)
CREATE POLICY "Users can update own fonts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Helper function to organize font files by user
CREATE OR REPLACE FUNCTION generate_font_path(user_id uuid, font_name text, font_format text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a clean path: user_id/font_name.format
  RETURN user_id::text || '/' || 
         regexp_replace(font_name, '[^a-zA-Z0-9_-]', '_', 'g') || 
         '.' || font_format;
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION generate_font_path(uuid, text, text) TO authenticated;