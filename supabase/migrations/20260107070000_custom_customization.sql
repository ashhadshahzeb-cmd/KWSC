-- Customization Schema Migration

-- Table: custom_fields
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name TEXT NOT NULL, -- e.g., 'patients', 'medicine'
    label TEXT NOT NULL,
    field_name TEXT NOT NULL, -- snake_case
    field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select'
    options JSONB DEFAULT '[]', -- for select types
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (module_name, field_name)
);

-- Table: component_settings
CREATE TABLE IF NOT EXISTS public.component_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name TEXT UNIQUE NOT NULL, -- sidebar menu items
    is_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view custom fields (authenticated)
CREATE POLICY "Users can view custom fields" ON public.custom_fields FOR SELECT TO authenticated USING (true);

-- Admins can manage custom fields
CREATE POLICY "Admins can manage custom fields" ON public.custom_fields FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view component settings
CREATE POLICY "Users can view component settings" ON public.component_settings FOR SELECT TO authenticated USING (true);

-- Admins can manage component settings
CREATE POLICY "Admins can manage component settings" ON public.component_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Populate initial component settings
INSERT INTO public.component_settings (component_name, is_enabled) VALUES
    ('Patients', true),
    ('Medicine', true),
    ('Hospital', true),
    ('Laboratory', true),
    ('Monthly Cycle', true),
    ('Reports', true),
    ('Device Management', true)
ON CONFLICT (component_name) DO NOTHING;
