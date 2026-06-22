// Implemented in Slice 2
/** @typedef {import('../ports.js').CommentsGateway} CommentsGateway */
/** @typedef {import('../ports.js').AuthGateway} AuthGateway */
/** @typedef {import('../ports.js').Comment} Comment */

export class AuthRequiredError extends Error {
  constructor() {
    super('Sign in with Google to leave a comment')
    this.name = 'AuthRequiredError'
  }
}

export class CommentService {
  /**
   * @param {CommentsGateway} commentsGateway
   * @param {AuthGateway} authGateway
   */
  constructor(commentsGateway, authGateway) {
    this._comments = commentsGateway
    this._auth = authGateway
  }

  /** @param {string} _postSlug @returns {Promise<Comment[]>} */
  async load(_postSlug) {
    return []
  }

  /** @param {string} _postSlug @param {string} _rawBody @returns {Promise<Comment>} */
  async add(_postSlug, _rawBody) {
    throw new Error('not implemented')
  }

  /** @param {string} _id @returns {Promise<void>} */
  async remove(_id) {}
}
