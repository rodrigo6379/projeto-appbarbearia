/*
# Create Barb Shop core data model

1. New tables
- `barbershop_settings`: one row per signed-in barber with shop name and business hours.
- `barbershop_clients`: owner-scoped client directory with phone, notes, and visit count.
- `barbershop_services`: owner-scoped catalog with service price and duration.
- `barbershop_appointments`: owner-scoped appointments linked to clients and services.
- `barbershop_transactions`: owner-scoped income and expense entries with payment method/category.

2. Columns
- Every table has an `id`, `user_id`, and `created_at`; `user_id` defaults to the signed-in account.
- Appointments store customer, service, date, time, status, and optional notes.
- Transactions store type, description, amount, date, category, and payment method.

3. Security
- Row Level Security is enabled on every table.
- Four separate authenticated owner policies protect SELECT, INSERT, UPDATE, and DELETE operations.
- Child records remain isolated by their own `user_id` ownership column.

4. Important notes
- This migration is idempotent and preserves existing records.
- Email/password authentication is provided by Supabase Auth; no custom password table is created.
*/

CREATE TABLE IF NOT EXISTS public.barbershop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL DEFAULT 'Barb Shop',
  opening_time time NOT NULL DEFAULT '08:00',
  closing_time time NOT NULL DEFAULT '19:00',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barbershop_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  notes text NOT NULL DEFAULT '',
  visits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barbershop_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barbershop_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.barbershop_clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.barbershop_services(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  service_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barbershop_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'Geral',
  payment_method text NOT NULL DEFAULT 'Pix' CHECK (payment_method IN ('Dinheiro', 'Pix', 'Débito', 'Crédito', 'Outro')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_user_date_idx ON public.barbershop_appointments(user_id, appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.barbershop_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS clients_user_name_idx ON public.barbershop_clients(user_id, name);

ALTER TABLE public.barbershop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_own" ON public.barbershop_settings;
CREATE POLICY "settings_select_own" ON public.barbershop_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "settings_insert_own" ON public.barbershop_settings;
CREATE POLICY "settings_insert_own" ON public.barbershop_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "settings_update_own" ON public.barbershop_settings;
CREATE POLICY "settings_update_own" ON public.barbershop_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "settings_delete_own" ON public.barbershop_settings;
CREATE POLICY "settings_delete_own" ON public.barbershop_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_select_own" ON public.barbershop_clients;
CREATE POLICY "clients_select_own" ON public.barbershop_clients FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "clients_insert_own" ON public.barbershop_clients;
CREATE POLICY "clients_insert_own" ON public.barbershop_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "clients_update_own" ON public.barbershop_clients;
CREATE POLICY "clients_update_own" ON public.barbershop_clients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "clients_delete_own" ON public.barbershop_clients;
CREATE POLICY "clients_delete_own" ON public.barbershop_clients FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "services_select_own" ON public.barbershop_services;
CREATE POLICY "services_select_own" ON public.barbershop_services FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "services_insert_own" ON public.barbershop_services;
CREATE POLICY "services_insert_own" ON public.barbershop_services FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "services_update_own" ON public.barbershop_services;
CREATE POLICY "services_update_own" ON public.barbershop_services FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "services_delete_own" ON public.barbershop_services;
CREATE POLICY "services_delete_own" ON public.barbershop_services FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_select_own" ON public.barbershop_appointments;
CREATE POLICY "appointments_select_own" ON public.barbershop_appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "appointments_insert_own" ON public.barbershop_appointments;
CREATE POLICY "appointments_insert_own" ON public.barbershop_appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "appointments_update_own" ON public.barbershop_appointments;
CREATE POLICY "appointments_update_own" ON public.barbershop_appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "appointments_delete_own" ON public.barbershop_appointments;
CREATE POLICY "appointments_delete_own" ON public.barbershop_appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_select_own" ON public.barbershop_transactions;
CREATE POLICY "transactions_select_own" ON public.barbershop_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "transactions_insert_own" ON public.barbershop_transactions;
CREATE POLICY "transactions_insert_own" ON public.barbershop_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "transactions_update_own" ON public.barbershop_transactions;
CREATE POLICY "transactions_update_own" ON public.barbershop_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "transactions_delete_own" ON public.barbershop_transactions;
CREATE POLICY "transactions_delete_own" ON public.barbershop_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);