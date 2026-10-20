import os from 'os'
import { describe, it, expect, vi } from 'vitest'
import { emailsAreBlocked, guardEmailAdapter } from '@/lib/email/guard'

describe('emailsAreBlocked: emails are sent everywhere (dev server included) unless BLOCK_EMAILS=true', () => {
  it('is NOT blocked in development, test or production', () => {
    expect(emailsAreBlocked({ NODE_ENV: 'development' })).toBe(false)
    expect(emailsAreBlocked({ NODE_ENV: 'test' })).toBe(false)
    expect(emailsAreBlocked({ NODE_ENV: 'production' })).toBe(false)
    expect(emailsAreBlocked({})).toBe(false)
  })

  it('BLOCK_EMAILS=true blocks everywhere, even production', () => {
    expect(emailsAreBlocked({ NODE_ENV: 'development', BLOCK_EMAILS: 'true' })).toBe(true)
    expect(emailsAreBlocked({ NODE_ENV: 'production', BLOCK_EMAILS: 'true' })).toBe(true)
  })

  it('any other value of BLOCK_EMAILS does not block', () => {
    expect(emailsAreBlocked({ BLOCK_EMAILS: 'false' })).toBe(false)
    expect(emailsAreBlocked({ BLOCK_EMAILS: '' })).toBe(false)
  })
})

describe('guardEmailAdapter', () => {
  const makeReal = () => {
    const sendEmail = vi.fn(async () => ({ id: 'real-id' }))
    const factory = (() => ({ name: 'real', defaultFromAddress: 'a@b.c', defaultFromName: 'Shop', sendEmail })) as any
    return { sendEmail, factory }
  }
  const msg = { to: 'customer@example.com', subject: 'Order Confirmation #1', html: '<p>hi</p>' }

  it('in development the real adapter IS used (the customer gets the email)', async () => {
    const { sendEmail, factory } = makeReal()
    const prev = { ...process.env }
    ;(process.env as any).NODE_ENV = 'development'
    delete process.env.BLOCK_EMAILS
    try {
      const adapter = guardEmailAdapter(factory)({ payload: {} as any })
      const res = await adapter.sendEmail(msg)
      expect(sendEmail).toHaveBeenCalledTimes(1)
      expect(res).toEqual({ id: 'real-id' })
    } finally {
      process.env = prev
    }
  })

  it('with BLOCK_EMAILS=true the real adapter is never called, and the caller still gets a normal answer', async () => {
    const { sendEmail, factory } = makeReal()
    const prev = { ...process.env }
    process.env.BLOCK_EMAILS = 'true'
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(os.tmpdir()) // the saved preview goes to a temp folder, not the project
    try {
      const adapter = guardEmailAdapter(factory)({ payload: {} as any })
      const res = await adapter.sendEmail(msg)
      expect(sendEmail).not.toHaveBeenCalled()
      expect(res).toEqual({ id: 'blocked-by-setting' })
      expect(adapter.name).toBe('real')
      expect(spy.mock.calls.flat().join(' ')).toContain('email blocked')
    } finally {
      spy.mockRestore()
      cwd.mockRestore()
      process.env = prev
    }
  })
})
