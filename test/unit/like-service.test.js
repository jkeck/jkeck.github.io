import { describe, it, expect, vi } from 'vitest'
import { LikeService } from '../../assets/js/comments/domain/like-service.js'
import { FakeLikesGateway } from '../fakes/likes-gateway.js'
import { FakeAuthGateway } from '../fakes/auth-gateway.js'

function makeService({ getCaptchaToken } = /** @type {{ getCaptchaToken?: () => Promise<string> }} */ ({})) {
  const auth = new FakeAuthGateway()
  // Gateway userId stays in sync with auth state
  const likes = new FakeLikesGateway(() => auth.currentUser()?.id ?? 'no-user')
  const service = new LikeService(likes, auth, getCaptchaToken)
  return { service, likes, auth }
}

describe('LikeService', () => {
  it('load returns count=0 hasLiked=false when nothing liked', async () => {
    const { service } = makeService()
    expect(await service.load('test-post')).toEqual({ count: 0, hasLiked: false })
  })

  it('toggle signs in anonymously when no session exists', async () => {
    const { service, auth } = makeService()
    expect(auth.currentUser()).toBeNull()
    await service.toggle('test-post')
    expect(auth.currentUser()?.isAnonymous).toBe(true)
  })

  it('toggle creates a like and returns count=1 hasLiked=true', async () => {
    const { service } = makeService()
    expect(await service.toggle('test-post')).toEqual({ count: 1, hasLiked: true })
  })

  it('toggling twice removes the like (count=0 hasLiked=false)', async () => {
    const { service } = makeService()
    await service.toggle('test-post')
    expect(await service.toggle('test-post')).toEqual({ count: 0, hasLiked: false })
  })

  it('load reflects authoritative state after toggle', async () => {
    const { service } = makeService()
    await service.toggle('test-post')
    expect(await service.load('test-post')).toEqual({ count: 1, hasLiked: true })
  })

  it('does not sign in again if session already exists', async () => {
    const { service, auth } = makeService()
    auth._setUser({ id: 'existing-user', isAnonymous: false, displayName: 'Existing', avatarUrl: null })
    await service.toggle('test-post')
    // Still the same user (not overwritten by signInAnonymously)
    expect(auth.currentUser()?.id).toBe('existing-user')
  })

  it('like counts across different posts are independent', async () => {
    const { service } = makeService()
    await service.toggle('post-a')
    await service.toggle('post-b')
    await service.toggle('post-b')
    expect(await service.load('post-a')).toEqual({ count: 1, hasLiked: true })
    expect(await service.load('post-b')).toEqual({ count: 0, hasLiked: false })
  })
})

describe('LikeService — CAPTCHA-gated anonymous sign-in', () => {
  it('calls getCaptchaToken before signing in when not authenticated', async () => {
    const getCaptchaToken = vi.fn().mockResolvedValue('test-token')
    const { service, auth } = makeService({ getCaptchaToken })
    await service.toggle('test-post')
    expect(getCaptchaToken).toHaveBeenCalledOnce()
    expect(auth.lastCaptchaToken).toBe('test-token')
  })

  it('does not call getCaptchaToken when already signed in', async () => {
    const getCaptchaToken = vi.fn().mockResolvedValue('test-token')
    const { service, auth } = makeService({ getCaptchaToken })
    auth._setUser({ id: 'existing-user', isAnonymous: false, displayName: 'Alice', avatarUrl: null })
    await service.toggle('test-post')
    expect(getCaptchaToken).not.toHaveBeenCalled()
  })

  it('works without getCaptchaToken — anonymous sign-in proceeds without token', async () => {
    const { service, auth } = makeService()
    await service.toggle('test-post')
    expect(auth.currentUser()?.isAnonymous).toBe(true)
    expect(auth.lastCaptchaToken).toBeUndefined()
  })
})
