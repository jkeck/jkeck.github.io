// Implemented in Slice 1
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

  /** @param {string} _postSlug @returns {Promise<{count: number, hasLiked: boolean}>} */
  async load(_postSlug) {
    return { count: 0, hasLiked: false }
  }

  /** @param {string} _postSlug @returns {Promise<{count: number, hasLiked: boolean}>} */
  async toggle(_postSlug) {
    return { count: 0, hasLiked: false }
  }
}
