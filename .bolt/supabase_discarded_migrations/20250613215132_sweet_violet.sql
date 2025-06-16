/*
  # Enhanced User Fonts Storage Configuration

  1. Storage Bucket Updates
    - Update existing user-fonts bucket with enhanced configuration
    - Add proper MIME types for font files
    - Configure CORS for browser font loading

  2. Security Policies
    - Update existing policies or create if not exists
    - Ensure proper user isolation
    - Enable font file access with CORS support

  3. CORS Configuration
    - Essential for font loading in browsers
    - Proper headers for cross-origin requests
    - Cache optimization for font files
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

-- CRITICAL: Allow users to read their own font files with proper CORS headers
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

-- CRITICAL: Add CORS configuration for font loading
-- This is essential for fonts to work in browsers
UPDATE storage.buckets 
SET cors = ARRAY[
  '{
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "HEAD", "OPTIONS"],
    "allowedHeaders": ["*"],
    "exposedHeaders": ["Content-Length", "Content-Type", "Content-Disposition"],
    "maxAge": 86400
  }'::jsonb
]
WHERE id = 'user-fonts';

-- Ensure bucket has proper configuration for font serving
UPDATE storage.buckets 
SET 
  public = false,
  avif_autodetection = false,
  transform_enabled = false
WHERE id = 'user-fonts';