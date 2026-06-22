const MAX_BODY = 2000

/**
 * HTML-escape a string. Use this only when textContent is unavailable
 * (e.g. building attribute values). Prefer textContent for all user text.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Trim + collapse whitespace and enforce length bounds.
 * Throws a TypeError with a human-readable message on violation.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBody(raw) {
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (trimmed.length === 0) throw new TypeError('Comment cannot be empty')
  if (trimmed.length > MAX_BODY) throw new TypeError(`Comment must be ${MAX_BODY} characters or fewer`)
  return trimmed
}
