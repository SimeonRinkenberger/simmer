-- Meal-prep videos: one card can hold several distinct recipes
alter table public.recipes add column if not exists sub_recipes jsonb not null default '[]'::jsonb;
