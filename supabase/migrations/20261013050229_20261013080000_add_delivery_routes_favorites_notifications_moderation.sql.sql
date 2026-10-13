/*
# Add delivery routes, favorites, notifications, product moderation, admin audit log

## Summary
Adds new tables and columns to support:
- City-based delivery rate calculation (delivery_routes table)
- Product favorites/wishlist (favorites table)
- User notifications (notifications table)
- Product moderation (moderation_status column on products)
- Admin action history (admin_audit_log table)
- Order delivery cities (from_city, to_city columns on orders)
- Product origin city (origin_city column on products)

## New Tables
### 1. delivery_routes — city pair delivery fees, admin-editable
### 2. favorites — user wishlist, owner-scoped
### 3. notifications — user notifications, owner-scoped
### 4. admin_audit_log — admin action history

## Modified Tables
- products: adds origin_city, moderation_status
- orders: adds from_city, to_city

## Security
- All new tables have RLS enabled with appropriate policies
- delivery_routes: public read, admin-only write
- favorites, notifications: owner-scoped CRUD
- admin_audit_log: admin-only
*/

-- ============ 1. delivery_routes ============
CREATE TABLE IF NOT EXISTS delivery_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_city text NOT NULL,
  to_city text NOT NULL,
  fee numeric NOT NULL CHECK (fee >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_city, to_city)
);

ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_delivery_routes" ON delivery_routes;
CREATE POLICY "read_delivery_routes" ON delivery_routes
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_delivery_routes" ON delivery_routes;
CREATE POLICY "admin_insert_delivery_routes" ON delivery_routes
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_update_delivery_routes" ON delivery_routes;
CREATE POLICY "admin_update_delivery_routes" ON delivery_routes
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_delete_delivery_routes" ON delivery_routes;
CREATE POLICY "admin_delete_delivery_routes" ON delivery_routes
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============ 2. favorites ============
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ 3. notifications ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('order', 'message', 'system', 'monetization')),
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ 4. admin_audit_log ============
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_log" ON admin_audit_log;
CREATE POLICY "admin_read_audit_log" ON admin_audit_log
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "admin_insert_audit_log" ON admin_audit_log;
CREATE POLICY "admin_insert_audit_log" ON admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============ 5. Add columns to products ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'origin_city') THEN
    ALTER TABLE products ADD COLUMN origin_city text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moderation_status') THEN
    ALTER TABLE products ADD COLUMN moderation_status text NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'revision'));
  END IF;
END $$;

-- ============ 6. Add columns to orders ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'from_city') THEN
    ALTER TABLE orders ADD COLUMN from_city text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'to_city') THEN
    ALTER TABLE orders ADD COLUMN to_city text;
  END IF;
END $$;

-- ============ 7. Indexes ============
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_delivery_routes_lookup ON delivery_routes(from_city, to_city) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_products_moderation ON products(moderation_status);

-- ============ 8. Seed delivery routes ============
INSERT INTO delivery_routes (from_city, to_city, fee) VALUES
  ('Cap-Haïtien', 'Gonaïves', 1000),
  ('Gonaïves', 'Cap-Haïtien', 1000),
  ('Limonade', 'Gonaïves', 1000),
  ('Gonaïves', 'Limonade', 1000),
  ('Gonaïves', 'Gonaïves', 250),
  ('Limonade', 'Limonade', 250),
  ('Gonaïves', 'Saint-Marc', 1000),
  ('Saint-Marc', 'Gonaïves', 1000),
  ('Port-au-Prince', 'Gonaïves', 2000),
  ('Gonaïves', 'Port-au-Prince', 2000)
ON CONFLICT (from_city, to_city) DO UPDATE SET fee = EXCLUDED.fee, is_active = true, updated_at = now();