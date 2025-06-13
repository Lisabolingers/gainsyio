/*
  # Templates Schema

  1. New Tables
    - `listing_templates`
      - Template for product listings
    - `mockup_templates`
      - Mockup designs with text/design areas
    - `auto_text_templates`
      - Auto text-to-image templates with font settings
    - `update_templates`
      - Predefined structures for product descriptions
    - `store_images`
      - Standard store visuals

  2. Security
    - Enable RLS on all template tables
    - Add policies for users to manage their own templates
*/

-- Listing Templates
CREATE TABLE IF NOT EXISTS listing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  title_template text DEFAULT '',
  description_template text DEFAULT '',
  tags_template text[] DEFAULT '{}',
  price_template decimal(10,2),
  category text DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mockup Templates
CREATE TABLE IF NOT EXISTS mockup_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  design_areas jsonb DEFAULT '[]', -- Array of {x, y, width, height, type}
  text_areas jsonb DEFAULT '[]',   -- Array of {x, y, width, height, font_size, font_family}
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto Text to Image Templates
CREATE TABLE IF NOT EXISTS auto_text_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  font_family text DEFAULT 'Arial',
  font_size integer DEFAULT 24,
  font_weight text DEFAULT 'normal',
  text_color text DEFAULT '#000000',
  background_color text DEFAULT '#ffffff',
  style_settings jsonb DEFAULT '{}', -- Additional style configurations
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update Templates
CREATE TABLE IF NOT EXISTS update_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type text DEFAULT 'description' CHECK (template_type IN ('description', 'variation', 'pricing')),
  content_template text DEFAULT '',
  variables jsonb DEFAULT '{}', -- Template variables and their default values
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Store Images
CREATE TABLE IF NOT EXISTS store_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  image_type text DEFAULT 'general' CHECK (image_type IN ('logo', 'banner', 'background', 'watermark', 'general')),
  auto_apply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listing_templates_user_id ON listing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_mockup_templates_user_id ON mockup_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_text_templates_user_id ON auto_text_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_update_templates_user_id ON update_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_store_images_user_id ON store_images(user_id);
CREATE INDEX IF NOT EXISTS idx_store_images_store_id ON store_images(store_id);

-- Enable RLS
ALTER TABLE listing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_text_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_templates
CREATE POLICY "Users can manage own listing templates"
  ON listing_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for mockup_templates
CREATE POLICY "Users can manage own mockup templates"
  ON mockup_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for auto_text_templates
CREATE POLICY "Users can manage own auto text templates"
  ON auto_text_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for update_templates
CREATE POLICY "Users can manage own update templates"
  ON update_templates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for store_images
CREATE POLICY "Users can manage own store images"
  ON store_images FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);