-- Slice A: approval workflow
-- New comments land in 'pending' and require owner approval before becoming visible.

-- 0. Owner needs visibility into pending comments in order to approve them.
--    Replace the SELECT policy to also grant the owner full read access.
drop policy "visible comments are readable by everyone" on public.comments;

create policy "comments are readable by author, owner, and public for visible"
  on public.comments for select
  using (
    status = 'visible'
    or auth.uid() = user_id
    or auth.uid() = '0eccb957-ca0f-44bf-bc1d-e308dd330d26'
  );

-- 1. Default status is now 'pending' instead of 'visible'
alter table public.comments alter column status set default 'pending';

-- 2. Drop the old insert policy — it required status = 'visible' and allowed anonymous users
drop policy "users can comment as themselves" on public.comments;

-- 3. New insert policy:
--    - Only non-anonymous authenticated users (anonymous users cannot comment)
--    - Status must be 'pending'; self-approval on insert is blocked
--    - Uses is_anonymous JWT claim (present in GoTrue >= 2024-03).
--      IS NOT TRUE handles NULL correctly: non-anonymous JWTs lack the claim
--      entirely, so auth.jwt() ->> 'is_anonymous' is NULL → NULL IS NOT TRUE = true (allowed).
create policy "authenticated non-anonymous users can comment"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and (auth.jwt() ->> 'is_anonymous')::boolean is not true
    and status = 'pending'
    and char_length(body) between 1 and 2000
  );

-- 4. Drop the old user update policy — it allowed setting status to 'visible', bypassing approval
drop policy "users can edit their own comment" on public.comments;

-- 5. New user update policy: users can only hide their own comments, not self-approve
create policy "users can hide their own comment"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'hidden');

-- 6. Owner can approve any comment (set status from 'pending' to 'visible')
create policy "owner can approve comments"
  on public.comments for update
  using (auth.uid() = '0eccb957-ca0f-44bf-bc1d-e308dd330d26')
  with check (
    auth.uid() = '0eccb957-ca0f-44bf-bc1d-e308dd330d26'
    and status = 'visible'
  );
