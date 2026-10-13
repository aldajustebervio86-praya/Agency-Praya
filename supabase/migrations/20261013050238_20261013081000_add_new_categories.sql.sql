/*
# Add new categories for expanded marketplace

## Summary
Adds categories for phone accessories, virtual cards/digital products, and gaming/recharges.
Updates existing categories to match the full requested list.

## Changes
- Inserts new categories: Accessoires de téléphone, Cartes virtuelles et produits numériques, Jeux et recharges
- Existing categories are preserved
*/

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Accessoires de téléphone', 'accessoires-telephone', 'Smartphone', 8),
  ('Cartes virtuelles et produits numériques', 'cartes-virtuelles', 'CreditCard', 9),
  ('Jeux et recharges', 'jeux-et-recharges', 'Gamepad2', 10)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;