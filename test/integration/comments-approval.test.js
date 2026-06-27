// Integration — runs against local Supabase (`supabase start` + `supabase db reset`)
// Tests the approval workflow RLS policies added in migration 20260627000001.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  makeUser,
  makeOwner,
  makeAnonymousUser,
  makeAnonClient,
  deleteUsers,
  admin,
  OWNER_ID,
} from './setup.js'

const SLUG = 'approval-test-slice-a'

describe('comment approval workflow', () => {
  /** @type {import('@supabase/supabase-js').User} */
  let userA
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientA
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let ownerClient

  beforeAll(async () => {
    const a = await makeUser('approval-user-a@example.com')
    userA = a.user; clientA = a.client
    const o = await makeOwner()
    ownerClient = o.client
  })

  afterAll(async () => {
    await admin.from('comments').delete().eq('post_slug', SLUG)
    await deleteUsers(userA?.id)
    // Owner user is reused across test runs — leave it in place
  })

  // --- New comments land in 'pending' ---

  it('new comment has status pending by default', async () => {
    const { data, error } = await clientA
      .from('comments')
      .insert({ user_id: userA.id, post_slug: SLUG, body: 'hello from A' })
      .select('id, status')
      .single()
    expect(error).toBeNull()
    expect(data?.status).toBe('pending')
  })

  // --- Anonymous users cannot comment ---

  it('rejects comment insert from an anonymous user', async () => {
    let anonResult
    try {
      anonResult = await makeAnonymousUser()
    } catch (e) {
      // Anonymous sign-ins can be disabled in local stack; needs `supabase stop && supabase start`
      // after setting enable_anonymous_sign_ins = true in supabase/config.toml.
      if (String(e.message).includes('disabled')) {
        console.warn('SKIP: anonymous sign-ins not enabled — restart local stack to test this case')
        return
      }
      throw e
    }
    const { client: anonClient, user: anonUser } = anonResult
    const { error } = await anonClient
      .from('comments')
      .insert({ user_id: anonUser?.id, post_slug: SLUG, body: 'anon comment' })
    expect(error).not.toBeNull()
    if (anonUser) await deleteUsers(anonUser.id)
  })

  // --- Self-approval is blocked ---

  it('user cannot self-approve their own pending comment', async () => {
    const { data: inserted } = await clientA
      .from('comments')
      .insert({ user_id: userA.id, post_slug: SLUG, body: 'self-approve attempt' })
      .select('id')
      .single()
    const id = inserted?.id

    // Postgres throws 42501 when the row is visible (USING matches) but
    // WITH CHECK fails — unlike the silent 0-rows case when USING itself fails.
    const { error } = await clientA
      .from('comments')
      .update({ status: 'visible' })
      .eq('id', id)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('42501')
  })

  // --- Pending comment visibility ---

  it('pending comment is visible to its author', async () => {
    const { data } = await clientA
      .from('comments')
      .select('id, status')
      .eq('post_slug', SLUG)
      .eq('status', 'pending')
    expect(data?.length).toBeGreaterThanOrEqual(1)
  })

  it('pending comment is not visible to unauthenticated readers', async () => {
    const anon = makeAnonClient()
    const { data, error } = await anon
      .from('comments')
      .select('id')
      .eq('post_slug', SLUG)
      .eq('status', 'pending')
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  // --- Owner approval ---

  it('owner can approve a pending comment', async () => {
    // Insert a fresh comment so this test doesn't depend on prior test state
    const { data: inserted } = await clientA
      .from('comments')
      .insert({ user_id: userA.id, post_slug: SLUG, body: 'please approve me' })
      .select('id')
      .single()
    const id = inserted?.id
    expect(id).toBeDefined()

    const { data, error } = await ownerClient
      .from('comments')
      .update({ status: 'visible' })
      .eq('id', id)
      .select('id, status')
    expect(error).toBeNull()
    expect(data?.[0]?.status).toBe('visible')
  })

  it('approved comment is visible to unauthenticated readers', async () => {
    const anon = makeAnonClient()
    const { data, error } = await anon
      .from('comments')
      .select('id')
      .eq('post_slug', SLUG)
      .eq('status', 'visible')
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThanOrEqual(1)
  })

  it('non-owner cannot approve a pending comment (0 rows affected)', async () => {
    // Insert a fresh pending comment
    const { data: inserted } = await clientA
      .from('comments')
      .insert({ user_id: userA.id, post_slug: SLUG, body: 'another pending' })
      .select('id')
      .single()
    const id = inserted?.id

    const userB = await makeUser('approval-user-b@example.com')
    const { data, error } = await userB.client
      .from('comments')
      .update({ status: 'visible' })
      .eq('id', id)
      .select()
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
    await deleteUsers(userB.user.id)
  })
})
