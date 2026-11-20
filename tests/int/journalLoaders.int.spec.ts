/**
 * The journal pages are saved for 2 days. If a database failure were quietly turned into "no posts" or
 * "post not found", that wrong page would be saved and served to everyone for 2 days.
 *
 * What is tested:
 * - A database failure is passed on as an error (so Next.js keeps the last good copy), never an empty list / null.
 * - "Not found" (null) is still returned when the post genuinely doesn't exist.
 * - With a working database, Payload posts show up next to the built-in ones, newest first.
 *
 * No database: Payload is mocked.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'

const find = vi.hoisted(() => vi.fn())

vi.mock('payload', () => ({
  getPayload: async () => ({ find: (...args: unknown[]) => find(...args) }),
}))
vi.mock('@payload-config', () => ({ default: {} }))

import { getAllJournalPosts, getCmsJournalPost, getLatestJournalPosts } from '../../src/lib/blog/getPosts'

const cmsDoc = (over: Record<string, unknown> = {}) => ({
  slug: 'new-cms-post',
  title: 'A Payload post',
  category: 'Research',
  excerpt: 'Short summary',
  readTime: '3 min read',
  publishedAt: '2099-01-01T00:00:00.000Z',
  ...over,
})

beforeEach(() => {
  find.mockReset()
})

describe('journal list', () => {
  it('passes a database failure on instead of returning a journal without its Payload posts', async () => {
    find.mockRejectedValue(new Error('db down'))
    await expect(getAllJournalPosts()).rejects.toThrow('db down')
  })

  it('lists Payload posts together with the built-in posts, newest first', async () => {
    find.mockResolvedValue({ docs: [cmsDoc()] })
    const posts = await getAllJournalPosts()

    expect(posts[0]).toMatchObject({ slug: 'new-cms-post', source: 'cms' })
    expect(posts.some((p) => p.source === 'static')).toBe(true)
  })

  it('still lists the built-in posts when Payload simply has none', async () => {
    find.mockResolvedValue({ docs: [] })
    const posts = await getAllJournalPosts()
    expect(posts.length).toBeGreaterThan(0)
    expect(posts.every((p) => p.source === 'static')).toBe(true)
  })
})

describe('latest posts (the home page journal row)', () => {
  it('are the first posts of the /journal list, in exactly the same order', async () => {
    find.mockResolvedValue({ docs: [cmsDoc(), cmsDoc({ slug: 'older-cms-post', title: 'Older', publishedAt: '2098-06-01T00:00:00.000Z' })] })
    const all = await getAllJournalPosts()
    const latest = await getLatestJournalPosts(5)

    expect(latest.length).toBe(5)
    expect(latest.map((p) => p.slug)).toEqual(all.slice(0, 5).map((p) => p.slug))
    // a Payload post that is newer than every built-in post shows first
    expect(latest[0]).toMatchObject({ slug: 'new-cms-post', source: 'cms' })
    expect(latest[1]).toMatchObject({ slug: 'older-cms-post', source: 'cms' })
  })

  it('a newly published Payload post pushes the oldest of the five out', async () => {
    find.mockResolvedValue({ docs: [] })
    const before = (await getLatestJournalPosts(5)).map((p) => p.slug)
    find.mockResolvedValue({ docs: [cmsDoc()] })
    const after = (await getLatestJournalPosts(5)).map((p) => p.slug)

    expect(after[0]).toBe('new-cms-post')
    expect(after.slice(1)).toEqual(before.slice(0, 4))
  })

  it('gives only as many as asked for, and nothing for 0', async () => {
    find.mockResolvedValue({ docs: [] })
    expect((await getLatestJournalPosts(3)).length).toBe(3)
    expect(await getLatestJournalPosts(0)).toEqual([])
  })

  it('passes a database failure on instead of returning a home page journal row without its Payload posts', async () => {
    find.mockRejectedValue(new Error('db down'))
    await expect(getLatestJournalPosts(5)).rejects.toThrow('db down')
  })
})

describe('single journal post', () => {
  it('passes a database failure on instead of reporting "post not found"', async () => {
    find.mockRejectedValue(new Error('db down'))
    await expect(getCmsJournalPost('new-cms-post')).rejects.toThrow('db down')
  })

  it('returns null only when the post genuinely does not exist', async () => {
    find.mockResolvedValue({ docs: [] })
    await expect(getCmsJournalPost('nope')).resolves.toBeNull()
  })

  it('returns the post and its related products when it exists', async () => {
    find.mockResolvedValue({ docs: [cmsDoc({ relatedProducts: [{ id: 7, name: 'BPC-157', slug: 'bpc-157', price: 40 }, 99] })] })
    const result = await getCmsJournalPost('new-cms-post')

    expect(result?.post.slug).toBe('new-cms-post')
    // numeric ids (unpopulated relations) are skipped, populated products are kept
    expect(result?.relatedProducts.map((p) => p.slug)).toEqual(['bpc-157'])
  })
})
