import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const revalidatePath = vi.fn()
const after = vi.fn()

vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))
vi.mock('next/server', () => ({ after: (...args: unknown[]) => after(...args) }))

import { clearCachedPages } from '../../src/lib/cache/clearCachedPages'
import { productsAfterChange, productsAfterDelete } from '../../src/hooks/products'
import { blogPostsAfterChange, blogPostsAfterDelete } from '../../src/hooks/blogPosts'

// Behaves like Next: `after` queues the work, and it only runs once the response has been sent.
let queued: Array<() => void>
function runQueued() {
  for (const job of queued.splice(0)) job()
}
const cleared = () => revalidatePath.mock.calls.map((call) => call[0])
const run = (hook: unknown, args: object) => (hook as (a: object) => unknown)(args)

beforeEach(() => {
  queued = []
  revalidatePath.mockReset()
  after.mockReset()
  after.mockImplementation((job: () => void) => {
    queued.push(job)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('clearCachedPages', () => {
  it('waits until the save has finished before clearing anything', () => {
    clearCachedPages('test', ['/products/a'])
    expect(cleared()).toEqual([]) // nothing yet: the database commit may not have happened
    runQueued()
    expect(cleared()).toEqual(['/products/a'])
  })

  it('clears each page once, in order, and ignores blanks', () => {
    clearCachedPages('test', ['/a', null, '/b', undefined, '', '/a'])
    runQueued()
    expect(cleared()).toEqual(['/a', '/b'])
  })

  it('does nothing at all for an empty list', () => {
    clearCachedPages('test', [null, undefined, ''])
    runQueued()
    expect(after).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('clears straight away when there is no request to wait for (scripts)', () => {
    after.mockImplementation(() => {
      throw new Error('`after` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-after-aot')
    })
    clearCachedPages('test', ['/a', '/b'])
    expect(cleared()).toEqual(['/a', '/b'])
  })

  it('stays quiet when there is no running site to clear (seed/import scripts)', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    after.mockImplementation(() => {
      throw new Error('outside a request scope')
    })
    revalidatePath.mockImplementation((path: string) => {
      throw new Error(`Invariant: static generation store missing in revalidatePath ${path}`)
    })
    expect(() => clearCachedPages('test', ['/a', '/b'])).not.toThrow()
    expect(logged).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledTimes(1) // gives up after the first, the rest would fail the same way
  })

  it('logs a real failure but still clears the remaining pages', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    revalidatePath.mockImplementation((path: string) => {
      if (path === '/b') throw new Error('something broke')
    })
    clearCachedPages('test', ['/a', '/b', '/c'])
    runQueued()
    expect(cleared()).toEqual(['/a', '/b', '/c'])
    expect(logged).toHaveBeenCalledTimes(1)
    expect(String(logged.mock.calls[0][0])).toContain('/b')
  })

  it('never lets a cache problem break a save', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    after.mockImplementation(() => {
      throw new Error('boom')
    })
    revalidatePath.mockImplementation(() => {
      throw new Error('boom too')
    })
    expect(() => clearCachedPages('test', ['/a'])).not.toThrow()
  })
})

describe('product hooks', () => {
  const ALWAYS = ['/', '/products', '/certificates']

  it('saving a product clears its page and the pages that show products', async () => {
    await run(productsAfterChange, { doc: { slug: 'bpc-157' }, previousDoc: { slug: 'bpc-157' } })
    runQueued()
    expect(cleared()).toEqual(['/products/bpc-157', ...ALWAYS])
  })

  it('also clears the old address when the slug was renamed', async () => {
    await run(productsAfterChange, { doc: { slug: 'new-name' }, previousDoc: { slug: 'old-name' } })
    runQueued()
    expect(cleared()).toEqual(['/products/new-name', '/products/old-name', ...ALWAYS])
  })

  it('works for a brand-new product (no previous version)', async () => {
    await run(productsAfterChange, { doc: { slug: 'brand-new' } })
    runQueued()
    expect(cleared()).toEqual(['/products/brand-new', ...ALWAYS])
  })

  it('deleting a product clears its page and the listings', async () => {
    await run(productsAfterDelete, { doc: { slug: 'gone' } })
    runQueued()
    expect(cleared()).toEqual(['/products/gone', ...ALWAYS])
  })

  it('does not clear a page for a product that has no slug', async () => {
    await run(productsAfterChange, { doc: {} })
    runQueued()
    expect(cleared()).toEqual(ALWAYS)
  })
})

describe('blog post hooks', () => {
  it('saving a post clears its page and the journal list', async () => {
    await run(blogPostsAfterChange, { doc: { slug: 'my-post' }, previousDoc: { slug: 'my-post' } })
    runQueued()
    expect(cleared()).toEqual(['/journal/my-post', '/journal'])
  })

  it('also clears the old address when the slug was renamed', async () => {
    await run(blogPostsAfterChange, { doc: { slug: 'new-slug' }, previousDoc: { slug: 'old-slug' } })
    runQueued()
    expect(cleared()).toEqual(['/journal/new-slug', '/journal/old-slug', '/journal'])
  })

  it('deleting a post clears its page and the journal list', async () => {
    await run(blogPostsAfterDelete, { doc: { slug: 'gone' } })
    runQueued()
    expect(cleared()).toEqual(['/journal/gone', '/journal'])
  })
})
