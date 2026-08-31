-- Store aisle for grocery-list grouping (Produce, Meat & Seafood, Dairy & Eggs,
-- Bakery, Pantry, Spices & Baking, Frozen, Other)
alter table public.grocery_items add column if not exists aisle text;
