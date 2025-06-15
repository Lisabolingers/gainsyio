/*
  # Mockup Templates Folder System

  1. New Features
    - Add folder_path column to mockup_templates
    - Add folder_name column for display purposes
    - Remove rigid product_category constraint
    - Keep design_type for black/white/color designs
    - Add indexes for folder-based queries

  2. Benefits
    - Users can create custom folders like "T-Shirts Summer", "Mugs Holiday", etc.
    - Multiple templates for same product type in different folders
    - Better organization and categorization
    - Flexible structure for any product type
*/

-- Add folder support to mockup_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'folder_path'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN folder_path text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'folder_name'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN folder_name text;
  END IF;
END $$;

-- Update existing templates to have a default folder
UPDATE mockup_templates 
SET 
  folder_path = 'default',
  folder_name = 'Default Templates'
WHERE folder_path IS NULL;

-- Remove the rigid product_category constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mockup_templates_product_category_check'
  ) THEN
    ALTER TABLE mockup_templates 
    DROP CONSTRAINT mockup_templates_product_category_check;
  END IF;
END $$;

-- Make product_category more flexible (no constraint, just a text field)
-- Users can enter any product type they want
UPDATE mockup_templates 
SET product_category = 'General' 
WHERE product_category IS NULL OR product_category = '';

-- Set default values
ALTER TABLE mockup_templates 
ALTER COLUMN folder_path SET DEFAULT 'default';

ALTER TABLE mockup_templates 
ALTER COLUMN folder_name SET DEFAULT 'Default Templates';

-- Add indexes for folder-based queries
CREATE INDEX IF NOT EXISTS idx_mockup_templates_folder_path 
ON mockup_templates(folder_path);

CREATE INDEX IF NOT EXISTS idx_mockup_templates_folder_name 
ON mockup_templates(folder_name);

CREATE INDEX IF NOT EXISTS idx_mockup_templates_user_folder 
ON mockup_templates(user_id, folder_path);

-- Add index for design type and folder combination
CREATE INDEX IF NOT EXISTS idx_mockup_templates_design_folder 
ON mockup_templates(design_type, folder_path);

-- Create a view for folder statistics
CREATE OR REPLACE VIEW mockup_template_folders AS
SELECT 
  user_id,
  folder_path,
  folder_name,
  COUNT(*) as template_count,
  COUNT(CASE WHEN design_type = 'black' THEN 1 END) as black_designs,
  COUNT(CASE WHEN design_type = 'white' THEN 1 END) as white_designs,
  COUNT(CASE WHEN design_type = 'color' THEN 1 END) as color_designs,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM mockup_templates
WHERE folder_path IS NOT NULL
GROUP BY user_id, folder_path, folder_name
ORDER BY folder_name;