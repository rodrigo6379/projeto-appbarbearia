/*
# Create completed service history with linked revenue

1. New table
- `barbershop_service_history` stores completed services with the client, service, charged amount, service date, service time, and the linked financial transaction.
- `client_id` and `service_id` keep optional references to the existing client and service catalogs.
- `client_name` and `service_name` preserve the names shown at the time of completion.
- `amount` stores the amount charged and is also used for the linked income entry.
- `service_date` and `service_time` identify when the service was performed.
- `transaction_id` links the history item to exactly one financial transaction.

2. Database function
- `register_barbershop_service` validates ownership of the selected client and service, creates one income transaction, and creates the matching history row atomically.
- The function accepts the charged amount and payment method, while the client and service names come from the user's own catalog records.

3. Security
- Row Level Security is enabled on the new table.
- Authenticated users can only read their own history rows.
- Direct inserts, updates, and deletes are not granted; creation goes through the authenticated, ownership-checked function.
- The function uses the authenticated user's id, a fixed search path, and is not executable by anonymous users.

4. Important notes
- Existing appointments and financial transactions are preserved unchanged.
- Each newly registered completed service creates one linked revenue entry, preventing duplicate financial postings from separate client requests.
*/

CREATE TABLE IF NOT EXISTS public.barbershop_service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.barbershop_clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.barbershop_services(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  service_name text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  service_time time NOT NULL DEFAULT CURRENT_TIME,
  transaction_id uuid NOT NULL UNIQUE REFERENCES public.barbershop_transactions(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_history_user_date_idx
  ON public.barbershop_service_history(user_id, service_date DESC, service_time DESC);

ALTER TABLE public.barbershop_service_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.barbershop_service_history TO authenticated;

DROP POLICY IF EXISTS "service_history_select_own" ON public.barbershop_service_history;
CREATE POLICY "service_history_select_own"
  ON public.barbershop_service_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.register_barbershop_service(
  p_client_id uuid,
  p_service_id uuid,
  p_amount numeric,
  p_service_date date,
  p_service_time time,
  p_payment_method text DEFAULT 'Pix'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_client_name text;
  v_service_name text;
  v_transaction_id uuid;
  v_history_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount < 0 OR p_amount > 99999999.99 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_payment_method NOT IN ('Dinheiro', 'Pix', 'Débito', 'Crédito', 'Outro') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  SELECT name INTO v_client_name
  FROM public.barbershop_clients
  WHERE id = p_client_id AND user_id = v_user_id;

  IF v_client_name IS NULL THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  SELECT name INTO v_service_name
  FROM public.barbershop_services
  WHERE id = p_service_id AND user_id = v_user_id;

  IF v_service_name IS NULL THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  INSERT INTO public.barbershop_transactions (
    user_id, type, description, amount, transaction_date, category, payment_method
  ) VALUES (
    v_user_id, 'income', v_service_name || ' · ' || v_client_name, p_amount, p_service_date, 'Serviços', p_payment_method
  ) RETURNING id INTO v_transaction_id;

  INSERT INTO public.barbershop_service_history (
    user_id, client_id, service_id, client_name, service_name, amount, service_date, service_time, transaction_id
  ) VALUES (
    v_user_id, p_client_id, p_service_id, v_client_name, v_service_name, p_amount, p_service_date, p_service_time, v_transaction_id
  ) RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_barbershop_service(uuid, uuid, numeric, date, time, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_barbershop_service(uuid, uuid, numeric, date, time, text) TO authenticated;