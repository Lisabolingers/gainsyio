/*
  # Add design type and product category to mockup templates

  1. New Columns
    - `design_type` (text) - Design type: black, white, color
    - `product_category` (text) - Product category: t-shirt, mug, etc.
  
  2. Data Updates
    - Update existing records with default values before adding constraints
  
  3. Constraints
    - Add check constraints for valid values
    - Add indexes for better performance
*/

-- Add design_type column to mockup_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'design_type'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN design_type text;
  END IF;
END $$;

-- Add product_category column to mockup_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'product_category'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN product_category text;
  END IF;
END $$;

-- CRITICAL: Update ALL existing records with valid default values FIRST
UPDATE mockup_templates 
SET design_type = 'black' 
WHERE design_type IS NULL OR design_type = '';

UPDATE mockup_templates 
SET product_category = 't-shirt' 
WHERE product_category IS NULL OR product_category = '';

-- Update any invalid existing values to valid ones
UPDATE mockup_templates 
SET design_type = 'black' 
WHERE design_type NOT IN ('black', 'white', 'color');

UPDATE mockup_templates 
SET product_category = 'other' 
WHERE product_category NOT IN (
  't-shirt', 'sweatshirt', 'hoodie', 'mug', 'poster', 'canvas', 
  'pillow', 'phone-case', 'tote-bag', 'sticker', 'other'
);

-- Now set default values for the columns
ALTER TABLE mockup_templates 
ALTER COLUMN design_type SET DEFAULT 'black';

ALTER TABLE mockup_templates 
ALTER COLUMN product_category SET DEFAULT 't-shirt';

-- Make columns NOT NULL after setting defaults
ALTER TABLE mockup_templates 
ALTER COLUMN design_type SET NOT NULL;

ALTER TABLE mockup_templates 
ALTER COLUMN product_category SET NOT NULL;

-- Add check constraints AFTER data is cleaned
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mockup_templates_design_type 
ON mockup_templates(design_type);

CREATE INDEX IF NOT EXISTS idx_mockup_templates_product_category 
ON mockup_templates(product_category);

CREATE INDEX IF NOT EXISTS idx_mockup_templates_design_type_category 
ON mockup_templates(design_type, product_category);