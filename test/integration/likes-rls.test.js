// Integration — runs against local Supabase (`supabase start` + `supabase db reset`)
// Tests the DATABASE's RLS policies, not our gateway code.
// All negative tests must reject or return 0 affected rows.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { makeUser, makeAnonClient, deleteUsers, admin } from './setup.js'

const SLUG = 'rls-test-slice-1'

describe('likes RLS security', () => {
  /** @type {import('@supabase/supabase-js').User} */
  let userA
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientA
  /** @type {import('@supabase/supabase-js').User} */
  let userB
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientB

  beforeAll(async () => {
    const a = await makeUser('likes-rls-a@example.com')
    const b = await makeUser('likes-rls-b@example.com')
    userA = a.user; clientA = a.client
    userB = b.user; clientB = b.client
  })

  afterAll(async () => {
    await admin.from('likes').delete().in('user_id', [userA?.id, userB?.id].filter(Boolean))
    await deleteUsers(userA?.id, userB?.id)
  })

  // --- Negative tests (must all reject) ---

  it('rejects unauthenticated insert', async () => {
    const anon = makeAnonClient()
    const { error } = await anon.from('likes').insert({ user_id: userA.id, post_slug: SLUG })
    expect(error).not.toBeNull()
  })

  it('rejects insert where user_id ≠ own uid (identity spoofing)', async () => {
    // Signed in as userA, claiming to be userB
    const { error } = await clientA.from('likes').insert({ user_id: userB.id, post_slug: SLUG })
    expect(error).not.toBeNull()
  })

  // --- Positive test ---

  it('allows insert attributed to self', async () => {
    const { error } = await clientA.from('likes').insert({ user_id: userA.id, post_slug: SLUG })
    expect(error).toBeNull()
  })

  // --- Negative: duplicate ---

  it('rejects duplicate like for the same (user_id, post_slug)', async () => {
    const { error } = await clientA.from('likes').insert({ user_id: userA.id, post_slug: SLUG })
    expect(error).not.toBeNull()
    // Postgres unique violation code
    expect(error?.code).toBe('23505')
  })

  // --- Public read ---

  it('allows anyone to read like counts (no auth required)', async () => {
    const anon = makeAnonClient()
    const { data, error } = await anon
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_slug', SLUG)
    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })

  // --- Delete: positive ---

  it('allows user to delete their own like', async () => {
    const { error } = await clientA
      .from('likes')
      .delete()
      .eq('post_slug', SLUG)
      .eq('user_id', userA.id)
    expect(error).toBeNull()
  })

  // --- Delete: negative (RLS silently excludes, returns 0 rows) ---

  it("cannot delete another user's like (RLS returns 0 affected rows)", async () => {
    // userB inserts a like
    await clientB.from('likes').insert({ user_id: userB.id, post_slug: SLUG })
    // userA attempts to delete it — RLS excludes the row, 0 rows deleted, no error
    const { data, error } = await clientA
      .from('likes')
      .delete()
      .eq('post_slug', SLUG)
      .eq('user_id', userB.id)
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})
