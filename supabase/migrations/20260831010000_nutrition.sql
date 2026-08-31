-- Per-serving AI nutrition estimate: {calories, protein_g, carbs_g, fat_g, servings}
alter table public.recipes add column if not exists nutrition jsonb;
