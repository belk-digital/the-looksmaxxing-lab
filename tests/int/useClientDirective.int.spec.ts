import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * A "use client" file only works as a client component when the directive is the very first statement.
 * An import (or anything else) above it silently turns the file into a server component, and its hooks then
 * fail at build or run time. This guards every file under src/.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      sourceFiles(full, out)
    } else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

/** The first statement of a file, ignoring blank lines and comments. */
function firstStatement(source: string): string {
  let s = source.replace(/^﻿/, '')
  for (;;) {
    s = s.replace(/^\s+/, '')
    if (s.startsWith('//')) s = s.replace(/^\/\/[^\n]*/, '')
    else if (s.startsWith('/*')) s = s.replace(/^\/\*[\s\S]*?\*\//, '')
    else break
  }
  return s.split('\n', 1)[0].trim()
}

describe('"use client" is the first statement of every client component', () => {
  const root = path.join(process.cwd(), 'src')
  const files = sourceFiles(root)

  it('finds the source files (sanity check)', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('has no file with code above its "use client" directive', () => {
    const offenders: string[] = []
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8')
      if (!/^\s*['"]use client['"]/m.test(text)) continue
      if (!/^['"]use client['"]/.test(firstStatement(text))) offenders.push(path.relative(process.cwd(), file))
    }
    expect(offenders).toEqual([])
  })
})
