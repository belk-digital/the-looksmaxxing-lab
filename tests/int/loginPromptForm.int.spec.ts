/**
 * Logging in from inside the popup: the email + password form and "Continue with Google".
 *
 * What is tested, in a simulated browser:
 * - What is on screen: labelled fields with the right keyboard hints (no zoom-in on iPhones), a show/hide password
 *   button, Forgot password, Create account, Google.
 * - A password login: sent to the real sign-in with the typed details (email trimmed), shows a busy state, cannot be
 *   sent twice, and on success the popup goes away, the member discount is announced and the page refreshes.
 *   Closing this way is NOT "closing the popup" (no reminder pause is recorded).
 * - A wrong password (or any failure) shows a plain message inside the popup and lets the visitor try again.
 * - Google: sent to Google with this page as the way back (never an unsafe address); a busy state; a failure message.
 *
 * Next's router, the sign-in function, the toast, framer-motion and Lenis are mocked; the popup is the real thing.
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({
  signIn: vi.fn(async (..._args: unknown[]) => ({ error: null, ok: true }) as { error: string | null; ok: boolean } | undefined),
  refresh: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ signIn: (...args: unknown[]) => h.signIn(...args) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { success: (...args: unknown[]) => h.toast(...args), error: vi.fn() } }))
vi.mock('lenis/react', () => ({ useLenis: () => ({ stop: vi.fn(), start: vi.fn() }) }))
vi.mock('next/link', async () => {
  const R = await import('react')
  return { default: R.forwardRef(({ href, children, prefetch: _p, ...rest }: any, ref: any) => R.createElement('a', { href, ref, ...rest }, children)) }
})
vi.mock('framer-motion', async () => {
  const R = await import('react')
  const cache = new Map<string, unknown>()
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            R.forwardRef((props: any, ref) => {
              const { initial, animate, exit, transition, ...rest } = props
              return R.createElement(tag, { ...rest, ref })
            }),
          )
        }
        return cache.get(tag)
      },
    },
  )
  const AnimatePresence = ({ children, onExitComplete }: any) => {
    const had = React.useRef(false)
    React.useEffect(() => {
      if (!children && had.current) onExitComplete?.()
      had.current = Boolean(children)
    }, [children, onExitComplete])
    return children || null
  }
  return { motion, AnimatePresence, MotionConfig: ({ children }: any) => children }
})

import LoginPromptModal from '../../src/components/shared/LoginPromptModal'

const open = (props: Partial<React.ComponentProps<typeof LoginPromptModal>> = {}) => {
  const onDismiss = vi.fn()
  const onClosed = vi.fn()
  const view = render(React.createElement(LoginPromptModal, { returnTo: '/shop', onDismiss, onClosed, ...props }))
  return { ...view, onDismiss, onClosed }
}
const email = () => screen.getByLabelText('Email') as HTMLInputElement
const password = () => screen.getByLabelText('Password') as HTMLInputElement
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
const form = () => screen.getByTestId('login-form') as HTMLFormElement
const fillAndSubmit = (mail = 'ada@example.com', pass = 'correct horse') => {
  type(email(), mail)
  type(password(), pass)
  fireEvent.submit(form())
}
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  h.signIn.mockReset()
  h.signIn.mockResolvedValue({ error: null, ok: true })
  h.refresh.mockReset()
  h.toast.mockReset()
  document.body.style.overflow = ''
})
afterEach(cleanup)

// ─── What is on screen ────────────────────────────────────────────────────────

describe('the login form', () => {
  it('has labelled email and password fields, Google, Forgot password and Create account', () => {
    open()
    expect(email().type).toBe('email')
    expect(password().type).toBe('password')
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Log in' }).getAttribute('type')).toBe('submit')
    expect(screen.getByRole('link', { name: /forgot password/i }).getAttribute('href')).toBe('/forgot-password?next=%2Fshop')
    expect(screen.getByRole('link', { name: /create free account/i }).getAttribute('href')).toBe('/register?next=%2Fshop')
  })

  it('asks the phone for the right keyboard and lets password managers help', () => {
    open()
    expect(email().getAttribute('autocomplete')).toBe('email')
    expect(email().getAttribute('inputmode')).toBe('email')
    expect(email().getAttribute('autocapitalize')).toBe('none')
    expect(password().getAttribute('autocomplete')).toBe('current-password')
    expect(email().required).toBe(true)
    expect(password().required).toBe(true)
  })

  it('uses a 16px font in the fields: anything smaller makes iPhones zoom the page in when a field is tapped', () => {
    open()
    for (const field of [email(), password()]) {
      expect(field.className).toContain('text-base')
      expect(field.className).not.toMatch(/(^|\s)text-(xs|sm)(\s|$)/)
    }
  })

  it('never names the GLP-1 compounds', () => {
    open()
    expect(screen.getByRole('dialog').textContent).not.toMatch(/glp/i)
  })

  it('the password can be shown and hidden again, and the button says which it is doing', () => {
    open()
    const toggle = () => screen.getByRole('button', { name: /(show|hide) password/i })
    expect(toggle().getAttribute('aria-label')).toBe('Show password')
    expect(toggle().getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(toggle())
    expect(password().type).toBe('text')
    expect(toggle().getAttribute('aria-label')).toBe('Hide password')
    expect(toggle().getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle())
    expect(password().type).toBe('password')
  })

  it('Forgot password and Create account carry a safe way back; an unsafe address is dropped', () => {
    open({ returnTo: '//evil.example' })
    expect(screen.getByRole('link', { name: /forgot password/i }).getAttribute('href')).toBe('/forgot-password')
    expect(screen.getByRole('link', { name: /create free account/i }).getAttribute('href')).toBe('/register')
  })
})

// ─── Logging in with a password ───────────────────────────────────────────────

describe('logging in with email and password', () => {
  it('sends the typed details to the sign-in, without leaving the page', async () => {
    open()
    fillAndSubmit('ada@example.com', 'correct horse')
    await waitFor(() => expect(h.signIn).toHaveBeenCalledTimes(1))
    expect(h.signIn).toHaveBeenCalledWith('credentials', { email: 'ada@example.com', password: 'correct horse', redirect: false })
  })

  it('trims spaces around the email but never touches the password', async () => {
    open()
    fillAndSubmit('  ada@example.com  ', '  spaced pass  ')
    await waitFor(() => expect(h.signIn).toHaveBeenCalled())
    expect(h.signIn).toHaveBeenCalledWith('credentials', { email: 'ada@example.com', password: '  spaced pass  ', redirect: false })
  })

  it('shows a busy state, locks the form, and cannot be sent twice while it is working', async () => {
    const pending = deferred<{ error: string | null; ok: boolean }>()
    h.signIn.mockReturnValue(pending.promise)
    open()
    fillAndSubmit()
    expect(await screen.findByRole('button', { name: /logging in/i })).toBeTruthy()
    expect((screen.getByRole('button', { name: /logging in/i }) as HTMLButtonElement).disabled).toBe(true)
    expect(email().disabled).toBe(true)
    expect(password().disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Continue with Google' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.submit(form()) // a second press while it is working
    fireEvent.submit(form())
    expect(h.signIn).toHaveBeenCalledTimes(1)

    await act(async () => pending.resolve({ error: null, ok: true }))
  })

  it('on success: the popup goes away, the member discount is announced, and the page refreshes', async () => {
    const { onClosed, onDismiss } = open()
    fillAndSubmit()
    await waitFor(() => expect(onClosed).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(h.toast).toHaveBeenCalledWith('Logged in. Your 20% member discount is active.')
    expect(h.refresh).toHaveBeenCalledTimes(1)
    // finishing a login is not "closing the popup": no reminder pause is recorded
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('a wrong password shows a plain message inside the popup and lets the visitor try again', async () => {
    h.signIn.mockResolvedValue({ error: 'CredentialsSignin', ok: false })
    const { onClosed } = open()
    fillAndSubmit('ada@example.com', 'wrong')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Invalid credentials')
    expect(screen.getByRole('dialog').contains(alert)).toBe(true)
    // nothing was announced, nothing refreshed, the popup stays
    expect(h.toast).not.toHaveBeenCalled()
    expect(h.refresh).not.toHaveBeenCalled()
    expect(onClosed).not.toHaveBeenCalled()
    // and the form is usable again, keeping what was typed
    expect(email().disabled).toBe(false)
    expect(password().disabled).toBe(false)
    expect(email().value).toBe('ada@example.com')
    expect((screen.getByRole('button', { name: 'Log in' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('typing again clears the message', async () => {
    h.signIn.mockResolvedValue({ error: 'CredentialsSignin', ok: false })
    open()
    fillAndSubmit()
    await screen.findByRole('alert')
    type(password(), 'another try')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('a second attempt can succeed after a failed one', async () => {
    h.signIn.mockResolvedValueOnce({ error: 'CredentialsSignin', ok: false }).mockResolvedValueOnce({ error: null, ok: true })
    const { onClosed } = open()
    fillAndSubmit('ada@example.com', 'wrong')
    await screen.findByRole('alert')
    type(password(), 'right')
    fireEvent.submit(form())
    await waitFor(() => expect(onClosed).toHaveBeenCalled())
    expect(h.signIn).toHaveBeenCalledTimes(2)
  })

  it('no answer at all from the sign-in counts as a failure, not a login', async () => {
    h.signIn.mockResolvedValue(undefined)
    const { onClosed } = open()
    fillAndSubmit()
    expect((await screen.findByRole('alert')).textContent).toContain('Invalid credentials')
    expect(onClosed).not.toHaveBeenCalled()
    expect(h.refresh).not.toHaveBeenCalled()
  })

  it('a network failure shows a friendly message and unlocks the form', async () => {
    h.signIn.mockRejectedValue(new Error('network down'))
    open()
    fillAndSubmit()
    expect((await screen.findByRole('alert')).textContent).toContain('Something went wrong')
    expect(email().disabled).toBe(false)
  })

  it('never puts the password anywhere on the page except its own field', async () => {
    h.signIn.mockResolvedValue({ error: 'CredentialsSignin', ok: false })
    const { container } = open()
    fillAndSubmit('ada@example.com', 'hunter2-secret')
    await screen.findByRole('alert')
    expect(container.textContent).not.toContain('hunter2-secret')
    expect(h.toast).not.toHaveBeenCalled()
  })
})

// ─── Google ───────────────────────────────────────────────────────────────────

describe('continue with Google', () => {
  it('sends the visitor to Google and brings them straight back to this page', () => {
    h.signIn.mockReturnValue(new Promise(() => undefined))
    open({ returnTo: '/products/bpc-157' })
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(h.signIn).toHaveBeenCalledWith('google', { callbackUrl: '/products/bpc-157' })
  })

  it('never lets an unsafe address be the way back', () => {
    for (const bad of ['//evil.example', 'https://evil.example', 'javascript:alert(1)']) {
      cleanup()
      h.signIn.mockClear()
      h.signIn.mockReturnValue(new Promise(() => undefined))
      open({ returnTo: bad })
      fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
      expect(h.signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' })
    }
  })

  it('shows a busy state and locks the form while it opens Google, and cannot be started twice', () => {
    h.signIn.mockReturnValue(new Promise(() => undefined))
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    const busy = screen.getByRole('button', { name: /opening google/i }) as HTMLButtonElement
    expect(busy.disabled).toBe(true)
    expect(email().disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Log in' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(busy)
    expect(h.signIn).toHaveBeenCalledTimes(1)
  })

  it('if Google cannot be reached it says so and unlocks the form', async () => {
    h.signIn.mockRejectedValue(new Error('offline'))
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Could not reach Google')
    expect(email().disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'Continue with Google' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('does not count as closing the popup', () => {
    h.signIn.mockReturnValue(new Promise(() => undefined))
    const { onDismiss } = open()
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})

// ─── Closing still works ──────────────────────────────────────────────────────

describe('closing the popup with the form in it', () => {
  it('Escape, the X and Maybe later still close it, and count as closing it', () => {
    for (const close of [
      () => fireEvent.keyDown(document, { key: 'Escape' }),
      () => fireEvent.click(screen.getByRole('button', { name: 'Close' })),
      () => fireEvent.click(screen.getByRole('button', { name: 'Maybe later' })),
    ]) {
      cleanup()
      const { onDismiss } = open()
      close()
      expect(onDismiss).toHaveBeenCalledTimes(1)
    }
  })

  it('pressing Enter inside a field sends the form (the keyboard\'s Go / Search key on a phone)', async () => {
    open()
    type(email(), 'ada@example.com')
    type(password(), 'pw')
    fireEvent.submit(email().closest('form')!)
    await waitFor(() => expect(h.signIn).toHaveBeenCalledTimes(1))
  })
})
