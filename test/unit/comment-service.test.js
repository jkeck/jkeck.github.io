import { describe, it, expect } from 'vitest'
import { CommentService, AuthRequiredError } from '../../assets/js/comments/domain/comment-service.js'
import { FakeCommentsGateway } from '../fakes/comments-gateway.js'
import { FakeAuthGateway } from '../fakes/auth-gateway.js'

function makeService() {
  const auth = new FakeAuthGateway()
  const comments = new FakeCommentsGateway()
  const service = new CommentService(comments, auth)
  return { service, comments, auth }
}

describe('CommentService.load', () => {
  it('returns empty array when no comments exist', async () => {
    const { service } = makeService()
    expect(await service.load('my-post')).toEqual([])
  })

  it('returns comments for the given slug only', async () => {
    const { service, comments } = makeService()
    await comments.add('my-post', 'hello')
    await comments.add('other-post', 'other')
    const result = await service.load('my-post')
    expect(result).toHaveLength(1)
    expect(result[0].body).toBe('hello')
  })
})

describe('CommentService.add — auth validation', () => {
  it('throws AuthRequiredError when no user is signed in', async () => {
    const { service } = makeService()
    await expect(service.add('my-post', 'hello')).rejects.toThrow(AuthRequiredError)
  })

  it('throws AuthRequiredError when user is anonymous', async () => {
    const { service, auth } = makeService()
    await auth.signInAnonymously()
    await expect(service.add('my-post', 'hello')).rejects.toThrow(AuthRequiredError)
  })

  it('does not throw for a non-anonymous signed-in user', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    await expect(service.add('my-post', 'hello')).resolves.toBeDefined()
  })
})

describe('CommentService.add — body validation', () => {
  it('throws TypeError for empty body', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    await expect(service.add('my-post', '')).rejects.toThrow(TypeError)
    await expect(service.add('my-post', '   ')).rejects.toThrow(TypeError)
  })

  it('throws TypeError when body exceeds 2000 characters', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    await expect(service.add('my-post', 'a'.repeat(2001))).rejects.toThrow(TypeError)
  })

  it('accepts body of exactly 2000 characters', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    await expect(service.add('my-post', 'a'.repeat(2000))).resolves.toBeDefined()
  })
})

describe('CommentService.add — success path', () => {
  it('returns the created Comment with normalized body', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    const comment = await service.add('my-post', '  hello world  ')
    expect(comment.body).toBe('hello world')
    expect(comment.postSlug).toBe('my-post')
    expect(comment.id).toBeDefined()
  })

  it('added comment appears in load result', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    await service.add('my-post', 'a comment')
    const result = await service.load('my-post')
    expect(result).toHaveLength(1)
    expect(result[0].body).toBe('a comment')
  })

  it('multiple comments accumulate', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    await service.add('my-post', 'first')
    await service.add('my-post', 'second')
    expect(await service.load('my-post')).toHaveLength(2)
  })
})

describe('CommentService.remove', () => {
  it('removes a comment by id', async () => {
    const { service, auth } = makeService()
    await auth.signInWithGoogle()
    const comment = await service.add('my-post', 'to delete')
    await service.remove(comment.id)
    expect(await service.load('my-post')).toHaveLength(0)
  })

  it('is a no-op for an unknown id', async () => {
    const { service } = makeService()
    await expect(service.remove('nonexistent-id')).resolves.toBeUndefined()
  })
})
