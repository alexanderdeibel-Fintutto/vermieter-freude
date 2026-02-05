-- Create meter_type enum
CREATE TYPE public.meter_type AS ENUM ('electricity', 'gas', 'water', 'heating');

-- Create meter_status enum  
CREATE TYPE public.meter_status AS ENUM ('current', 'reading_due', 'overdue');

-- Create meters table
CREATE TABLE public.meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  meter_number TEXT NOT NULL,
  meter_type public.meter_type NOT NULL,
  installation_date DATE,
  notes TEXT,
  reading_interval_months INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meter_readings table
CREATE TABLE public.meter_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
  reading_value NUMERIC NOT NULL,
  reading_date DATE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;

-- RLS policies for meters (access via unit -> building -> organization)
CREATE POLICY "Users can view meters in their organization"
  ON public.meters FOR SELECT
  USING (unit_id IN (
    SELECT u.id FROM units u
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can insert meters in their organization"
  ON public.meters FOR INSERT
  WITH CHECK (unit_id IN (
    SELECT u.id FROM units u
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can update meters in their organization"
  ON public.meters FOR UPDATE
  USING (unit_id IN (
    SELECT u.id FROM units u
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can delete meters in their organization"
  ON public.meters FOR DELETE
  USING (unit_id IN (
    SELECT u.id FROM units u
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

-- RLS policies for meter_readings (access via meter -> unit -> building -> organization)
CREATE POLICY "Users can view meter readings in their organization"
  ON public.meter_readings FOR SELECT
  USING (meter_id IN (
    SELECT m.id FROM meters m
    JOIN units u ON m.unit_id = u.id
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can insert meter readings in their organization"
  ON public.meter_readings FOR INSERT
  WITH CHECK (meter_id IN (
    SELECT m.id FROM meters m
    JOIN units u ON m.unit_id = u.id
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can update meter readings in their organization"
  ON public.meter_readings FOR UPDATE
  USING (meter_id IN (
    SELECT m.id FROM meters m
    JOIN units u ON m.unit_id = u.id
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Users can delete meter readings in their organization"
  ON public.meter_readings FOR DELETE
  USING (meter_id IN (
    SELECT m.id FROM meters m
    JOIN units u ON m.unit_id = u.id
    JOIN buildings b ON u.building_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ));

-- Add triggers for updated_at
CREATE TRIGGER update_meters_updated_at
  BEFORE UPDATE ON public.meters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_meters_unit ON public.meters(unit_id);
CREATE INDEX idx_meters_type ON public.meters(meter_type);
CREATE INDEX idx_meter_readings_meter ON public.meter_readings(meter_id);
CREATE INDEX idx_meter_readings_date ON public.meter_readings(reading_date DESC);