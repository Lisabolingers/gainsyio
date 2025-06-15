/*
  # Font Storage Bucket Configuration

  1. Storage Setup
    - Create or update user-fonts bucket with proper configuration
    - Set file size limits and allowed MIME types for font files
    - Configure security policies for authenticated users

  2. Security Policies
    - Users can upload, read, update, and delete their own font files
    - Bucket access is restricted to authenticated users only
    - Files are organized by user ID for proper isolation

  3. Configuration
    - 5MB file size limit for font uploads
    - Support for TTF, OTF, WOFF, WOFF2 font formats
    - Private bucket for security (no public access)
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
-- Note: CORS configuration is handled at the Supabase project level, not in SQL
UPDATE storage.buckets 
SET 
  public = false
WHERE id = 'user-fonts';