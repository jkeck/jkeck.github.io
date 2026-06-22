/** @typedef {import('../ports.js').User} User */

/**
 * @typedef {Object} AuthControlsDeps
 * @property {() => Promise<void>} signInWithGoogle
 * @property {() => Promise<void>} signOut
 */

export class AuthControls {
  /** @param {AuthControlsDeps} deps */
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

  /** @param {{ user: User|null }} state */
  render(state) {
    if (!this._el) return
    this._el.innerHTML = ''

    if (!state.user) {
      const btn = document.createElement('button')
      btn.setAttribute('data-action', 'sign-in')
      btn.className = 'engagement-btn engagement-btn--primary'
      btn.textContent = 'Sign in with Google'
      btn.addEventListener('click', () => this._deps.signInWithGoogle())
      this._el.appendChild(btn)
    } else {
      const wrapper = document.createElement('div')
      wrapper.className = 'engagement-identity'

      if (state.user.avatarUrl) {
        const img = document.createElement('img')
        img.src = state.user.avatarUrl
        img.alt = ''
        img.className = 'engagement-avatar'
        img.width = 24
        img.height = 24
        wrapper.appendChild(img)
      }

      const name = document.createElement('span')
      name.className = 'engagement-display-name'
      name.textContent = state.user.displayName ?? (state.user.isAnonymous ? 'Anonymous' : 'You')
      wrapper.appendChild(name)

      const btn = document.createElement('button')
      btn.setAttribute('data-action', 'sign-out')
      btn.className = 'engagement-btn engagement-btn--ghost'
      btn.textContent = 'Sign out'
      btn.addEventListener('click', () => this._deps.signOut())
      wrapper.appendChild(btn)

      this._el.appendChild(wrapper)
    }
  }

  destroy() {
    if (this._el) this._el.innerHTML = ''
    this._el = null
  }
}
