/** @typedef {import('../ports.js').User} User */

export class SupabaseAuthGateway {
  /** @param {import('@supabase/supabase-js').SupabaseClient} client */
  constructor(client) {
    this._client = client
    /** @type {User|null} */
    this._user = null
  }

  /** @returns {User|null} */
  currentUser() {
    return this._user
  }

  async signInWithGoogle() {
    const redirectTo = window.location.origin + window.location.pathname
    const { error } = await this._client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }

  async signInAnonymously() {
    await this._client.auth.signInAnonymously()
  }

  async signOut() {
    await this._client.auth.signOut()
  }

  /**
   * Subscribe to auth state. Fires immediately with the current session
   * (INITIAL_SESSION event). Returns an unsubscribe function.
   * @param {(u: User|null) => void} cb
   * @returns {() => void}
   */
  onChange(cb) {
    const { data } = this._client.auth.onAuthStateChange((_event, session) => {
      this._user = session?.user ? this._toUser(session.user) : null
      cb(this._user)
    })
    return () => data.subscription.unsubscribe()
  }

  /** @private */
  _toUser(/** @type {import('@supabase/supabase-js').User} */ u) {
    return {
      id: u.id,
      isAnonymous: u.is_anonymous ?? false,
      displayName: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
      avatarUrl: u.user_metadata?.avatar_url ?? null,
    }
  }
}
