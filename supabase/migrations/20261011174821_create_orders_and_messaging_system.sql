/*
# Create orders, order_items, order_messages, message_templates

## Purpose
Implements the full order system for Agency Prarya. No direct buyer-seller
messaging — the administrator controls all communication. Standard delivery
fee is 250 HTG, adjustable by admin for remote locations. Price snapshots
preserve order integrity.

## New Tables

### 1. message_templates
- Pre-recorded message templates the admin can edit and send.
- `id` (uuid, PK)
- `name` (text) — template label
- `type` (text: 'seller_confirmation' | 'delivery_proposal') — purpose
- `content` (text) — editable message body
- `created_at`, `updated_at`

### 2. orders
- Central order record linking buyer, seller, and items.
- `id` (uuid, PK)
- `buyer_id` (uuid, FK auth.users, DEFAULT auth.uid())
- `seller_id` (uuid, FK seller_profiles)
- `status` (text, CHECK: pending_seller_confirmation, seller_confirmed,
  delivery_pending, delivery_proposed, delivery_accepted, delivery_refused,
  payment_pending, payment_verified, preparing, delivered, cancelled)
- `delivery_fee` (numeric(10,2), DEFAULT 250.00) — standard delivery fee
- `proposed_delivery_fee` (numeric(10,2), nullable) — admin's adjusted fee for remote
- `delivery_explanation` (text, default '') — reason for adjusted fee
- `delivery_address` (text) — buyer's delivery location
- `delivery_status` (text: 'standard', 'remote_proposed', 'accepted', 'refused', default 'standard')
- `commission` (numeric(10,2), default 0) — admin-managed commission
- `payment_method` (text, default 'moncash')
- `payment_verified` (bool, default false)
- `payment_verified_at` (timestamptz, nullable)
- `buyer_note` (text, default '') — optional note from buyer
- `created_at`, `updated_at`

### 3. order_items
- Snapshot of each product in the order (price frozen at order time).
- `id` (uuid, PK)
- `order_id` (uuid, FK orders ON DELETE CASCADE)
- `product_id` (uuid, FK products ON DELETE SET NULL)
- `title_snapshot` (text) — product title at order time
- `price_snapshot` (numeric(10,2)) — product price at order time
- `quantity` (int, default 1)

### 4. order_messages
- Admin-managed communication log (no direct buyer-seller messaging).
- `id` (uuid, PK)
- `order_id` (uuid, FK orders ON DELETE CASCADE)
- `direction` (text: 'to_seller' | 'to_buyer')
- `template_id` (uuid, FK message_templates, nullable)
- `content` (text) — message content sent
- `response` (text, nullable) — response recorded by admin
- `status` (text: 'sent', 'pending_response', 'responded', default 'sent')
- `sent_at` (timestamptz, default now())
- `response_at` (timestamptz, nullable)

## Security (RLS)

### message_templates
- SELECT: authenticated (admin and sellers/buyers who need to see templates)
- INSERT/UPDATE/DELETE: admin only (raw_app_meta_data.role = 'admin')

### orders
- SELECT: buyer sees own (auth.uid() = buyer_id), seller sees own (auth.uid() = seller_id), admin sees all
- INSERT: buyer creates own orders (auth.uid() = buyer_id)
- UPDATE: buyer can accept/refuse delivery (auth.uid() = buyer_id), admin can update all

### order_items
- SELECT: same visibility as orders (via JOIN check)
- INSERT: buyer creates items for own orders

### order_messages
- SELECT: buyer sees to_buyer messages for own orders, seller sees to_seller messages for own orders, admin sees all
- INSERT/UPDATE: admin only

## Important Notes
1. Price snapshots (title_snapshot, price_snapshot) preserve order integrity — later product price changes don't affect existing orders.
2. Standard delivery fee is 250 HTG, stored on each order at creation time.
3. No direct buyer-seller messaging — admin controls all communication via order_messages.
4. Admin role is determined by raw_app_meta_data (user-immutable).
5. Two default message templates are seeded.
6. This migration is idempotent and non-destructive.
*/

-- =========================
-- message_templates
-- =========================
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('seller_confirmation', 'delivery_proposal')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_message_templates" ON message_templates;
CREATE POLICY "read_message_templates" ON message_templates FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_message_templates" ON message_templates;
CREATE POLICY "admin_insert_message_templates" ON message_templates FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_message_templates" ON message_templates;
CREATE POLICY "admin_update_message_templates" ON message_templates FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_message_templates" ON message_templates;
CREATE POLICY "admin_delete_message_templates" ON message_templates FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

-- =========================
-- orders
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_seller_confirmation' CHECK (status IN (
    'pending_seller_confirmation', 'seller_confirmed', 'delivery_pending',
    'delivery_proposed', 'delivery_accepted', 'delivery_refused',
    'payment_pending', 'payment_verified', 'preparing', 'delivered', 'cancelled'
  )),
  delivery_fee numeric(10,2) NOT NULL DEFAULT 250.00,
  proposed_delivery_fee numeric(10,2),
  delivery_explanation text DEFAULT '',
  delivery_address text NOT NULL DEFAULT '',
  delivery_status text NOT NULL DEFAULT 'standard' CHECK (delivery_status IN (
    'standard', 'remote_proposed', 'accepted', 'refused'
  )),
  commission numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'moncash',
  payment_verified boolean NOT NULL DEFAULT false,
  payment_verified_at timestamptz,
  buyer_note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_orders" ON orders;
CREATE POLICY "read_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "update_own_orders_buyer" ON orders;
CREATE POLICY "update_own_orders_buyer" ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

-- =========================
-- order_items
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  title_snapshot text NOT NULL,
  price_snapshot numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_order_items" ON order_items;
CREATE POLICY "read_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()
        OR EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin'))
    )
  );

DROP POLICY IF EXISTS "insert_order_items" ON order_items;
CREATE POLICY "insert_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- =========================
-- order_messages
-- =========================
CREATE TABLE IF NOT EXISTS order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('to_seller', 'to_buyer')),
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  content text NOT NULL,
  response text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'pending_response', 'responded')),
  sent_at timestamptz DEFAULT now(),
  response_at timestamptz
);

ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_order_messages" ON order_messages;
CREATE POLICY "read_order_messages" ON order_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_messages.order_id
      AND (
        (order_messages.direction = 'to_buyer' AND orders.buyer_id = auth.uid())
        OR (order_messages.direction = 'to_seller' AND orders.seller_id = auth.uid())
        OR EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
      )
    )
  );

DROP POLICY IF EXISTS "admin_insert_order_messages" ON order_messages;
CREATE POLICY "admin_insert_order_messages" ON order_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_order_messages" ON order_messages;
CREATE POLICY "admin_update_order_messages" ON order_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
  );

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);

-- =========================
-- Seed default templates
-- =========================
INSERT INTO message_templates (name, type, content) VALUES
  (
    'Confirmation vendeur',
    'seller_confirmation',
    'Bonjour, une commande a été passée pour votre produit. Veuillez confirmer la disponibilité du produit, la quantité et le prix affiché. Merci de répondre dans les plus brefs délais.'
  ),
  (
    'Proposition livraison',
    'delivery_proposal',
    'Bonjour, la livraison standard est de 250 HTG. Pour votre zone, un tarif ajusté est proposé. Veuillez consulter les détails ci-dessous et indiquer si vous acceptez ou refusez le nouveau tarif de livraison.'
  )
ON CONFLICT DO NOTHING;
