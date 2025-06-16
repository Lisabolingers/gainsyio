/*
  # Add user roles to user_profiles table

  1. Changes
    - Add `role` column to `user_profiles` table
    - Add check constraint to ensure valid roles
    - Update existing users to have 'user' role by default
  
  2. Security
    - Only superadmins can change user roles
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
  (auth.uid() = id AND old.role = new.role) OR -- Users can update their own profiles but not their role
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'superadmin' -- Only superadmins can change roles
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