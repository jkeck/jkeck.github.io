/** @typedef {import('../domain/like-service.js').LikeService} LikeService */

/**
 * @typedef {Object} LikeButtonDeps
 * @property {LikeService} likeService
 * @property {string} postSlug
 */

export class LikeButton {
  /** @param {LikeButtonDeps} deps */
  constructor(deps) {
    this._service = deps.likeService
    this._slug = deps.postSlug
    this._el = /** @type {HTMLElement|null} */ (null)
    this._state = { count: 0, hasLiked: false, loading: false }
  }

  /** @param {HTMLElement} el @returns {this} */
  mount(el) {
    this._el = el
    return this
  }

  /** @param {{ count?: number, hasLiked?: boolean, loading?: boolean }} state */
  render(state) {
    if (!this._el) return
    Object.assign(this._state, state)
    this._el.innerHTML = ''

    const btn = document.createElement('button')
    btn.className = `like-btn${this._state.hasLiked ? ' like-btn--active' : ''}`
    btn.setAttribute('aria-pressed', String(this._state.hasLiked))
    btn.setAttribute('aria-label', `Like this post (${this._state.count} like${this._state.count !== 1 ? 's' : ''})`)
    btn.disabled = this._state.loading

    const heart = document.createElement('span')
    heart.setAttribute('aria-hidden', 'true')
    heart.textContent = this._state.hasLiked ? '♥' : '♡'
    btn.appendChild(heart)

    const countEl = document.createElement('span')
    countEl.className = 'like-btn__count'
    countEl.setAttribute('aria-live', 'polite')
    countEl.setAttribute('aria-atomic', 'true')
    countEl.textContent = String(this._state.count)
    btn.appendChild(countEl)

    btn.addEventListener('click', () => this._handleClick())
    this._el.appendChild(btn)
  }

  destroy() {
    if (this._el) this._el.innerHTML = ''
    this._el = null
  }

  async _handleClick() {
    const prev = { ...this._state }
    // Optimistic update
    this.render({ count: prev.hasLiked ? prev.count - 1 : prev.count + 1, hasLiked: !prev.hasLiked, loading: true })
    try {
      const next = await this._service.toggle(this._slug)
      this.render({ ...next, loading: false })
    } catch {
      // Revert to previous state on error
      this.render({ ...prev, loading: false })
    }
  }
}
