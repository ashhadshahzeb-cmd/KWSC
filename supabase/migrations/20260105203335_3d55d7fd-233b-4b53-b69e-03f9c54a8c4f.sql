-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create permissions table for granular access control
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create user_permissions table (junction table)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, permission_id)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Insert default permissions
INSERT INTO public.permissions (name, description) VALUES
  ('patients', 'Access to Patient Management'),
  ('medicine', 'Access to Medicine/Pharmacy'),
  ('hospital', 'Access to Hospital Visits'),
  ('laboratory', 'Access to Laboratory Tests'),
  ('monthly_cycle', 'Access to Monthly Cycle'),
  ('reports', 'Access to Reports'),
  ('devices', 'Access to Device Management');

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user has a permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND p.name = _permission_name
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign role (admin for ashhad@gmail.com, otherwise user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'ashhad@gmail.com' THEN 'admin'::app_role 
      ELSE 'user'::app_role 
    END
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for permissions
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user permissions"
  ON public.user_permissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user permissions"
  ON public.user_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));