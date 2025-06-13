/*
  # Fonts and Temporary Files Schema

  1. New Tables
    - `user_fonts`
      - Custom fonts uploaded by users
    - `temporary_files`
      - AI-generated files with 24h lifespan
    - `analytics_data`
      - Product analytics and performance metrics

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add cleanup function for temporary files
*/

-- User Fonts
CREATE TABLE IF NOT EXISTS user_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  font_name text NOT NULL,
  font_family text NOT NULL,
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  font_format text DEFAULT 'ttf' CHECK (font_format IN ('ttf', 'otf', 'woff', 'woff2')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, font_name)
);

-- Temporary Files (24h lifespan)
CREATE TABLE IF NOT EXISTS temporary_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT 'image',
  file_size integer DEFAULT 0,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

-- Analytics Data
CREATE TABLE IF NOT EXISTS analytics_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  favorites integer DEFAULT 0,
  sales integer DEFAULT 0,
  revenue decimal(10,2) DEFAULT 0,
  conversion_rate decimal(5,4) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(product_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_fonts_user_id ON user_fonts(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_files_user_id ON temporary_files(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_files_expires_at ON temporary_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_data_product_id ON analytics_data(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_date ON analytics_data(date DESC);

-- Enable RLS
ALTER TABLE user_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_fonts
CREATE POLICY "Users can manage own fonts"
  ON user_fonts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for temporary_files
CREATE POLICY "Users can manage own temporary files"
  ON temporary_files FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for analytics_data
CREATE POLICY "Users can read analytics for own products"
  ON analytics_data FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for own products"
  ON analytics_data FOR INSERT
  TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analytics for own products"
  ON analytics_data FOR UPDATE
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Function to clean up expired temporary files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
BEGIN
  DELETE FROM temporary_files 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_templates_updated_at
  BEFORE UPDATE ON listing_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mockup_templates_updated_at
  BEFORE UPDATE ON mockup_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_text_templates_updated_at
  BEFORE UPDATE ON auto_text_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_update_templates_updated_at
  BEFORE UPDATE ON update_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fonts_updated_at
  BEFORE UPDATE ON user_fonts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_data_updated_at
  BEFORE UPDATE ON analytics_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();