-- Where the recipe was found when the caption didn't contain it
alter table public.recipes add column if not exists source_url text;
