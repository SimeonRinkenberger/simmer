-- Personal rating (1-5) and free-form notes on each recipe
alter table public.recipes add column if not exists rating smallint;
alter table public.recipes add column if not exists notes text;
