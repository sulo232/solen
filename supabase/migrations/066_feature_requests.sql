-- Feature requests from admin visual editor
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  element_selector text,
  element_tag text,
  element_text text,
  component_hint text,
  page_url text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'roadmap_generated', 'in_progress', 'done', 'reverted')),
  generated_roadmap text,
  roadmap_version integer NOT NULL DEFAULT 1,
  claude_prompt text,
  token_usage jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin-only (ALL operations)
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_requests_admin_select" ON public.feature_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feature_requests_admin_insert" ON public.feature_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feature_requests_admin_update" ON public.feature_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "feature_requests_admin_delete" ON public.feature_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-update updated_at — reuse the existing generic trigger function
CREATE TRIGGER trigger_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed the visual_editor feature flag (required for checkFeatureEnabled)
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('visual_editor', true, 'Admin visual editor at /dashboard/editor')
ON CONFLICT (key) DO NOTHING;
