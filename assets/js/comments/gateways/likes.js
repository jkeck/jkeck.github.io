// Implemented in Slice 1
export class SupabaseLikesGateway {
  /** @param {import('@supabase/supabase-js').SupabaseClient} _client */
  constructor(_client) {
    this._client = _client
  }

  /** @param {string} _postSlug @returns {Promise<number>} */
  async count(_postSlug) { return 0 }

  /** @param {string} _postSlug @returns {Promise<boolean>} */
  async hasLiked(_postSlug) { return false }

  /** @param {string} _postSlug @returns {Promise<void>} */
  async like(_postSlug) {}

  /** @param {string} _postSlug @returns {Promise<void>} */
  async unlike(_postSlug) {}
}
