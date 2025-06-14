/*
  # Add logo_area column to mockup_templates table

  1. Changes
    - Add `logo_area` column to `mockup_templates` table as JSONB type
    - This column will store logo area configuration data (position, size, rotation, opacity)
    - Column is nullable since not all templates may have logo areas

  2. Security
    - No RLS changes needed as existing policies cover all columns
*/

-- Add logo_area column to mockup_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'logo_area'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN logo_area jsonb DEFAULT NULL;
  END IF;
END $$;