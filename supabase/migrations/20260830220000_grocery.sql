-- Shared grocery list, fed from recipe ingredients
create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  text text not null,          -- original line, e.g. "2 cups flour"
  item text not null,          -- normalized name used for combining, e.g. "flour"
  recipe_id uuid,
  recipe_title text,
  checked boolean not null default false
);
alter table public.grocery_items enable row level security;
