
-- Create table for citation extraction settings
CREATE TABLE public.citation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.citation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for citation settings
CREATE POLICY "Users can view their own citation settings" 
  ON public.citation_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own citation settings" 
  ON public.citation_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own citation settings" 
  ON public.citation_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own citation settings" 
  ON public.citation_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_citation_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_citation_settings_updated_at
  BEFORE UPDATE ON public.citation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_citation_settings_updated_at();
