// Integration — runs against local Supabase (`supabase start` + `supabase db reset`)
// Tests the DATABASE's RLS policies for the comments table.
// All negative tests must reject or return 0 affected rows.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { makeUser, makeAnonClient, deleteUsers, admin } from './setup.js'

const SLUG = 'rls-test-slice-2'

describe('comments RLS security', () => {
  /** @type {import('@supabase/supabase-js').User} */
  let userA
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientA
  /** @type {import('@supabase/supabase-js').User} */
  let userB
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientB

  beforeAll(async () => {
    const a = await makeUser('comments-rls-a@example.com')
    const b = await makeUser('comments-rls-b@example.com')
    userA = a.user; clientA = a.client
    userB = b.user; clientB = b.client
  })

  afterAll(async () => {
    await admin.from('comments').delete().in('user_id', [userA?.id, userB?.id].filter(Boolean))
    await deleteUsers(userA?.id, userB?.id)
  })

  // --- Negative: unauthenticated ---

  it('rejects unauthenticated insert', async () => {
    const anon = makeAnonClient()
    const { error } = await anon.from('comments').insert({
      user_id: userA.id,
      post_slug: SLUG,
      body: 'hello',
    })
    expect(error).not.toBeNull()
  })

  // --- Negative: identity spoofing ---

  it('rejects insert where user_id ≠ own uid (identity spoofing)', async () => {
    // Signed in as userA, claiming to be userB
    const { error } = await clientA.from('comments').insert({
      user_id: userB.id,
      post_slug: SLUG,
      body: 'spoofed comment',
    })
    expect(error).not.toBeNull()
  })

  // --- Negative: DB check constraints ---

  it('rejects insert with body length 0 (empty body)', async () => {
    const { error } = await clientA.from('comments').insert({
      user_id: userA.id,
      post_slug: SLUG,
      body: '',
    })
    expect(error).not.toBeNull()
  })

  it('rejects insert with body length > 2000', async () => {
    const { error } = await clientA.from('comments').insert({
      user_id: userA.id,
      post_slug: SLUG,
      body: 'a'.repeat(2001),
    })
    expect(error).not.toBeNull()
  })

  // --- Positive: insert as self ---

  it('allows insert attributed to self', async () => {
    const { error } = await clientA.from('comments').insert({
      user_id: userA.id,
      post_slug: SLUG,
      body: 'valid comment from A',
    })
    expect(error).toBeNull()
  })

  // --- userB also inserts for cross-user tests below ---

  it('allows userB to insert attributed to self', async () => {
    const { error } = await clientB.from('comments').insert({
      user_id: userB.id,
      post_slug: SLUG,
      body: 'valid comment from B',
    })
    expect(error).toBeNull()
  })

  // --- Negative: update another user's comment ---

  it("cannot update another user's comment (0 rows affected)", async () => {
    // Get B's comment id
    const { data: bComments } = await clientB
      .from('comments')
      .select('id')
      .eq('user_id', userB.id)
      .eq('post_slug', SLUG)
    const bId = bComments?.[0]?.id
    expect(bId).toBeDefined()

    // userA tries to update B's comment — RLS excludes the row
    const { data, error } = await clientA
      .from('comments')
      .update({ body: 'tampered' })
      .eq('id', bId)
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  // --- Negative: delete another user's comment ---

  it("cannot delete another user's comment (0 rows affected)", async () => {
    const { data: bComments } = await clientB
      .from('comments')
      .select('id')
      .eq('user_id', userB.id)
      .eq('post_slug', SLUG)
    const bId = bComments?.[0]?.id
    expect(bId).toBeDefined()

    const { data, error } = await clientA
      .from('comments')
      .delete()
      .eq('id', bId)
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  // --- Negative: hidden comments not visible to other users ---

  it('hidden comment is not visible to other users', async () => {
    // userA hides their own comment
    const { data: aComments } = await clientA
      .from('comments')
      .select('id')
      .eq('user_id', userA.id)
      .eq('post_slug', SLUG)
    const aId = aComments?.[0]?.id
    expect(aId).toBeDefined()

    // userA hides it (update own comment — allowed)
    const { error: updateErr } = await clientA
      .from('comments')
      .update({ status: 'hidden' })
      .eq('id', aId)
    expect(updateErr).toBeNull()

    // userB tries to read it — should not see the hidden comment
    const { data, error } = await clientB
      .from('comments')
      .select('id')
      .eq('id', aId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)

    // But userA can still see their own hidden comment
    const { data: selfView } = await clientA
      .from('comments')
      .select('id')
      .eq('id', aId)
    expect(selfView).toHaveLength(1)
  })

  // --- Public read of visible comments ---

  it('anyone can read visible comments (no auth required)', async () => {
    const anon = makeAnonClient()
    const { data, error } = await anon
      .from('comments')
      .select('id, body')
      .eq('post_slug', SLUG)
      .eq('status', 'visible')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })
})
