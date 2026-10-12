/*
# Update seller_confirm_order to also insert to_seller message

## Summary
The previous version of seller_confirm_order only inserted a to_buyer message.
The seller should also see a message in their order tracking confirming their action.
This updates the function to insert both to_buyer and to_seller messages.
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
  IF p_action NOT IN ('confirm', 'refuse') THEN
    RETURN jsonb_build_object('error', 'Action invalide. Utilisez confirm ou refuse.');
  END IF;

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

  IF p_action = 'confirm' THEN
    UPDATE orders
    SET status = 'seller_confirmed',
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO order_messages (order_id, direction, content, status)
    VALUES (p_order_id, 'to_buyer',
      'Le vendeur a confirmé la disponibilité du produit. Votre commande est en cours de traitement.',
      'sent');

    INSERT INTO order_messages (order_id, direction, content, status)
    VALUES (p_order_id, 'to_seller',
      'Vous avez confirmé la disponibilité du produit pour cette commande.',
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

    INSERT INTO order_messages (order_id, direction, content, status)
    VALUES (p_order_id, 'to_seller',
      'Vous avez refusé cette commande. Elle a été annulée.',
      'sent');

    v_result := jsonb_build_object('success', true, 'status', 'cancelled');
  END IF;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION seller_confirm_order(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION seller_confirm_order(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION seller_confirm_order(uuid, text) TO authenticated;