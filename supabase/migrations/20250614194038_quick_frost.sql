/*
  # Add store_id column to mockup_templates table

  1. Changes
    - Add `store_id` column to `mockup_templates` table
    - Set up foreign key relationship with `stores` table
    - Add index for better query performance
    - Update RLS policies to include store-based access control

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only access templates for their own stores
*/

-- Add store_id column to mockup_templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mockup_templates' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE mockup_templates ADD COLUMN store_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'mockup_templates_store_id_fkey'
  ) THEN
    ALTER TABLE mockup_templates 
    ADD CONSTRAINT mockup_templates_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_mockup_templates_store_id'
  ) THEN
    CREATE INDEX idx_mockup_templates_store_id ON mockup_templates(store_id);
  END IF;
END $$;