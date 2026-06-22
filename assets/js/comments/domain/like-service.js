/** @typedef {import('../ports.js').LikesGateway} LikesGateway */
/** @typedef {import('../ports.js').AuthGateway} AuthGateway */

export class LikeService {
  /**
   * @param {LikesGateway} likesGateway
   * @param {AuthGateway} authGateway
   */
  constructor(likesGateway, authGateway) {
    this._likes = likesGateway
    this._auth = authGateway
  }

  /** @param {string} postSlug @returns {Promise<{count: number, hasLiked: boolean}>} */
  async load(postSlug) {
    const [count, hasLiked] = await Promise.all([
      this._likes.count(postSlug),
      this._likes.hasLiked(postSlug),
    ])
    return { count, hasLiked }
  }

  /**
   * Toggle like. Signs in anonymously if no session exists (CAPTCHA-gated by Supabase).
   * Returns authoritative state after the operation.
   * @param {string} postSlug
   * @returns {Promise<{count: number, hasLiked: boolean}>}
   */
  async toggle(postSlug) {
    if (!this._auth.currentUser()) {
      await this._auth.signInAnonymously()
    }
    const hasLiked = await this._likes.hasLiked(postSlug)
    if (hasLiked) {
      await this._likes.unlike(postSlug)
    } else {
      await this._likes.like(postSlug)
    }
    return this.load(postSlug)
  }
}
