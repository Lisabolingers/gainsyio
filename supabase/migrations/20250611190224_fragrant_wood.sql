/*
  # Stores Schema

  1. New Tables
    - `stores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `platform` (text - etsy, shopify, amazon, ebay, wallart)
      - `store_name` (text)
      - `store_url` (text)
      - `api_credentials` (jsonb - encrypted store credentials)
      - `is_active` (boolean)
      - `last_sync_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `stores` table
    - Add policies for users to manage their own stores
*/

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('etsy', 'shopify', 'amazon', 'ebay', 'wallart')),
  store_name text NOT NULL,
  store_url text,
  api_credentials jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, platform, store_name)
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Users can read their own stores
CREATE POLICY "Users can read own stores"
  ON stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own stores
CREATE POLICY "Users can insert own stores"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stores
CREATE POLICY "Users can update own stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own stores
CREATE POLICY "Users can delete own stores"
  ON stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);