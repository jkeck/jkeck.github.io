-- Slice 1: likes table + RLS policies

create table public.likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_slug   text not null check (char_length(post_slug) between 1 and 200),
  created_at  timestamptz not null default now(),
  unique (user_id, post_slug)
);

create index likes_post_slug_idx on public.likes (post_slug);

alter table public.likes enable row level security;

-- Grant table-level access so Postgres lets the roles reach the RLS layer.
-- Without these, requests fail with 42501 before any policy is evaluated.
grant select on public.likes to anon;
grant select, insert, delete on public.likes to authenticated;

-- Anyone can read like counts
create policy "likes are readable by everyone"
  on public.likes for select using (true);

-- Users may only insert a like attributed to themselves
create policy "users can like as themselves"
  on public.likes for insert
  with check (auth.uid() = user_id);

-- Users may only delete their own like
create policy "users can remove their own like"
  on public.likes for delete
  using (auth.uid() = user_id);
-- No update policy: likes are immutable; toggling = delete + insert
