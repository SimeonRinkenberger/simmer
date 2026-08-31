-- Total time to make the recipe, in minutes (from the source page's schema
-- when available, otherwise AI-estimated alongside nutrition)
alter table public.recipes add column if not exists time_minutes integer;
