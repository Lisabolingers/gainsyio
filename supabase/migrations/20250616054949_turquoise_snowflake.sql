/*
  # Add user roles and role-based access control

  1. New Columns
    - `role` (text) to user_profiles table with default 'user'
  
  2. Constraints
    - Check constraint to ensure role is one of: 'user', 'admin', 'superadmin'
  
  3. Security
    - Policy for role updates
    - Helper functions for role checking
*/

-- Add role column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Add check constraint to ensure valid roles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'superadmin'));

-- Create a policy to allow only superadmins to update roles
CREATE POLICY "Only superadmins can update roles" 
ON public.user_profiles
FOR UPDATE
USING (
  (auth.uid() = id) OR -- Users can update their own profiles
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin') -- Or superadmins can update any profile
)
WITH CHECK (
  -- For role column specifically:
  (
    -- If updating role, must be superadmin
    (role = (SELECT role FROM public.user_profiles WHERE id = id)) OR -- Role not changing
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'superadmin') -- Or user is superadmin
  )
);

-- Create a function to check if the current user is a superadmin
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

-- Create a function to check if the current user is an admin or superadmin
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