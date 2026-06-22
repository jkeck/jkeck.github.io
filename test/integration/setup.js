import { createClient } from '@supabase/supabase-js'

// Local Supabase stack defaults (from `supabase start`).
// Override via env vars if your local port differs.
export const LOCAL_URL = process.env.SUPABASE_TEST_URL ?? 'http://127.0.0.1:54321'

// Local anon key — not a secret, generated from this project's JWT secret.
// Override via env var if running against a different local instance.
export const LOCAL_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Local service-role key — bypasses RLS, for test setup/teardown only, never shipped
const LOCAL_SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

/** Admin client — bypasses all RLS. Test setup/teardown only. */
export const admin = createClient(LOCAL_URL, LOCAL_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/**
 * Create a confirmed test user and return a signed-in client + user record.
 * @param {string} email
 * @returns {Promise<{ client: import('@supabase/supabase-js').SupabaseClient, user: import('@supabase/supabase-js').User }>}
 */
export async function makeUser(email) {
  const password = 'Test-Password-123!'
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`makeUser(${email}): ${error.message}`)

  const client = createClient(LOCAL_URL, LOCAL_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password })
  if (signInErr) throw new Error(`signIn(${email}): ${signInErr.message}`)

  return { client, user: data.user }
}

/** Unauthenticated client (no JWT). */
export function makeAnonClient() {
  return createClient(LOCAL_URL, LOCAL_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Remove test users by ID. */
export async function deleteUsers(/** @type {string[]} */ ...ids) {
  for (const id of ids.filter(Boolean)) {
    await admin.auth.admin.deleteUser(id)
  }
}
