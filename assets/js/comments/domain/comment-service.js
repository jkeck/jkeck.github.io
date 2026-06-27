/** @typedef {import('../ports.js').CommentsGateway} CommentsGateway */
/** @typedef {import('../ports.js').AuthGateway} AuthGateway */
/** @typedef {import('../ports.js').Comment} Comment */

import { normalizeBody } from './sanitize.js'

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

  /** @param {string} postSlug @returns {Promise<Comment[]>} */
  async load(postSlug) {
    return this._comments.list(postSlug)
  }

  /** @param {string} postSlug @param {string} rawBody @returns {Promise<Comment>} */
  async add(postSlug, rawBody) {
    const user = this._auth.currentUser()
    if (!user || user.isAnonymous) throw new AuthRequiredError()
    const body = normalizeBody(rawBody)
    return this._comments.add(postSlug, body)
  }

  /** @param {string} id @returns {Promise<void>} */
  async remove(id) {
    return this._comments.remove(id)
  }

  /** @param {string} id @returns {Promise<void>} */
  async approve(id) {
    return this._comments.approve(id)
  }
}
