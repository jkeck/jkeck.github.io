-- Slice 3: rate-limit trigger — at most 5 comments per user per 60 seconds.
-- Runs BEFORE INSERT so no row is written before the check fires.
-- SECURITY DEFINER + fixed search_path so the count query bypasses RLS
-- (needed to count the user's own hidden/pending comments too — prevents gaming
-- the limit by hiding comments to reset the count).

create or replace function public.check_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  select count(*)
    into recent_count
    from public.comments
   where user_id = NEW.user_id
     and created_at > now() - interval '60 seconds';

  if recent_count >= 5 then
    raise exception 'Rate limit exceeded: too many comments in a short period'
      using errcode = 'P0001';
  end if;

  return NEW;
end;
$$;

create trigger comments_rate_limit
  before insert on public.comments
  for each row
  execute function public.check_comment_rate_limit();
