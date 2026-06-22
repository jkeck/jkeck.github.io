// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { AuthControls } from '../../assets/js/comments/ui/auth-controls.js'

function makeControls(overrides = {}) {
  return new AuthControls({
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  })
}

describe('AuthControls', () => {
  it('renders a sign-in button when user is null', () => {
    const el = document.createElement('div')
    makeControls().mount(el).render({ user: null })
    expect(el.querySelector('[data-action="sign-in"]')).not.toBeNull()
    expect(el.textContent).toContain('Sign in')
  })

  it('renders display name and sign-out button when signed in', () => {
    const el = document.createElement('div')
    makeControls().mount(el).render({
      user: { id: 'u1', isAnonymous: false, displayName: 'Jane Doe', avatarUrl: null },
    })
    expect(el.textContent).toContain('Jane Doe')
    expect(el.querySelector('[data-action="sign-out"]')).not.toBeNull()
    expect(el.querySelector('[data-action="sign-in"]')).toBeNull()
  })

  it('shows "Anonymous" for an anonymous user with no displayName', () => {
    const el = document.createElement('div')
    makeControls().mount(el).render({
      user: { id: 'u2', isAnonymous: true, displayName: null, avatarUrl: null },
    })
    expect(el.textContent).toContain('Anonymous')
  })

  it('calls signInWithGoogle when sign-in button is clicked', async () => {
    const signInWithGoogle = vi.fn()
    const el = document.createElement('div')
    makeControls({ signInWithGoogle }).mount(el).render({ user: null })
    const btn = /** @type {HTMLElement} */ (el.querySelector('[data-action="sign-in"]'))
    btn.click()
    expect(signInWithGoogle).toHaveBeenCalledOnce()
  })

  it('calls signOut when sign-out button is clicked', () => {
    const signOut = vi.fn()
    const el = document.createElement('div')
    makeControls({ signOut }).mount(el).render({
      user: { id: 'u1', isAnonymous: false, displayName: 'Jane', avatarUrl: null },
    })
    const btn = /** @type {HTMLElement} */ (el.querySelector('[data-action="sign-out"]'))
    btn.click()
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('clears the element on destroy', () => {
    const el = document.createElement('div')
    const ctrl = makeControls().mount(el)
    ctrl.render({ user: null })
    expect(el.childElementCount).toBeGreaterThan(0)
    ctrl.destroy()
    expect(el.childElementCount).toBe(0)
  })
})
