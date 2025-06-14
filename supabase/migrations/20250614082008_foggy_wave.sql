/*
  # Add folder_path column to store_images table

  1. Changes
    - Add `folder_path` column to `store_images` table
    - Column allows NULL values for backward compatibility
    - Default value is NULL

  2. Notes
    - This column will be used to organize images into folders/categories
    - Existing records will have NULL folder_path values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_images' AND column_name = 'folder_path'
  ) THEN
    ALTER TABLE public.store_images ADD COLUMN folder_path TEXT;
  END IF;
END $$;