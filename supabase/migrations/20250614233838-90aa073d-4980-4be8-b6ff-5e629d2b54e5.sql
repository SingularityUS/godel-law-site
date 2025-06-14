
-- 1. Create the documents table for uploaded file metadata
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  extracted_text text,
  preview_url text,
  user_id uuid, -- can be NULL for now (for future RLS or auth)
  CONSTRAINT unique_storage_path UNIQUE(storage_path)
);

-- 2. Create a public storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- 3. Enable Row Level Security on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. Allow universal SELECT and INSERT access to documents (adjust later per your auth preferences)
CREATE POLICY "Allow anyone to read documents"
  ON public.documents
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anyone to create documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (true);

