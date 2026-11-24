-- StreetFix PostgreSQL Schema for External Supabase (.supabase.co)
-- Run this script once in your Supabase Dashboard -> SQL Editor.

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'resident',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_members (
  id TEXT PRIMARY KEY,
  initials TEXT NOT NULL,
  avatar_url TEXT,
  name TEXT NOT NULL,
  service_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  role_level TEXT NOT NULL,
  lga_jurisdiction TEXT NOT NULL,
  mfa_method TEXT NOT NULL,
  last_telemetry TEXT NOT NULL,
  last_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  email TEXT,
  phone TEXT,
  passcode TEXT NOT NULL,
  is_street_fix_office BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS public.resident_accounts (
  id TEXT PRIMARY KEY,
  uid TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT,
  street TEXT,
  plot_no TEXT,
  landmark TEXT,
  avatar_url TEXT,
  whatsapp_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY,
  ref_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT NOT NULL,
  lat TEXT NOT NULL,
  lng TEXT NOT NULL,
  status TEXT NOT NULL,
  severity TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  sla_remaining_hours INTEGER NOT NULL,
  sla_label TEXT NOT NULL,
  confirmations INTEGER NOT NULL DEFAULT 1,
  reporter_name TEXT NOT NULL,
  reporter_verified BOOLEAN NOT NULL DEFAULT TRUE,
  reporter_uid TEXT,
  assigned_unit TEXT NOT NULL,
  assigned_depot TEXT NOT NULL,
  squad_lead TEXT NOT NULL,
  before_photo_url TEXT NOT NULL,
  progress_photo_url TEXT,
  after_photo_url TEXT,
  exif_verified BOOLEAN NOT NULL DEFAULT FALSE,
  distance_km DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_in BOOLEAN,
  materials_asphalt_tons DOUBLE PRECISION,
  crew_hours DOUBLE PRECISION,
  reporter_phone TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL,
  recipient_name TEXT,
  incident_id TEXT NOT NULL,
  ref_code TEXT NOT NULL,
  severity TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  timestamp_ms DOUBLE PRECISION NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.advisories (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.global_policies (
  id INTEGER PRIMARY KEY,
  exif_strict BOOLEAN NOT NULL DEFAULT TRUE,
  auto_route_potholes BOOLEAN NOT NULL DEFAULT TRUE,
  auto_escalate_sla BOOLEAN NOT NULL DEFAULT TRUE,
  open_ledger BOOLEAN NOT NULL DEFAULT TRUE,
  sla_target_hours TEXT NOT NULL DEFAULT '48'
);

-- Enable Row Level Security across all tables (server accesses via SUPABASE_SERVICE_ROLE_KEY)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_policies ENABLE ROW LEVEL SECURITY;
