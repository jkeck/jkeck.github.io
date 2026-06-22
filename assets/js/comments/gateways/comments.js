/** @typedef {import('../ports.js').CommentsGateway} CommentsGateway */
/** @typedef {import('../ports.js').Comment} Comment */

/** @implements {CommentsGateway} */
export class SupabaseCommentsGateway {
  /** @param {import('@supabase/supabase-js').SupabaseClient} client */
  constructor(client) {
    this._client = client
  }

  /** @param {string} postSlug @returns {Promise<Comment[]>} */
  async list(postSlug) {
    const { data, error } = await this._client
      .from('comments')
      .select('id, user_id, post_slug, body, status, created_at')
      .eq('post_slug', postSlug)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(row => ({
      id: row.id,
      userId: row.user_id,
      postSlug: row.post_slug,
      body: row.body,
      createdAt: row.created_at,
      displayName: null,
      avatarUrl: null,
    }))
  }

  /**
   * @param {string} postSlug
   * @param {string} body
   * @returns {Promise<Comment>}
   */
  async add(postSlug, body) {
    const { data: { user } } = await this._client.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await this._client
      .from('comments')
      .insert({ post_slug: postSlug, body, user_id: user.id })
      .select('id, user_id, post_slug, body, status, created_at')
      .single()
    if (error) throw error
    return {
      id: data.id,
      userId: data.user_id,
      postSlug: data.post_slug,
      body: data.body,
      createdAt: data.created_at,
      displayName: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    }
  }

  /** @param {string} id @returns {Promise<void>} */
  async remove(id) {
    const { error } = await this._client
      .from('comments')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
