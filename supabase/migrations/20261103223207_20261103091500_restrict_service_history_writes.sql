/*
# Restrict service history direct writes

1. Modified table
- `barbershop_service_history` keeps the same columns and existing records.
- Direct write permissions are removed because service history and its revenue entry must be created together.

2. Security changes
- Anonymous users lose all access to the service history table.
- Authenticated users keep SELECT access for their own rows through the existing RLS policy.
- Authenticated users lose direct INSERT, UPDATE, and DELETE access; new records must use the ownership-checked atomic registration function.

3. Important notes
- No data is deleted or changed.
- The existing `register_barbershop_service` function remains the supported creation path and still creates the linked financial entry atomically.
*/

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.barbershop_service_history FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.barbershop_service_history FROM authenticated;
GRANT SELECT ON public.barbershop_service_history TO authenticated;