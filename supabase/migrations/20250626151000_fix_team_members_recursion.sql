
-- Fix infinite recursion in team_members RLS policies
-- Drop all existing problematic policies that cause recursion
DROP POLICY IF EXISTS "team_members_select_own" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select_as_owner" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_as_owner" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_as_owner" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_as_owner" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team memberships they belong to" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage team membership" ON public.team_members;

-- Create a security definer function to check team ownership without recursion
CREATE OR REPLACE FUNCTION public.is_team_owner(team_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_uuid AND owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simple, non-recursive RLS policies for team_members
CREATE POLICY "Users can view their own memberships" 
  ON public.team_members 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Team owners can view all team members" 
  ON public.team_members 
  FOR SELECT 
  USING (public.is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team owners can insert members" 
  ON public.team_members 
  FOR INSERT 
  WITH CHECK (public.is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team owners can update members" 
  ON public.team_members 
  FOR UPDATE 
  USING (public.is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team owners can delete members" 
  ON public.team_members 
  FOR DELETE 
  USING (public.is_team_owner(team_id, auth.uid()));

-- Ensure agent_templates policies don't conflict
DROP POLICY IF EXISTS "agent_templates_select_public" ON public.agent_templates;
DROP POLICY IF EXISTS "agent_templates_select_own" ON public.agent_templates;

CREATE POLICY "Public templates viewable by all" 
  ON public.agent_templates 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view own templates" 
  ON public.agent_templates 
  FOR SELECT 
  USING (created_by = auth.uid());
