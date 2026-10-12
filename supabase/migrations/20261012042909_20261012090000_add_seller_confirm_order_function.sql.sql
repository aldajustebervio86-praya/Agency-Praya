/*
# Add seller_confirm_order function

## Summary
Currently only the admin can mark an order as "seller_confirmed". The seller
themselves has no action button to confirm or refuse an order. This migration
adds a SECURITY DEFINER function that lets the seller confirm or refuse an
order, but only if:
1. They are the actual seller of that order (seller_id = auth.uid())
2. The order is in "pending_seller_confirmation" status

## Security
- SECURITY DEFINER function: runs with elevated privileges to update the order
- Internally checks auth.uid() = seller_id — a non-seller cannot call it
- Only allows specific status transitions (confirm -> seller_confirmed, refuse -> cancelled)
- Creates an order_messages row recording the seller's response
- REVOKE EXECUTE from anon and PUBLIC; GRANT to authenticated only
*/

CREATE OR REPLACE FUNCTION seller_confirm_order(p_order_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_result jsonb;
BEGIN
  -- Validate action
  IF p_action NOT IN ('confirm', 'refuse') THEN
    RETURN jsonb_build_object('error', 'Action invalide. Utilisez confirm ou refuse.');
  END IF;

  -- Fetch the order and verify ownership
  SELECT id, seller_id, status INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Commande introuvable.');
  END IF;

  IF v_order.seller_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('error', 'Vous n''êtes pas autorisé à gérer cette commande.');
  END IF;

  IF v_order.status IS DISTINCT FROM 'pending_seller_confirmation' THEN
    RETURN jsonb_build_object('error', 'Cette commande n''est plus en attente de confirmation.');
  END IF;

  -- Perform the action
  IF p_action = 'confirm' THEN
    UPDATE orders
    SET status = 'seller_confirmed',
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO order_messages (order_id, direction, content, status)
    VALUES (p_order_id, 'to_buyer',
      'Le vendeur a confirmé la disponibilité du produit. Votre commande est en cours de traitement.',
      'sent');

    v_result := jsonb_build_object('success', true, 'status', 'seller_confirmed');
  ELSE
    UPDATE orders
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO order_messages (order_id, direction, content, status)
    VALUES (p_order_id, 'to_buyer',
      'Le vendeur n''est pas en mesure de traiter cette commande. Elle a été annulée.',
      'sent');

    v_result := jsonb_build_object('success', true, 'status', 'cancelled');
  END IF;

  RETURN v_result;
END;
$$;

-- Restrict execution to authenticated only
REVOKE EXECUTE ON FUNCTION seller_confirm_order(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION seller_confirm_order(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION seller_confirm_order(uuid, text) TO authenticated;