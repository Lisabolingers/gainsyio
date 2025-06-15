/*
  # Enhanced Mockup Templates with Design Types and Product Categories

  1. Schema Updates
    - Add `design_type` column to mockup_templates (black/white/color)
    - Add `product_category` column to mockup_templates (t-shirt, mug, etc.)
    - Update existing templates with default values

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Add design_type column to mockup_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'design_type'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN design_type text DEFAULT 'black';
  END IF;
END $$;

-- Add product_category column to mockup_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'product_category'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN product_category text DEFAULT 't-shirt';
  END IF;
END $$;

-- Add check constraints for design_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mockup_templates_design_type_check'
  ) THEN
    ALTER TABLE mockup_templates 
    ADD CONSTRAINT mockup_templates_design_type_check 
    CHECK (design_type IN ('black', 'white', 'color'));
  END IF;
END $$;

-- Add check constraints for product_category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mockup_templates_product_category_check'
  ) THEN
    ALTER TABLE mockup_templates 
    ADD CONSTRAINT mockup_templates_product_category_check 
    CHECK (product_category IN (
      't-shirt', 'sweatshirt', 'hoodie', 'mug', 'poster', 'canvas', 
      'pillow', 'phone-case', 'tote-bag', 'sticker', 'other'
    ));
  END IF;
END $$;

-- Update existing templates with default values if they are null
UPDATE mockup_templates 
SET design_type = 'black' 
WHERE design_type IS NULL;

UPDATE mockup_templates 
SET product_category = 't-shirt' 
WHERE product_category IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mockup_templates_design_type 
ON mockup_templates(design_type);

CREATE INDEX IF NOT EXISTS idx_mockup_templates_product_category 
ON mockup_templates(product_category);

CREATE INDEX IF NOT EXISTS idx_mockup_templates_design_type_category 
ON mockup_templates(design_type, product_category);