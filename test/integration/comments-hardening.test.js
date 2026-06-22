// Slice 3 hardening tests — rate limit trigger + delete-my-data path.
// Runs against local Supabase (`supabase start` + `supabase db reset`).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { makeUser, deleteUsers, admin } from './setup.js'

const SLUG = 'hardening-test-slice-3'
const RATE_LIMIT = 5 // must match the trigger constant

describe('comment rate limiting', () => {
  /** @type {import('@supabase/supabase-js').User} */
  let user
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let client

  beforeAll(async () => {
    const u = await makeUser('rate-limit@example.com')
    user = u.user; client = u.client
  })

  afterAll(async () => {
    await admin.from('comments').delete().eq('user_id', user?.id)
    await deleteUsers(user?.id)
  })

  it(`allows up to ${RATE_LIMIT} comments within the window`, async () => {
    for (let i = 0; i < RATE_LIMIT; i++) {
      const { error } = await client.from('comments').insert({
        user_id: user.id,
        post_slug: SLUG,
        body: `comment ${i + 1}`,
      })
      expect(error).toBeNull()
    }
  })

  it(`rejects the ${RATE_LIMIT + 1}th comment in the same window`, async () => {
    const { error } = await client.from('comments').insert({
      user_id: user.id,
      post_slug: SLUG,
      body: 'one too many',
    })
    expect(error).not.toBeNull()
    // Postgres RAISE EXCEPTION with custom errcode P0001
    expect(error?.code).toBe('P0001')
  })
})

describe('delete my data (self-delete)', () => {
  /** @type {import('@supabase/supabase-js').User} */
  let userA
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientA
  /** @type {import('@supabase/supabase-js').User} */
  let userB
  /** @type {import('@supabase/supabase-js').SupabaseClient} */
  let clientB

  beforeAll(async () => {
    const a = await makeUser('delete-data-a@example.com')
    const b = await makeUser('delete-data-b@example.com')
    userA = a.user; clientA = a.client
    userB = b.user; clientB = b.client

    // Each user inserts two comments
    for (const body of ['A comment 1', 'A comment 2']) {
      await clientA.from('comments').insert({ user_id: userA.id, post_slug: SLUG, body })
    }
    for (const body of ['B comment 1', 'B comment 2']) {
      await clientB.from('comments').insert({ user_id: userB.id, post_slug: SLUG, body })
    }
  })

  afterAll(async () => {
    await admin.from('comments').delete().in('user_id', [userA?.id, userB?.id].filter(Boolean))
    await deleteUsers(userA?.id, userB?.id)
  })

  it('user can delete all their own comments in one operation', async () => {
    const { data, error } = await clientA
      .from('comments')
      .delete()
      .eq('user_id', userA.id)
      .select()
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThanOrEqual(2)
  })

  it("deleting own comments does not affect other users' comments", async () => {
    const { data, error } = await clientB
      .from('comments')
      .select('id')
      .eq('user_id', userB.id)
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThanOrEqual(2)
  })
})
