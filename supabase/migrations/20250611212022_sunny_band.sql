/*
  # User Fonts Management Functions

  1. Functions
    - Function to handle font file uploads
    - Function to validate font formats
    - Function to clean up unused fonts

  2. Security
    - RLS policies already exist for user_fonts table
    - File upload validation
    - User-specific font access
*/

-- Function to validate font file format
CREATE OR REPLACE FUNCTION validate_font_format(file_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN file_name ~* '\.(ttf|otf|woff|woff2)$';
END;
$$ LANGUAGE plpgsql;

-- Function to extract font family name from file name
CREATE OR REPLACE FUNCTION extract_font_family(file_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove file extension and clean up the name
  RETURN regexp_replace(
    regexp_replace(file_name, '\.(ttf|otf|woff|woff2)$', '', 'i'),
    '[^a-zA-Z0-9\s-]', '', 'g'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup inactive fonts (optional)
CREATE OR REPLACE FUNCTION cleanup_inactive_fonts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_fonts 
  WHERE is_active = false 
  AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_font_format(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION extract_font_family(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_fonts() TO service_role;