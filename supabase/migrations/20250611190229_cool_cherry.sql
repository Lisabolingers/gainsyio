/*
  # Products Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `store_id` (uuid, references stores)
      - `external_id` (text - platform specific product ID)
      - `title` (text)
      - `description` (text)
      - `price` (decimal)
      - `currency` (text)
      - `tags` (text array)
      - `images` (jsonb array)
      - `status` (text)
      - `views` (integer)
      - `favorites` (integer)
      - `sales_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `products` table
    - Add policies for users to manage products from their stores
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  external_id text,
  title text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  tags text[] DEFAULT '{}',
  images jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'sold')),
  views integer DEFAULT 0,
  favorites integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(store_id, external_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users can read products from their own stores
CREATE POLICY "Users can read own store products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Users can insert products to their own stores
CREATE POLICY "Users can insert own store products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Users can update products from their own stores
CREATE POLICY "Users can update own store products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Users can delete products from their own stores
CREATE POLICY "Users can delete own store products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );