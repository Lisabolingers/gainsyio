/*
  # Add user roles and fix role-based access control

  1. New Columns
    - `role` (text) to user_profiles table with default 'user'
  
  2. Constraints
    - Check constraint to ensure role is one of: 'user', 'admin', 'superadmin'
  
  3. Security
    - Policy for role updates
    - Helper functions for role checking
*/

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
CREATE POLICY "Only superadmins can update roles" 
ON public.user_profiles
FOR UPDATE
USING (
  -- Users can update their own profiles OR superadmins can update any profile
  (auth.uid() = id) OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
)
WITH CHECK (
  -- For role changes, either:
  -- 1. The role is not being changed (comparing with current DB value, not OLD)
  -- 2. The user making the change is a superadmin
  (
    (role = (SELECT role FROM public.user_profiles WHERE id = id)) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  )
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