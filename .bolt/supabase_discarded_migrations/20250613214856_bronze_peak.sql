/*
  # Create user-fonts storage bucket with enhanced configuration

  1. Storage Setup
    - Create 'user-fonts' storage bucket with proper CORS settings
    - Configure bucket to be private but accessible to authenticated users
    - Set up appropriate file size and type restrictions
    - Add proper CORS headers for font loading

  2. Security Policies
    - Allow authenticated users to upload their own fonts
    - Allow users to read their own font files with proper headers
    - Allow users to delete their own font files
    - Restrict access to user's own files only

  3. File Management
    - Set up policies for secure file operations
    - Ensure users can only access their own font files
    - Add proper CORS headers for font loading in browsers
*/

-- Create the user-fonts storage bucket with enhanced configuration
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

-- Allow authenticated users to upload their own fonts
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