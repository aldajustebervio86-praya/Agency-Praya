/*
# Fix: Revoke anon EXECUTE on buyer SECURITY DEFINER functions

## Summary
The three buyer action functions (buyer_accept_delivery, buyer_refuse_delivery,
buyer_confirm_delivery) were callable by the anon role. While the functions
internally check auth.uid() and are safe, the anon role should not have
EXECUTE access as a defense-in-depth measure.

## Security Changes
- REVOKE EXECUTE on all three functions from anon
- Keep EXECUTE granted to authenticated (the functions check auth.uid() internally)
*/

REVOKE EXECUTE ON FUNCTION buyer_accept_delivery(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION buyer_refuse_delivery(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION buyer_confirm_delivery(uuid) FROM anon;