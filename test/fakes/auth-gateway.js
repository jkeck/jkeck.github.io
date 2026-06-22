/** @typedef {import('../../assets/js/comments/ports.js').User} User */
/** @typedef {import('../../assets/js/comments/ports.js').AuthGateway} AuthGateway */

/** @implements {AuthGateway} */
export class FakeAuthGateway {
  constructor() {
    /** @type {User|null} */
    this._user = null
    /** @type {Array<(u: User|null) => void>} */
    this._listeners = []
  }

  /** @returns {User|null} */
  currentUser() { return this._user }

  async signInWithGoogle() {
    this._setUser({ id: 'google-user-1', isAnonymous: false, displayName: 'Test User', avatarUrl: null })
  }

  async signInAnonymously() {
    this._setUser({ id: 'anon-user-1', isAnonymous: true, displayName: null, avatarUrl: null })
  }

  async signOut() { this._setUser(null) }

  /** @param {(u: User|null) => void} cb @returns {() => void} */
  onChange(cb) {
    this._listeners.push(cb)
    return () => { this._listeners = this._listeners.filter(l => l !== cb) }
  }

  /** @param {User|null} user — test helper to force a specific auth state */
  _setUser(user) {
    this._user = user
    this._listeners.forEach(l => l(user))
  }
}
