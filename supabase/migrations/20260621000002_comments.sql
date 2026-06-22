-- Slice 2: comments table + RLS policies

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_slug   text not null check (char_length(post_slug) between 1 and 200),
  body        text not null check (char_length(body) between 1 and 2000),
  status      text not null default 'visible' check (status in ('visible','pending','hidden')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index comments_post_slug_idx on public.comments (post_slug, created_at);

alter table public.comments enable row level security;

-- Grant table-level access so Postgres lets the roles reach the RLS layer.
-- Without these, requests fail with 42501 before any policy is evaluated.
grant select on public.comments to anon;
grant select, insert, update, delete on public.comments to authenticated;

-- Visible comments are readable by everyone; the author can also see their own hidden/pending ones
create policy "visible comments are readable by everyone"
  on public.comments for select
  using (status = 'visible' or auth.uid() = user_id);

-- Users may only insert comments attributed to themselves, with visible status
create policy "users can comment as themselves"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and status = 'visible'
    and char_length(body) between 1 and 2000
  );

-- Users may edit their own comment (can set to visible or hidden, not pending — no admin escalation)
create policy "users can edit their own comment"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('visible', 'hidden'));

-- Users may delete their own comment
create policy "users can delete their own comment"
  on public.comments for delete
  using (auth.uid() = user_id);
