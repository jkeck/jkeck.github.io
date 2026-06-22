/** @typedef {import('../ports.js').User} User */

/**
 * @typedef {Object} CommentFormDeps
 * @property {(body: string) => Promise<void>} onSubmit
 */

const MAX_BODY = 2000

export class CommentForm {
  /** @param {CommentFormDeps} deps */
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
   * @param {{ user: User|null, error?: string|null, submitting?: boolean }} state
   */
  render(state) {
    if (!this._el) return
    this._el.innerHTML = ''

    if (!state.user || state.user.isAnonymous) {
      const prompt = document.createElement('p')
      prompt.className = 'comment-form__sign-in-prompt'
      prompt.textContent = 'Sign in with Google to leave a comment.'
      this._el.appendChild(prompt)
      return
    }

    const form = document.createElement('form')
    form.className = 'comment-form'
    form.setAttribute('aria-label', 'Add a comment')

    const label = document.createElement('label')
    label.className = 'comment-form__label'
    label.setAttribute('for', 'comment-body')
    label.textContent = 'Your comment'
    form.appendChild(label)

    const textarea = document.createElement('textarea')
    textarea.id = 'comment-body'
    textarea.className = 'comment-form__textarea'
    textarea.setAttribute('maxlength', String(MAX_BODY))
    textarea.setAttribute('rows', '4')
    textarea.setAttribute('placeholder', 'Write a comment…')
    textarea.disabled = !!state.submitting
    form.appendChild(textarea)

    if (state.error) {
      const errEl = document.createElement('p')
      errEl.className = 'comment-form__error'
      errEl.setAttribute('role', 'alert')
      errEl.textContent = state.error
      form.appendChild(errEl)
    }

    const submitBtn = document.createElement('button')
    submitBtn.type = 'submit'
    submitBtn.className = 'comment-form__submit engagement-btn engagement-btn--primary'
    submitBtn.textContent = state.submitting ? 'Posting…' : 'Post comment'
    submitBtn.disabled = !!state.submitting
    form.appendChild(submitBtn)

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const body = textarea.value
      await this._deps.onSubmit(body)
    })

    this._el.appendChild(form)
  }

  destroy() {
    if (this._el) this._el.innerHTML = ''
    this._el = null
  }
}
