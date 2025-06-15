/*
  # Enhanced User Fonts Storage Configuration

  1. Storage Bucket Setup
    - Creates or updates 'user-fonts' bucket with proper configuration
    - Sets file size limit to 5MB
    - Configures allowed MIME types for font files
    - Keeps bucket private for security

  2. Security Policies
    - Users can upload fonts to their own folder
    - Users can read their own font files
    - Users can delete their own font files
    - Users can update their own font files
    - All policies use user ID folder structure for isolation

  3. Bucket Configuration
    - Disables public access for security
    - Disables unnecessary features like AVIF detection and transforms
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
-- Note: CORS configuration is handled at the Supabase project level, not in SQL
UPDATE storage.buckets 
SET 
  public = false,
  avif_autodetection = false
WHERE id = 'user-fonts';

-- Check if transform_enabled column exists before updating
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buckets' 
    AND column_name = 'transform_enabled'
    AND table_schema = 'storage'
  ) THEN
    UPDATE storage.buckets 
    SET transform_enabled = false
    WHERE id = 'user-fonts';
  END IF;
END $$;