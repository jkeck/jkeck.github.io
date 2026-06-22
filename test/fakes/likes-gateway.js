/** @typedef {import('../../assets/js/comments/ports.js').LikesGateway} LikesGateway */

/** @implements {LikesGateway} */
export class FakeLikesGateway {
  constructor() {
    /** @type {Map<string, Set<string>>} postSlug → Set of userIds */
    this._likes = new Map()
    /** The userId to attribute likes to — set by the test */
    this.currentUserId = 'test-user'
  }

  /** @param {string} postSlug @returns {Promise<number>} */
  async count(postSlug) {
    return this._likes.get(postSlug)?.size ?? 0
  }

  /** @param {string} postSlug @returns {Promise<boolean>} */
  async hasLiked(postSlug) {
    return this._likes.get(postSlug)?.has(this.currentUserId) ?? false
  }

  /** @param {string} postSlug @returns {Promise<void>} */
  async like(postSlug) {
    if (!this._likes.has(postSlug)) this._likes.set(postSlug, new Set())
    this._likes.get(postSlug)?.add(this.currentUserId)
  }

  /** @param {string} postSlug @returns {Promise<void>} */
  async unlike(postSlug) {
    this._likes.get(postSlug)?.delete(this.currentUserId)
  }
}
