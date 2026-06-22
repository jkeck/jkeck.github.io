// Implemented in Slice 2
export class CommentList {
  /** @param {unknown} _deps */
  constructor(_deps) { this._el = /** @type {HTMLElement|null} */ (null) }
  /** @param {HTMLElement} el */
  mount(el) { this._el = el; return this }
  /** @param {unknown} _state */
  render(_state) {}
  destroy() { if (this._el) this._el.innerHTML = ''; this._el = null }
}
