-- Create profiles table for citizen data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  medical_flags TEXT[], -- Array of medical conditions/allergies
  commute_pattern TEXT, -- e.g., "Public transit", "Car", "Bike"
  home_zone TEXT, -- Geographic zone for personalized alerts
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create alerts table for personalized notifications
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'aqi', 'traffic', 'utility', 'emergency'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  zone TEXT, -- Geographic zone affected
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create reports table for issue reporting
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'road', 'water', 'power', 'waste', 'safety', 'other'
  description TEXT NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  location_address TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'submitted', -- 'submitted', 'in_progress', 'resolved'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create local services directory
CREATE TABLE public.local_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'hospital', 'pharmacy', 'shelter', 'community'
  address TEXT NOT NULL,
  phone TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  hours TEXT,
  is_24_7 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.local_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON public.local_services FOR SELECT
  USING (true);

-- Create service status table for utilities
CREATE TABLE public.service_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL, -- 'water', 'power', 'internet'
  zone TEXT NOT NULL,
  status TEXT NOT NULL, -- 'operational', 'degraded', 'outage'
  message TEXT,
  eta TEXT, -- Estimated time to restore
  last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service status"
  ON public.service_status FOR SELECT
  USING (true);

-- Function to generate ticket IDs
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket IDs
CREATE OR REPLACE FUNCTION set_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_id IS NULL THEN
    NEW.ticket_id := generate_ticket_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_ticket_id_trigger
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_id();

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample local services
INSERT INTO public.local_services (name, category, address, phone, location_lat, location_lng, hours, is_24_7) VALUES
  ('City General Hospital', 'hospital', '123 Health St', '(555) 100-1000', 40.7128, -74.0060, '24/7', true),
  ('Metro Pharmacy', 'pharmacy', '456 Care Ave', '(555) 200-2000', 40.7138, -74.0070, '8AM - 10PM', false),
  ('Community Shelter', 'shelter', '789 Support Rd', '(555) 300-3000', 40.7148, -74.0080, '24/7', true),
  ('Downtown Community Center', 'community', '321 Unity Blvd', '(555) 400-4000', 40.7158, -74.0090, '9AM - 6PM', false);