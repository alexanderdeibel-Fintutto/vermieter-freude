-- Document OCR Results Table
CREATE TABLE public.document_ocr_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  raw_text TEXT,
  detected_type TEXT NOT NULL DEFAULT 'unknown' CHECK (detected_type IN ('invoice', 'tax_notice', 'contract', 'letter', 'receipt', 'energy_certificate', 'protocol', 'other', 'unknown')),
  confidence_score DECIMAL(5,2) DEFAULT 0,
  extracted_data JSONB DEFAULT '{}',
  suggested_building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  suggested_unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  suggested_category TEXT,
  user_feedback TEXT CHECK (user_feedback IN ('correct', 'incorrect', NULL)),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_ocr_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view OCR results in their org"
  ON public.document_ocr_results FOR SELECT
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert OCR results in their org"
  ON public.document_ocr_results FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update OCR results in their org"
  ON public.document_ocr_results FOR UPDATE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete OCR results in their org"
  ON public.document_ocr_results FOR DELETE
  USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_document_ocr_results_updated_at
  BEFORE UPDATE ON public.document_ocr_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_document_ocr_results_document ON public.document_ocr_results(document_id);
CREATE INDEX idx_document_ocr_results_org ON public.document_ocr_results(organization_id);
CREATE INDEX idx_document_ocr_results_type ON public.document_ocr_results(detected_type);
CREATE INDEX idx_document_ocr_results_raw_text ON public.document_ocr_results USING gin(to_tsvector('german', raw_text));

-- Add storage bucket for documents if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their org documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');