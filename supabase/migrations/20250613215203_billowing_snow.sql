/*
  # Enhanced User Fonts Storage Configuration

  1. Storage Bucket Updates
    - Update user-fonts bucket with enhanced MIME type support
    - Configure proper file size limits
    - Set security configurations

  2. Storage Policies
    - Recreate storage policies for font file management
    - Ensure users can only access their own fonts
    - Enable proper read/write permissions

  3. Security
    - Maintain private bucket access
    - User-specific file access only
    - Proper authentication checks
*/

-- Update the user-fonts storage bucket with enhanced configuration
-- Use ON CONFLICT to handle existing bucket
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
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

-- CRITICAL: Allow users to read their own font files
-- This is essential for font loading in browsers
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
UPDATE storage.buckets 
SET 
  public = false,
  file_size_limit = 5242880
WHERE id = 'user-fonts';

-- Add a function to help with font URL generation
CREATE OR REPLACE FUNCTION get_font_public_url(font_path TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This function helps generate proper URLs for font files
  -- The actual URL generation will be handled by the Supabase client
  RETURN font_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_font_public_url(TEXT) TO authenticated;