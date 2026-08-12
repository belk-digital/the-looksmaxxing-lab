import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Some upload collections (e.g. blog-media) store already-absolute R2 URLs, while
// others store relative local paths — only prefix baseUrl onto relative ones, or
// absolute URLs get incorrectly doubled up (e.g. "http://site.comhttps://r2.dev/...").
export function toAbsoluteUrl(baseUrl: string, url: string): string {
  return /^https?:\/\//.test(url) ? url : `${baseUrl}${url}`
}

export function encodeImageUrl(url: string | undefined): string {
  if (!url) return ''
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url)
      parsed.pathname = parsed.pathname.split('/').map((s) => encodeURIComponent(decodeURIComponent(s))).join('/')
      return parsed.toString()
    }
    return url.split('/').map((s) => encodeURIComponent(decodeURIComponent(s))).join('/')
  } catch {
    return url
  }
}
