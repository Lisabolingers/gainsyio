-- Add role column to user_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Add check constraint to ensure valid roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('user', 'admin', 'superadmin'));
  END IF;
END $$;

-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Only superadmins can update roles" ON public.user_profiles;

-- Create a policy to allow only superadmins to update roles
-- Fixed syntax to use auth.uid() instead of uid()
CREATE POLICY "Only superadmins can update roles" 
ON public.user_profiles
FOR UPDATE
USING (
  ((auth.uid() = id) OR 
   EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin'))
)
WITH CHECK (
  ((auth.uid() = id) AND (
    -- Either the role is not being changed by a regular user
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    )
  )) OR 
  -- Or the user is a superadmin
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- Create or replace function to check if the current user is a superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'superadmin' 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to check if the current user is an admin or superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'superadmin') 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;