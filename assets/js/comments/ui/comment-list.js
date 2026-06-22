/** @typedef {import('../ports.js').Comment} Comment */
/** @typedef {import('../ports.js').User} User */

/**
 * @typedef {Object} CommentListDeps
 * @property {string} [currentUserId]
 * @property {(id: string) => Promise<void>} onRemove
 */

export class CommentList {
  /** @param {CommentListDeps} deps */
  constructor(deps) {
    this._deps = deps
    /** @type {HTMLElement|null} */
    this._el = null
  }

  /** @param {HTMLElement} el @returns {this} */
  mount(el) {
    this._el = el
    return this
  }

  /**
   * @param {{ comments: Comment[], currentUserId?: string|null }} state
   */
  render(state) {
    if (!this._el) return
    this._el.innerHTML = ''

    if (state.comments.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'comments-empty'
      empty.textContent = 'No comments yet. Be the first!'
      this._el.appendChild(empty)
      return
    }

    const list = document.createElement('ol')
    list.className = 'comments-list'

    for (const comment of state.comments) {
      const item = document.createElement('li')
      item.className = 'comment'
      item.dataset.commentId = comment.id

      const header = document.createElement('div')
      header.className = 'comment__header'

      if (comment.avatarUrl) {
        const img = document.createElement('img')
        img.src = comment.avatarUrl
        img.alt = ''
        img.className = 'comment__avatar'
        img.width = 20
        img.height = 20
        header.appendChild(img)
      }

      const name = document.createElement('span')
      name.className = 'comment__name'
      name.textContent = comment.displayName ?? 'Anonymous'
      header.appendChild(name)

      const time = document.createElement('time')
      time.className = 'comment__time'
      time.setAttribute('datetime', comment.createdAt)
      time.textContent = new Date(comment.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
      header.appendChild(time)

      item.appendChild(header)

      const body = document.createElement('p')
      body.className = 'comment__body'
      body.textContent = comment.body
      item.appendChild(body)

      if (state.currentUserId && (comment.userId === state.currentUserId || state.isOwner)) {
        const deleteBtn = document.createElement('button')
        deleteBtn.className = 'comment__delete engagement-btn engagement-btn--ghost'
        deleteBtn.textContent = 'Delete'
        deleteBtn.setAttribute('aria-label', 'Delete this comment')
        deleteBtn.addEventListener('click', () => this._deps.onRemove(comment.id))
        item.appendChild(deleteBtn)
      }

      list.appendChild(item)
    }

    this._el.appendChild(list)
  }

  destroy() {
    if (this._el) this._el.innerHTML = ''
    this._el = null
  }
}
