/*
  # Add design_type column to mockup_templates

  1. Changes
    - Add `design_type` column to `mockup_templates` table
    - Set default value to 'standard' for existing records
    - Make column nullable to handle existing data gracefully

  2. Security
    - No RLS changes needed as existing policies cover all columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'design_type'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN design_type text DEFAULT 'standard';
  END IF;
END $$;