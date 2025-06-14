/*
  # Enhanced user-fonts storage bucket configuration

  1. Storage Configuration
    - Create or update user-fonts bucket with proper MIME types
    - Set 5MB file size limit
    - Configure security settings

  2. Security Policies
    - Users can upload fonts to their own folder
    - Users can read their own font files
    - Users can delete their own font files
    - Users can update their own font files

  3. MIME Type Support
    - Support all standard font formats (TTF, OTF, WOFF, WOFF2)
    - Include legacy MIME types for compatibility
    - Allow octet-stream for binary uploads
*/

-- Create or update the user-fonts storage bucket with enhanced configuration
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
-- Remove any columns that might not exist in older Supabase versions
UPDATE storage.buckets 
SET 
  public = false
WHERE id = 'user-fonts';