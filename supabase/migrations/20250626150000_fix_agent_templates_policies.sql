
-- Fix agent_templates RLS policies to allow proper fetching
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "agent_templates_select_public" ON public.agent_templates;
DROP POLICY IF EXISTS "agent_templates_select_own" ON public.agent_templates;
DROP POLICY IF EXISTS "agent_templates_insert_own" ON public.agent_templates;
DROP POLICY IF EXISTS "agent_templates_update_own" ON public.agent_templates;
DROP POLICY IF EXISTS "agent_templates_delete_own" ON public.agent_templates;

-- Create new, simpler policies
CREATE POLICY "Anyone can view public templates" 
  ON public.agent_templates 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view their own templates" 
  ON public.agent_templates 
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create templates" 
  ON public.agent_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" 
  ON public.agent_templates 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" 
  ON public.agent_templates 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Ensure we have some sample data with proper user association
-- First, get a valid user ID or create a system user reference
DO $$
DECLARE
    system_user_id uuid;
BEGIN
    -- Try to get any existing user ID, or use a placeholder
    SELECT id INTO system_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, we'll insert with a placeholder that can be updated later
    IF system_user_id IS NULL THEN
        system_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Update existing templates or insert sample ones
    INSERT INTO public.agent_templates (name, description, category, tags, template_data, is_public, created_by) 
    VALUES
    (
        'Sales Assistant',
        'A helpful sales assistant for lead qualification and customer support',
        'sales',
        ARRAY['sales', 'customer-service', 'lead-qualification'],
        jsonb_build_object(
            'system_prompt', 'You are a professional sales assistant. Help qualify leads and provide excellent customer service.',
            'first_message', 'Hello! I''m here to help you with your sales inquiry. How can I assist you today?',
            'voice_provider', 'deepgram',
            'voice_id', 'aura-asteria-en',
            'model', 'nova-2',
            'temperature', 0.8,
            'max_tokens', 500
        ),
        true,
        system_user_id
    ),
    (
        'Customer Support',
        'Professional customer support agent for handling inquiries and issues',
        'support',
        ARRAY['support', 'customer-service', 'help-desk'],
        jsonb_build_object(
            'system_prompt', 'You are a friendly customer support representative. Help customers with their questions and resolve issues professionally.',
            'first_message', 'Hi there! I''m your customer support assistant. How can I help you today?',
            'voice_provider', 'deepgram',
            'voice_id', 'aura-asteria-en',
            'model', 'nova-2',
            'temperature', 0.7,
            'max_tokens', 500
        ),
        true,
        system_user_id
    ),
    (
        'Appointment Scheduler',
        'Efficient appointment scheduling assistant for businesses',
        'scheduling',
        ARRAY['scheduling', 'appointments', 'calendar'],
        jsonb_build_object(
            'system_prompt', 'You are an appointment scheduling assistant. Help customers book, reschedule, or cancel appointments efficiently.',
            'first_message', 'Hello! I can help you schedule an appointment. What service are you looking for?',
            'voice_provider', 'deepgram',
            'voice_id', 'aura-asteria-en',
            'model', 'nova-2',
            'temperature', 0.6,
            'max_tokens', 400
        ),
        true,
        system_user_id
    )
    ON CONFLICT (name) DO NOTHING;
END $$;
