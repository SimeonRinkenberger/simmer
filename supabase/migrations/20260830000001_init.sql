-- Simmer: personal recipe-video library
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text not null,                    -- clean canonical link to the post
  shortcode text unique,                -- IG shortcode / tiktok video id (namespaced)
  platform text not null default 'instagram',
  kind text default 'reel',             -- reel | p | tv | video (used to build embed URL)
  author text,
  title text,
  caption text,
  thumb_url text,
  category text not null default 'Other',
  cuisine text,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  has_full_recipe boolean not null default false,
  favorite boolean not null default false
);

-- Locked down: only the service role (used inside the edge function) can touch it.
alter table public.recipes enable row level security;

-- Public-read bucket for cached thumbnails (Instagram CDN links expire; ours don't).
insert into storage.buckets (id, name, public)
values ('thumbs', 'thumbs', true)
on conflict (id) do nothing;
