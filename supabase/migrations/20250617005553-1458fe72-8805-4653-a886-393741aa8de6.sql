
-- Create workspaces table for storing user workspace configurations
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'Default Workspace',
  nodes_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_default boolean DEFAULT false,
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace access
CREATE POLICY "Users can view their own workspaces" 
  ON public.workspaces 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workspaces" 
  ON public.workspaces 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces" 
  ON public.workspaces 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces" 
  ON public.workspaces 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX idx_workspaces_user_default ON public.workspaces(user_id, is_default) WHERE is_default = true;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workspace_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workspace_updated_at();
