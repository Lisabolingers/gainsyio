/*
  # Add AI Agent Tables

  1. New Tables
    - `ai_providers` - Stores API keys for different AI providers
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `provider` (text, enum: openai, anthropic, google, custom)
      - `api_key` (text, encrypted)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_rules` - Stores rules for AI content generation
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `type` (text, enum: title, tags)
      - `name` (text)
      - `prompt` (text)
      - `max_length` (integer)
      - `min_length` (integer)
      - `api_provider_id` (uuid, references ai_providers)
      - `is_default` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create ai_providers table
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'custom')),
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ai_rules table
CREATE TABLE IF NOT EXISTS ai_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('title', 'tags')),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  max_length INTEGER NOT NULL,
  min_length INTEGER NOT NULL,
  api_provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_providers
CREATE POLICY "Users can manage their own AI providers"
  ON ai_providers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for ai_rules
CREATE POLICY "Users can manage their own AI rules"
  ON ai_rules
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_rules_user_id ON ai_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_rules_type ON ai_rules(type);
CREATE INDEX IF NOT EXISTS idx_ai_rules_is_default ON ai_rules(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_rules_api_provider_id ON ai_rules(api_provider_id);

-- Create triggers to update updated_at column
CREATE TRIGGER update_ai_providers_updated_at
BEFORE UPDATE ON ai_providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_rules_updated_at
BEFORE UPDATE ON ai_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one default rule per type per user
CREATE OR REPLACE FUNCTION ensure_single_default_rule()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated rule is set as default
  IF NEW.is_default THEN
    -- Unset any other default rules of the same type for this user
    UPDATE ai_rules
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND type = NEW.type
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single default rule
CREATE TRIGGER ensure_single_default_rule
BEFORE INSERT OR UPDATE ON ai_rules
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_rule();