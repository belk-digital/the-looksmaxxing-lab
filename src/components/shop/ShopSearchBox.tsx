'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** How long to wait after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 400

export interface ShopSearchBoxProps {
  /** The search text currently in the address bar (`?q=`), '' when there is none. */
  value: string
  /** Called with the new (trimmed) search text; '' means "search cleared". The caller puts it in the address bar. */
  onSearch: (query: string) => void
  className?: string
}

/**
 * The search box in the shop's filter bar.
 *
 * Like every other shop filter, the address bar is the source of truth: typing (after a short pause), Enter, or the
 * clear button hands the text to `onSearch`, and a change of the address bar from elsewhere (back button, "Clear all
 * filters", a link) is shown in the box.
 *
 * One subtlety: the address bar answers a moment AFTER we asked. By then the visitor may have typed more, so an
 * answer to something we asked for ourselves must never overwrite the box. `sent` remembers what we asked for.
 */
export function ShopSearchBox({ value, onSearch, className }: ShopSearchBoxProps) {
  const [text, setText] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Searches we have handed over that have not come back through `value` yet, oldest first.
  const sent = useRef<string[]>([])

  // Always call the newest versions without restarting the typing pause when the shop re-renders.
  const latest = useRef({ value, onSearch })
  latest.current = { value, onSearch }

  const commit = useCallback((raw: string) => {
    const next = raw.trim()
    const { value: inBar, onSearch: send } = latest.current
    // Compare with the newest search we know about (the address bar may not have caught up yet).
    const known = sent.current.length > 0 ? sent.current[sent.current.length - 1] : inBar.trim()
    if (next === known) return
    sent.current.push(next)
    send(next)
  }, [])

  // The address bar changed.
  useEffect(() => {
    const at = sent.current.indexOf(value)
    if (at !== -1) {
      sent.current.splice(0, at + 1) // our own search coming back: the box already shows what the visitor typed
      return
    }
    // Changed from somewhere else: show it, and drop whatever was about to be searched for.
    clearTimeout(timer.current)
    sent.current = []
    setText(value)
  }, [value])

  // Search a moment after the visitor stops typing.
  useEffect(() => {
    timer.current = setTimeout(() => commit(text), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [text, commit])

  const clear = () => {
    clearTimeout(timer.current)
    setText('')
    commit('')
    inputRef.current?.focus()
  }

  return (
    <form
      role="search"
      className={cn('relative min-w-0', className)}
      onSubmit={(event) => {
        // Enter / the keyboard's "Search" key: search right away and close the on-screen keyboard.
        event.preventDefault()
        clearTimeout(timer.current)
        commit(text)
        inputRef.current?.blur()
      }}
    >
      <Search
        size={15}
        aria-hidden="true"
        // z-10: the input below has a see-through white background and blur, which would otherwise paint over the icon.
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-ink/50"
      />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={100}
        aria-label="Search products"
        placeholder="Search compounds..."
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && text) {
            event.preventDefault()
            clear()
          }
        }}
        // 16px on phones: anything smaller makes iPhones zoom the page in when the box is tapped.
        className="h-9 w-full rounded-full border border-ink/10 bg-white/75 pl-9 pr-9 text-base text-ink shadow-sm outline-none backdrop-blur-xl transition-all placeholder:text-ink/40 hover:bg-white/90 focus:border-ink/30 focus:bg-white focus:ring-2 focus:ring-ink/10 sm:h-10 sm:text-sm"
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
