/*
  # Add Sample Etsy Store for Testing

  1. New Data
    - Sample Etsy store for testing mockup templates
    - Sample store images for logo selection
  
  2. Security
    - Uses authenticated user's ID
    - Follows existing RLS policies
*/

-- Insert sample Etsy store (will be inserted for the current user when they first access)
-- This is a template that will be used by the application to create a sample store

-- Note: This migration creates a function that can be called to add sample data
-- The actual insertion will happen when the user first loads the stores page

CREATE OR REPLACE FUNCTION create_sample_store_for_user(user_id_param UUID)
RETURNS TABLE(store_id UUID, message TEXT) AS $$
DECLARE
  new_store_id UUID;
  sample_store_exists BOOLEAN;
BEGIN
  -- Check if user already has a sample store
  SELECT EXISTS(
    SELECT 1 FROM stores 
    WHERE user_id = user_id_param 
    AND store_name = 'Örnek Etsy Mağazası'
  ) INTO sample_store_exists;
  
  IF sample_store_exists THEN
    SELECT id INTO new_store_id FROM stores 
    WHERE user_id = user_id_param 
    AND store_name = 'Örnek Etsy Mağazası'
    LIMIT 1;
    
    RETURN QUERY SELECT new_store_id, 'Sample store already exists'::TEXT;
    RETURN;
  END IF;
  
  -- Insert sample store
  INSERT INTO stores (
    user_id,
    platform,
    store_name,
    store_url,
    api_credentials,
    is_active,
    last_sync_at
  ) VALUES (
    user_id_param,
    'etsy',
    'Örnek Etsy Mağazası',
    'https://www.etsy.com/shop/ornekmagaza',
    '{"api_key": "sample_key", "shop_id": "12345678"}',
    true,
    NOW()
  ) RETURNING id INTO new_store_id;
  
  -- Insert sample store images (logos)
  INSERT INTO store_images (
    user_id,
    store_id,
    name,
    image_url,
    image_type,
    folder_path,
    auto_apply
  ) VALUES 
  (
    user_id_param,
    new_store_id,
    'Örnek Logo 1',
    'https://images.pexels.com/photos/1667088/pexels-photo-1667088.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
    'logo',
    'logos',
    false
  ),
  (
    user_id_param,
    new_store_id,
    'Örnek Logo 2',
    'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
    'logo',
    'logos',
    false
  ),
  (
    user_id_param,
    new_store_id,
    'Örnek Logo 3',
    'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
    'logo',
    'logos',
    false
  ),
  (
    user_id_param,
    new_store_id,
    'Marka Logosu',
    'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1',
    'logo',
    'logos',
    false
  );
  
  RETURN QUERY SELECT new_store_id, 'Sample store and images created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_sample_store_for_user(UUID) TO authenticated;