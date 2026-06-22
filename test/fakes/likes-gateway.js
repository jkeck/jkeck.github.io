/** @typedef {import('../../assets/js/comments/ports.js').LikesGateway} LikesGateway */

/** @implements {LikesGateway} */
export class FakeLikesGateway {
  /**
   * @param {() => string} [getCurrentUserId] callback so the gateway stays in
   * sync with FakeAuthGateway without coupling them directly. Defaults to 'test-user'.
   */
  constructor(getCurrentUserId = () => 'test-user') {
    this._getCurrentUserId = getCurrentUserId
    /** @type {Map<string, Set<string>>} postSlug → Set of userIds */
    this._likes = new Map()
  }

  /** @param {string} postSlug @returns {Promise<number>} */
  async count(postSlug) {
    return this._likes.get(postSlug)?.size ?? 0
  }

  /** @param {string} postSlug @returns {Promise<boolean>} */
  async hasLiked(postSlug) {
    return this._likes.get(postSlug)?.has(this._getCurrentUserId()) ?? false
  }

  /** @param {string} postSlug @returns {Promise<void>} */
  async like(postSlug) {
    if (!this._likes.has(postSlug)) this._likes.set(postSlug, new Set())
    this._likes.get(postSlug)?.add(this._getCurrentUserId())
  }

  /** @param {string} postSlug @returns {Promise<void>} */
  async unlike(postSlug) {
    this._likes.get(postSlug)?.delete(this._getCurrentUserId())
  }
}
