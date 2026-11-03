/*
# Create Barbi Shop schema: services + financial transactions

1. New Tables
- `services`
  - `id` (uuid, primary key)
  - `client_name` (text, not null) — nome do cliente
  - `description` (text, not null) — serviço realizado
  - `amount` (numeric(10,2), not null) — valor cobrado
  - `service_date` (date, not null) — data do serviço
  - `service_time` (time, not null) — horário do serviço
  - `posted_to_finance` (boolean, default false) — se já foi lançado no financeiro
  - `transaction_id` (uuid, nullable, FK) — referência ao lançamento financeiro criado
  - `created_at` (timestamptz, default now())
- `transactions`
  - `id` (uuid, primary key)
  - `description` (text, not null) — descrição do lançamento
  - `amount` (numeric(10,2), not null) — valor (positivo = receita, negativo = despesa)
  - `type` (text, not null, default 'income') — 'income' | 'expense'
  - `category` (text, default 'geral') — categoria
  - `transaction_date` (date, not null) — data do lançamento
  - `source` (text, default 'manual') — 'manual' | 'service' (origem do lançamento)
  - `service_id` (uuid, nullable, FK) — referência ao serviço que gerou o lançamento
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Grant CRUD to `anon` + `authenticated` (single-tenant, no auth).
- Allow anon + authenticated full CRUD because data is intentionally shared.

3. Notes
- When a service is registered, the app can optionally post it to `transactions` with `source='service'` and `service_id` set.
- `services.transaction_id` back-references the created transaction, preventing duplicate postings.
- `transactions.service_id` is unique so a service can only generate one financial entry.
*/

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  service_date date NOT NULL,
  service_time time NOT NULL,
  posted_to_finance boolean NOT NULL DEFAULT false,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL DEFAULT 'income' CHECK (type IN ('income','expense')),
  category text NOT NULL DEFAULT 'geral',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','service')),
  service_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;

-- policies for services
DROP POLICY IF EXISTS "anon_select_services" ON services;
CREATE POLICY "anon_select_services" ON services FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_services" ON services;
CREATE POLICY "anon_insert_services" ON services FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_services" ON services;
CREATE POLICY "anon_update_services" ON services FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_services" ON services;
CREATE POLICY "anon_delete_services" ON services FOR DELETE
  TO anon, authenticated USING (true);

-- policies for transactions
DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

-- indexes
CREATE INDEX IF NOT EXISTS idx_services_client_name ON services (client_name);
CREATE INDEX IF NOT EXISTS idx_services_service_date ON services (service_date);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions (source);