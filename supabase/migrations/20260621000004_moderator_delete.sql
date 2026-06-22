-- Slice 5: owner moderation — site owner can delete any comment.
-- Security lives here in the DB; the frontend affordance is purely cosmetic.
create policy "owner can delete any comment"
  on public.comments for delete
  using (auth.uid() = '0eccb957-ca0f-44bf-bc1d-e308dd330d26');
