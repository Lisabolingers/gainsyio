/*
  # User Fonts Storage Configuration

  1. Storage Setup
    - Create or update user-fonts bucket with proper configuration
    - Set file size limits and allowed MIME types for font files
    - Configure bucket as private for security

  2. Security Policies
    - Users can upload fonts to their own folder
    - Users can read their own font files
    - Users can delete their own font files
    - Users can update their own font files

  3. Configuration
    - 5MB file size limit per font
    - Support for TTF, OTF, WOFF, WOFF2 formats
    - Private bucket with authenticated access only
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
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own fonts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own fonts" ON storage.objects;

-- Create fresh policies for font file management
CREATE POLICY "Users can upload own fonts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own font files
CREATE POLICY "Users can read own fonts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own font files
CREATE POLICY "Users can delete own fonts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own font files (for metadata updates)
CREATE POLICY "Users can update own fonts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-fonts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure bucket has proper configuration for font serving
-- Note: CORS configuration is typically handled at the Supabase project level
-- or through the Supabase dashboard, not via SQL migrations
UPDATE storage.buckets 
SET 
  public = false
WHERE id = 'user-fonts';

-- Create a function to help with font file organization
CREATE OR REPLACE FUNCTION get_user_font_path(user_id uuid, filename text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a clean path for user fonts: user_id/filename
  RETURN user_id::text || '/' || filename;
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION get_user_font_path(uuid, text) TO authenticated;