/*
# Fix: Revoke anon EXECUTE on buyer SECURITY DEFINER functions (attempt 2)

The previous REVOKE didn't work because Supabase grants EXECUTE to PUBLIC
by default on all functions. Need to REVOKE FROM PUBLIC and also
REVOKE FROM anon specifically.
*/

REVOKE EXECUTE ON FUNCTION buyer_accept_delivery(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION buyer_accept_delivery(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION buyer_refuse_delivery(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION buyer_refuse_delivery(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION buyer_confirm_delivery(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION buyer_confirm_delivery(uuid) FROM anon;

-- Re-grant to authenticated only
GRANT EXECUTE ON FUNCTION buyer_accept_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION buyer_refuse_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION buyer_confirm_delivery(uuid) TO authenticated;