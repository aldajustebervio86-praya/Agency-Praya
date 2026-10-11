/*
# Fix: Grant SELECT on auth.users to authenticated role

## Problem
The admin RLS policies check `EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.raw_app_meta_data ->> 'role' = 'admin')`.
However, the `authenticated` role does not have SELECT privilege on `auth.users`,
causing every admin-gated query (orders, app_settings, vendor_payouts, message_templates,
order_messages, monetization_requests) to fail with:
  "permission denied for table users"

## Fix
Grant SELECT on auth.users to the `authenticated` role.
This is safe — the RLS policies on auth.users already restrict what rows each role can see.
Supabase officially documents this grant for patterns that query auth.users from RLS policies.
*/

GRANT SELECT ON auth.users TO authenticated;