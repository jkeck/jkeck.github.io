// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { CommentList } from '../../assets/js/comments/ui/comment-list.js'

/** @returns {import('../../assets/js/comments/ports.js').Comment} */
function makeComment(overrides = {}) {
  return {
    id: 'comment-1',
    userId: 'user-a',
    postSlug: 'test-post',
    body: 'Hello world',
    createdAt: new Date().toISOString(),
    displayName: 'Alice',
    avatarUrl: null,
    ...overrides,
  }
}

function makeList() {
  const removed = []
  const el = document.createElement('div')
  const list = new CommentList({ onRemove: (id) => removed.push(id) }).mount(el)
  return { list, el, removed }
}

describe('CommentList — empty state', () => {
  it('renders an empty message when there are no comments', () => {
    const { list, el } = makeList()
    list.render({ comments: [], currentUserId: null })
    expect(el.querySelector('.comments-empty')).not.toBeNull()
    expect(el.querySelector('.comments-list')).toBeNull()
  })
})

describe('CommentList — comment rendering', () => {
  it('renders a comment body via textContent (no innerHTML)', () => {
    const { list, el } = makeList()
    const xss = '<img src=x onerror=alert(1)>'
    list.render({ comments: [makeComment({ body: xss })], currentUserId: null })
    const body = el.querySelector('.comment__body')
    expect(body?.textContent).toBe(xss)
    expect(el.querySelector('img')).toBeNull()
  })

  it('renders display name', () => {
    const { list, el } = makeList()
    list.render({ comments: [makeComment({ displayName: 'Alice' })], currentUserId: null })
    expect(el.querySelector('.comment__name')?.textContent).toBe('Alice')
  })

  it('falls back to Anonymous when displayName is null', () => {
    const { list, el } = makeList()
    list.render({ comments: [makeComment({ displayName: null })], currentUserId: null })
    expect(el.querySelector('.comment__name')?.textContent).toBe('Anonymous')
  })
})

describe('CommentList — delete affordance', () => {
  it('shows delete button on own comment', () => {
    const { list, el } = makeList()
    list.render({ comments: [makeComment({ userId: 'user-a' })], currentUserId: 'user-a' })
    expect(el.querySelector('.comment__delete')).not.toBeNull()
  })

  it("hides delete button on another user's comment for a regular user", () => {
    const { list, el } = makeList()
    list.render({ comments: [makeComment({ userId: 'user-b' })], currentUserId: 'user-a' })
    expect(el.querySelector('.comment__delete')).toBeNull()
  })

  it('shows delete button on any comment when isOwner is true', () => {
    const { list, el } = makeList()
    list.render({
      comments: [makeComment({ userId: 'user-b' })],
      currentUserId: 'owner-id',
      isOwner: true,
    })
    expect(el.querySelector('.comment__delete')).not.toBeNull()
  })

  it('does not show delete when not signed in even with a comment present', () => {
    const { list, el } = makeList()
    list.render({ comments: [makeComment({ userId: 'user-a' })], currentUserId: null })
    expect(el.querySelector('.comment__delete')).toBeNull()
  })
})

describe('CommentList — destroy', () => {
  it('clears the DOM on destroy', () => {
    const { list, el } = makeList()
    list.render({ comments: [makeComment()], currentUserId: null })
    list.destroy()
    expect(el.innerHTML).toBe('')
  })
})
