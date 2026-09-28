-- Stack Fingerprint — usage tracking & showcase
-- Run once in the Supabase SQL Editor of the Stack Fingerprint project.
-- All access goes through the server with the service-role key: RLS is on
-- and no policies are defined, so the anon/publishable key can read nothing.

-- ── repos: every repository whose card has been seen anywhere ─────────────
create table if not exists public.sf_repos (
  repo            text primary key,              -- "owner/repo", lowercased
  status          text not null default 'new'    -- new | featured | hidden
                  check (status in ('new', 'featured', 'hidden')),
  first_seen      timestamptz not null default now(),
  last_seen       timestamptz not null default now(),
  total_hits      bigint not null default 0,
  sources         text[] not null default '{}',  -- readme | action | website | api | code_search

  -- GitHub metadata, refreshed on scan / feature
  meta            jsonb,
  meta_updated_at timestamptz,

  -- Showcase settings
  featured_at     timestamptz,
  featured_order  int not null default 0,
  featured_theme  text,
  featured_layout text,
  featured_params text,                           -- extra query string for the card
  notes           text
);

-- ── usage: aggregated card requests, one row per repo × source × referrer ─
create table if not exists public.sf_usage (
  id           bigint generated always as identity primary key,
  repo         text not null,
  sub_path     text not null default '',
  source       text not null,                     -- readme | action | website | api
  referer_host text not null default '',
  user_agent   text not null default '',
  hits         bigint not null default 0,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  last_params  text not null default '',          -- last query string (theme, layout…)
  unique (repo, sub_path, source, referer_host)
);
create index if not exists sf_usage_last_seen on public.sf_usage (last_seen desc);

-- ── embeds: where the card physically appears (GitHub code search) ────────
create table if not exists public.sf_embeds (
  id         bigint generated always as identity primary key,
  card_repo  text not null,                       -- repo shown on the card
  host_repo  text not null,                       -- repo containing the file
  path       text not null,
  html_url   text not null,
  kind       text not null,                       -- hotlink | action | workflow | config
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  unique (card_repo, host_repo, path)
);

-- ── scans: history of code-search runs ────────────────────────────────────
create table if not exists public.sf_scans (
  id          bigint generated always as identity primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  found       int not null default 0,
  new_repos   int not null default 0,
  error       text
);

alter table public.sf_repos  enable row level security;
alter table public.sf_usage  enable row level security;
alter table public.sf_embeds enable row level security;
alter table public.sf_scans  enable row level security;

-- ── track_hit: atomic upsert used by /api/card on every request ───────────
create or replace function public.sf_track_hit(
  p_repo text,
  p_sub_path text,
  p_source text,
  p_referer_host text,
  p_user_agent text,
  p_params text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into sf_usage (repo, sub_path, source, referer_host, user_agent, hits, last_params)
  values (p_repo, p_sub_path, p_source, p_referer_host, left(p_user_agent, 300), 1, left(p_params, 1000))
  on conflict (repo, sub_path, source, referer_host) do update
    set hits        = sf_usage.hits + 1,
        last_seen   = now(),
        user_agent  = excluded.user_agent,
        last_params = excluded.last_params;

  insert into sf_repos (repo, total_hits, sources)
  values (p_repo, 1, array[p_source])
  on conflict (repo) do update
    set total_hits = sf_repos.total_hits + 1,
        last_seen  = now(),
        sources    = case when p_source = any(sf_repos.sources)
                          then sf_repos.sources
                          else array_append(sf_repos.sources, p_source) end;
end;
$$;

revoke all on function public.sf_track_hit(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.sf_track_hit(text, text, text, text, text, text) to service_role;
