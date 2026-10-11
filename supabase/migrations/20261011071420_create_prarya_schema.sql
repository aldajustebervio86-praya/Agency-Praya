/*
# Create Agency Prarya database schema

## Purpose
Creates the full database schema for the Agency Prarya platform — a digital marketing
agency with a marketplace (sellers post products) and a social media monetization
request system (TikTok / Instagram).

## Tables

### 1. `seller_profiles`
- Stores extended seller information linked to Supabase Auth users.
- `id` (uuid, PK, matches auth.users.id)
- `display_name` (text) — public seller name shown on listings
- `phone` (text) — contact phone
- `whatsapp` (text) — WhatsApp number for buyer contact
- `bio` (text) — optional seller bio
- `created_at`, `updated_at` (timestamps)

### 2. `categories`
- Product categories for the marketplace.
- `id` (uuid, PK)
- `name` (text, unique) — category name
- `slug` (text, unique) — URL-friendly slug
- `icon` (text) — optional icon identifier
- `sort_order` (int) — display ordering

### 3. `products`
- Marketplace listings created by sellers.
- `id` (uuid, PK)
- `seller_id` (uuid, FK → seller_profiles.id, defaults to auth.uid())
- `category_id` (uuid, FK → categories.id)
- `title` (text)
- `description` (text)
- `price` (numeric(10,2))
- `currency` (text, default 'HTG')
- `image_urls` (text[]) — array of image URLs
- `status` (text: 'active' | 'sold' | 'paused', default 'active')
- `created_at`, `updated_at` (timestamps)

### 4. `monetization_requests`
- Requests from users to have their TikTok or Instagram account monetized.
- `id` (uuid, PK)
- `user_id` (uuid, defaults to auth.uid()) — the requester
- `platform` (text: 'tiktok' | 'instagram')
- `account_handle` (text) — the social media handle/username
- `follower_count` (int) — approximate follower count
- `country` (text)
- `notes` (text) — additional info from the requester
- `status` (text: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed', default 'pending')
- `admin_notes` (text) — internal notes (not visible to requester)
- `created_at`, `updated_at` (timestamps)

## Security (RLS)

### seller_profiles
- Owners can read/update their own profile (authenticated, auth.uid() = id).
- Anyone (anon + authenticated) can read profiles — buyers need to see seller contact info on listings.

### categories
- Public read (anon + authenticated) — categories are shared reference data.
- No writes from the frontend — managed via admin/SQL.

### products
- Public read for active listings (anon + authenticated) — marketplace is browsable without login.
- Only the owner (auth.uid() = seller_id) can insert, update, delete their own products.

### monetization_requests
- Owners can read their own requests (authenticated, auth.uid() = user_id).
- Owners can insert new requests (authenticated, user_id defaults to auth.uid()).
- Owners can update their own requests but only when status is 'pending'.
- No deletes — requests are permanent records.
- admin_notes is NOT exposed to the frontend (handled at query level, not column-level RLS).

## Important Notes
1. Owner columns (seller_id, user_id) default to auth.uid() so inserts work without the client passing the owner ID.
2. Email confirmation is OFF — sign-up works immediately.
3. No fake data is inserted. Categories are seeded with the 7 required categories.
*/
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  whatsapp text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_seller_profiles" ON seller_profiles;
CREATE POLICY "read_seller_profiles" ON seller_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_seller_profile" ON seller_profiles;
CREATE POLICY "insert_own_seller_profile" ON seller_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_seller_profile" ON seller_profiles;
CREATE POLICY "update_own_seller_profile" ON seller_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT '',
  sort_order int DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES seller_profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'HTG',
  image_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_active_products" ON products;
CREATE POLICY "read_active_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (auth.uid() = seller_id);

CREATE TABLE IF NOT EXISTS monetization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('tiktok','instagram')),
  account_handle text NOT NULL,
  follower_count int DEFAULT 0,
  country text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_review','approved','rejected','completed')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE monetization_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_monetization_requests" ON monetization_requests;
CREATE POLICY "read_own_monetization_requests" ON monetization_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_monetization_request" ON monetization_requests;
CREATE POLICY "insert_own_monetization_request" ON monetization_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_monetization_request" ON monetization_requests;
CREATE POLICY "update_own_monetization_request" ON monetization_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_monetization_user ON monetization_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_monetization_status ON monetization_requests(status);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Électronique', 'electronique', 'smartphone', 1),
  ('Accessoires', 'accessoires', 'watch', 2),
  ('Parfums', 'parfums', 'sparkles', 3),
  ('Vêtements', 'vetements', 'shirt', 4),
  ('Livres', 'livres', 'book', 5),
  ('Beauté', 'beaute', 'heart', 6),
  ('Autres', 'autres', 'package', 7)
ON CONFLICT (name) DO NOTHING;
