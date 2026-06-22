/** @typedef {import('../ports.js').LikesGateway} LikesGateway */

/** @implements {LikesGateway} */
export class SupabaseLikesGateway {
  /** @param {import('@supabase/supabase-js').SupabaseClient} client */
  constructor(client) {
    this._client = client
  }

  /** @param {string} postSlug @returns {Promise<number>} */
  async count(postSlug) {
    const { count, error } = await this._client
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_slug', postSlug)
    if (error) throw error
    return count ?? 0
  }

  /** @param {string} postSlug @returns {Promise<boolean>} */
  async hasLiked(postSlug) {
    const { data: { user } } = await this._client.auth.getUser()
    if (!user) return false
    const { data, error } = await this._client
      .from('likes')
      .select('id')
      .eq('post_slug', postSlug)
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data !== null
  }

  /** @param {string} postSlug @returns {Promise<void>} */
  async like(postSlug) {
    const { data: { user } } = await this._client.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await this._client
      .from('likes')
      .insert({ post_slug: postSlug, user_id: user.id })
    // Swallow unique violation — idempotent by design
    if (error && error.code !== '23505') throw error
  }

  /** @param {string} postSlug @returns {Promise<void>} */
  async unlike(postSlug) {
    const { data: { user } } = await this._client.auth.getUser()
    if (!user) return
    const { error } = await this._client
      .from('likes')
      .delete()
      .eq('post_slug', postSlug)
      .eq('user_id', user.id)
    if (error) throw error
  }
}
