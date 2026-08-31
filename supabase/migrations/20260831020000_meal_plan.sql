-- Weekly meal planner: one row per planned meal
create table if not exists public.meal_plan (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  day date not null,
  recipe_id uuid references public.recipes(id) on delete cascade,
  slot text not null default 'dinner'
);
alter table public.meal_plan enable row level security;
