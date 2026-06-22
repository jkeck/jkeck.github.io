// Implemented in Slice 2
export class SupabaseCommentsGateway {
  /** @param {import('@supabase/supabase-js').SupabaseClient} _client */
  constructor(_client) {
    this._client = _client
  }

  /** @param {string} _postSlug @returns {Promise<import('../ports.js').Comment[]>} */
  async list(_postSlug) { return [] }

  /** @param {string} _postSlug @param {string} _body @returns {Promise<import('../ports.js').Comment>} */
  async add(_postSlug, _body) { throw new Error('not implemented') }

  /** @param {string} _id @returns {Promise<void>} */
  async remove(_id) {}
}
