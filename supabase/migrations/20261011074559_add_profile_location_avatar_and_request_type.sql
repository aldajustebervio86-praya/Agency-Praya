/*
# Add location, avatar, request_type and admin policy support

## Purpose
Non-destructive additions to support the full seller profile (location + avatar)
and the monetization request type field. Also adds an admin policy so an authorized
admin can update the status of any monetization request.

## Changes

### 1. seller_profiles — new columns
- `location` (text, default '') — seller's geographic location
- `avatar_url` (text, default '') — URL to profile photo (stored in Supabase Storage or external)

### 2. monetization_requests — new column
- `request_type` (text, default 'monetization') — type of request (monetization, consultation, etc.)
  CHECK constraint allows: 'monetization', 'consultation', 'growth', 'other'

### 3. monetization_requests — admin update policy
- New UPDATE policy "admin_update_monetization_request" allowing users with
  raw_app_meta_data.role = 'admin' to update any request's status.
- The existing owner-scoped update policy remains for pending-only owner edits.

## Security
- All new columns are owner-scoped via existing RLS policies (seller_profiles UPDATE checks auth.uid() = id).
- admin_notes is still NOT exposed at the policy level — it remains protected at the query level
  (the frontend selects explicit columns, not SELECT *).
- Admin role is determined by raw_app_meta_data (user-immutable), NOT raw_user_meta_data.

## Important Notes
1. This migration is fully idempotent — uses DO $$ ... IF NOT EXISTS ... END $$ for column additions.
2. No data is lost — columns are added with safe defaults.
3. No tables are dropped or renamed.
4. Existing policies are preserved.
*/

-- Add location column to seller_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seller_profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE seller_profiles ADD COLUMN location text DEFAULT '';
  END IF;
END $$;

-- Add avatar_url column to seller_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seller_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE seller_profiles ADD COLUMN avatar_url text DEFAULT '';
  END IF;
END $$;

-- Add request_type column to monetization_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monetization_requests' AND column_name = 'request_type'
  ) THEN
    ALTER TABLE monetization_requests ADD COLUMN request_type text NOT NULL DEFAULT 'monetization';
  END IF;
END $$;

-- Add CHECK constraint for request_type (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monetization_requests_request_type_check'
  ) THEN
    ALTER TABLE monetization_requests
    ADD CONSTRAINT monetization_requests_request_type_check
    CHECK (request_type IN ('monetization', 'consultation', 'growth', 'other'));
  END IF;
END $$;

-- Admin update policy for monetization_requests
-- Allows admins (raw_app_meta_data.role = 'admin') to update any request status
DROP POLICY IF EXISTS "admin_update_monetization_request" ON monetization_requests;
CREATE POLICY "admin_update_monetization_request" ON monetization_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );
