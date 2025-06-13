/*
  # Create user-fonts storage bucket

  1. Storage Setup
    - Create 'user-fonts' storage bucket
    - Configure bucket to be private (not publicly accessible by default)
    - Set up appropriate file size and type restrictions

  2. Security Policies
    - Allow authenticated users to upload their own fonts
    - Allow users to read their own font files
    - Allow users to delete their own font files
    - Restrict access to user's own files only

  3. File Management
    - Set up policies for secure file operations
    - Ensure users can only access their own font files
*/

-- Create the user-fonts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-fonts',
  'user-fonts',
  false,
  5242880, -- 5MB limit
  ARRAY[
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/font-woff',
    'application/font-woff2',
    'application/x-font-ttf',
    'application/x-font-otf'
  ]
);

-- Allow authenticated users to upload their own fonts
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