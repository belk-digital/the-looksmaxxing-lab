import { describe, it, expect } from 'vitest'
import { safeNextPath, nextPathFromSearch, withNext } from '@/lib/auth/safeRedirect'

describe('safeNextPath: only paths on this website are accepted', () => {
  it('accepts normal site paths (with query strings)', () => {
    expect(safeNextPath('/checkout')).toBe('/checkout')
    expect(safeNextPath('/account/subscriptions/3?tab=1')).toBe('/account/subscriptions/3?tab=1')
    expect(safeNextPath('  /cart  ')).toBe('/cart')
  })

  it('rejects anything that could lead to another site', () => {
    for (const bad of ['https://evil.example', 'http://evil.example/checkout', '//evil.example', '///evil.example', '/\\evil.example', '\\\\evil.example', 'javascript:alert(1)', 'checkout', 'data:text/html,hi']) {
      expect(safeNextPath(bad), bad).toBeNull()
    }
  })

  it('rejects empty, huge, control-character and sign-in-loop values', () => {
    expect(safeNextPath('')).toBeNull()
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath(undefined)).toBeNull()
    expect(safeNextPath('/' + 'a'.repeat(300))).toBeNull()
    expect(safeNextPath('/check\u0000out')).toBeNull()
    expect(safeNextPath('/login')).toBeNull()
    expect(safeNextPath('/login?next=/checkout')).toBeNull()
    expect(safeNextPath('/register')).toBeNull()
  })
})

describe('reading and carrying the return address', () => {
  it('reads ?next= and the older ?callbackUrl=, and ignores unsafe values', () => {
    expect(nextPathFromSearch('?next=%2Fcheckout')).toBe('/checkout')
    expect(nextPathFromSearch('?callbackUrl=/checkout')).toBe('/checkout')
    expect(nextPathFromSearch('?next=https%3A%2F%2Fevil.example')).toBeNull()
    expect(nextPathFromSearch('')).toBeNull()
  })

  it('withNext adds the return address when there is one', () => {
    expect(withNext('/login', '/checkout')).toBe('/login?next=%2Fcheckout')
    expect(withNext('/login', null)).toBe('/login')
  })
})
