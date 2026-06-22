// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { escapeHtml, normalizeBody } from '../../assets/js/comments/domain/sanitize.js'

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;')
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes double and single quotes', () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#x27;world&#x27;')
  })

  it('XSS payload renders as inert text (no raw HTML tags)', () => {
    const payload = '<img src=x onerror=alert(1)>'
    const escaped = escapeHtml(payload)
    // Tags are escaped — no raw < or > that would be parsed as HTML
    expect(escaped).not.toContain('<img')
    expect(escaped).not.toContain('>')
    expect(escaped).toContain('&lt;img')
    // When set as innerHTML, produces a text node — no img element created
    const el = document.createElement('div')
    el.innerHTML = escaped
    expect(el.querySelector('img')).toBeNull()
  })

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('normalizeBody', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeBody('  hello  ')).toBe('hello')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeBody('hello   world')).toBe('hello world')
  })

  it('throws on empty string', () => {
    expect(() => normalizeBody('')).toThrow('empty')
    expect(() => normalizeBody('   ')).toThrow('empty')
  })

  it('throws when body exceeds 2000 characters', () => {
    expect(() => normalizeBody('a'.repeat(2001))).toThrow('2000')
  })

  it('accepts a body of exactly 2000 characters', () => {
    expect(() => normalizeBody('a'.repeat(2000))).not.toThrow()
  })
})
