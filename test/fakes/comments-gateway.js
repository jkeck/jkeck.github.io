/** @typedef {import('../../assets/js/comments/ports.js').CommentsGateway} CommentsGateway */
/** @typedef {import('../../assets/js/comments/ports.js').Comment} Comment */

/** @implements {CommentsGateway} */
export class FakeCommentsGateway {
  constructor() {
    /** @type {Comment[]} */
    this._comments = []
    this.currentUserId = 'test-user'
  }

  /** @param {string} postSlug @returns {Promise<Comment[]>} */
  async list(postSlug) {
    return this._comments.filter(c =>
      c.postSlug === postSlug &&
      (c.status === 'visible' || c.userId === this.currentUserId)
    )
  }

  /** @param {string} postSlug @param {string} body @returns {Promise<Comment>} */
  async add(postSlug, body) {
    const comment = {
      id: crypto.randomUUID(),
      userId: this.currentUserId,
      postSlug,
      body,
      status: /** @type {'pending'} */ ('pending'),
      createdAt: new Date().toISOString(),
      displayName: null,
      avatarUrl: null,
    }
    this._comments.push(comment)
    return comment
  }

  /** @param {string} id @returns {Promise<void>} */
  async remove(id) {
    this._comments = this._comments.filter(c => c.id !== id)
  }

  /** @param {string} id @returns {Promise<void>} */
  async approve(id) {
    const comment = this._comments.find(c => c.id === id)
    if (comment) comment.status = 'visible'
  }
}
