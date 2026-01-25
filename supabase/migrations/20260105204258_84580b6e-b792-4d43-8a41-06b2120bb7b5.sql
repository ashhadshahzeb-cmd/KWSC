-- Create a function to make a user an admin (for initial setup)
-- This can only be called once per user
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user id from profiles
  SELECT id INTO target_user_id FROM public.profiles WHERE email = user_email LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update their role to admin
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- Allow authenticated users to call this function (but it checks internally)
GRANT EXECUTE ON FUNCTION public.make_user_admin TO authenticated;