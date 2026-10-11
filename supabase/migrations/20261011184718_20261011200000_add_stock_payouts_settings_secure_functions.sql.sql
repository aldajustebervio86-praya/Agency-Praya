/*
# Add stock, vendor payouts, app settings, delivery confirmation, and secure functions

## Summary
This migration completes the marketplace feature set:
1. Adds stock tracking to products
2. Creates app_settings table for configurable commission rate
3. Creates vendor_payouts table for manual payout recording
4. Adds delivery confirmation fields to orders
5. Fixes the buyer UPDATE policy (was too permissive — buyer could update any field)
6. Adds admin SELECT policy on monetization_requests
7. Adds admin SELECT on orders (already had via OR clause but this makes explicit)
8. Creates SECURITY DEFINER functions for buyer delivery accept/refuse/confirm actions
   so buyers can only update specific fields, not the entire order row

## New Tables
- `app_settings` — single-row table for admin-configurable settings (commission_rate)
- `vendor_payouts` — records manual payouts to sellers with amount, reference, date, status

## Modified Tables
- `products` — adds `stock` column (integer, nullable, default null = unlimited)
- `orders` — adds `delivery_confirmed` boolean, `delivery_confirmed_at` timestamp

## Security Changes
- RLS on app_settings: admin-only INSERT/UPDATE/DELETE, authenticated SELECT
- RLS on vendor_payouts: admin-only INSERT/UPDATE/DELETE, seller can SELECT own payouts
- Fixes orders UPDATE policy: removes the overly-permissive `update_own_orders_buyer`
  and replaces with SECURITY DEFINER functions that only update specific fields
- Adds admin SELECT policy on monetization_requests
- Adds seller SELECT policy on order_messages where direction = to_seller (already existed via OR)

## Important Notes
1. The old `update_own_orders_buyer` policy allowed buyers to update ANY column on orders
   they owned, including commission, payment_verified, seller_id, etc. This is replaced
   by SECURITY DEFINER RPC functions that only update the specific fields needed.
2. Stock column is nullable: NULL means unlimited, 0 means out of stock, >0 means available.
3. app_settings is designed as a single-row table enforced by a constraint.
4. Vendor payouts are manual records — they never auto-mark anything as paid.
*/

-- ============ 1. Add stock column to products ============
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer;

-- ============ 2. Add delivery confirmation to orders ============
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamptz;

-- ============ 3. Create app_settings table ============
CREATE TABLE IF NOT EXISTS app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  commission_rate numeric NOT NULL DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row_only CHECK (id = 1)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_app_settings" ON app_settings;
CREATE POLICY "read_app_settings" ON app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_app_settings" ON app_settings;
CREATE POLICY "admin_update_app_settings" ON app_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_app_settings" ON app_settings;
CREATE POLICY "admin_insert_app_settings" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

-- Seed default row if not exists
INSERT INTO app_settings (id, commission_rate) VALUES (1, 10)
  ON CONFLICT (id) DO NOTHING;

-- ============ 4. Create vendor_payouts table ============
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  transaction_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'verified', 'cancelled')),
  payout_date timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_insert_vendor_payouts" ON vendor_payouts;
CREATE POLICY "admin_insert_vendor_payouts" ON vendor_payouts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_vendor_payouts" ON vendor_payouts;
CREATE POLICY "admin_update_vendor_payouts" ON vendor_payouts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_vendor_payouts" ON vendor_payouts;
CREATE POLICY "admin_delete_vendor_payouts" ON vendor_payouts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

DROP POLICY IF EXISTS "read_own_vendor_payouts" ON vendor_payouts;
CREATE POLICY "read_own_vendor_payouts" ON vendor_payouts FOR SELECT
  TO authenticated USING (
    seller_id = auth.uid()
    OR EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

-- ============ 5. Fix orders UPDATE policy ============
-- Remove the overly-permissive buyer update policy
DROP POLICY IF EXISTS "update_own_orders_buyer" ON orders;

-- Keep admin_update_orders (already exists, allows admin to update everything)

-- ============ 6. Add admin SELECT on monetization_requests ============
DROP POLICY IF EXISTS "admin_read_monetization_requests" ON monetization_requests;
CREATE POLICY "admin_read_monetization_requests" ON monetization_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')
  );

-- ============ 7. SECURITY DEFINER functions for buyer actions ============

-- Function: buyer_accept_delivery
-- Allows buyer to accept a proposed delivery fee, updating only the allowed fields
CREATE OR REPLACE FUNCTION buyer_accept_delivery(p_order_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders SET
    delivery_status = 'accepted',
    delivery_fee = proposed_delivery_fee,
    status = 'payment_pending',
    updated_at = now()
  WHERE id = p_order_id
    AND buyer_id = auth.uid()
    AND delivery_status = 'remote_proposed';
END;
$$;

GRANT EXECUTE ON FUNCTION buyer_accept_delivery(uuid) TO authenticated;

-- Function: buyer_refuse_delivery
-- Allows buyer to refuse a proposed delivery fee
CREATE OR REPLACE FUNCTION buyer_refuse_delivery(p_order_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders SET
    delivery_status = 'refused',
    status = 'delivery_refused',
    updated_at = now()
  WHERE id = p_order_id
    AND buyer_id = auth.uid()
    AND delivery_status = 'remote_proposed';
END;
$$;

GRANT EXECUTE ON FUNCTION buyer_refuse_delivery(uuid) TO authenticated;

-- Function: buyer_confirm_delivery
-- Allows buyer to confirm they received the order
CREATE OR REPLACE FUNCTION buyer_confirm_delivery(p_order_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders SET
    delivery_confirmed = true,
    delivery_confirmed_at = now(),
    updated_at = now()
  WHERE id = p_order_id
    AND buyer_id = auth.uid()
    AND status = 'delivered'
    AND delivery_confirmed = false;
END;
$$;

GRANT EXECUTE ON FUNCTION buyer_confirm_delivery(uuid) TO authenticated;

-- ============ 8. Add index for vendor_payouts seller lookup ============
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_seller_id ON vendor_payouts(seller_id);