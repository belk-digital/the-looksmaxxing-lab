// Converts the constrained "blog content markdown" format into Payload
// lexical richText JSON, using only the node types BlogPosts.content's
// editor actually supports: paragraph, heading (h2/h3), bullet/ordered
// list, blockquote, table, and the calloutBox block. Also supports inline
// **bold** and [text](/url) links within any text-bearing node.
//
// Syntax cheat sheet:
//   Plain text lines                = paragraph
//   ## Heading                      = H2
//   ### Heading                     = H3
//   - item                          = bullet list (consecutive lines)
//   1. item                         = numbered list (consecutive lines)
//   > quoted text                   = blockquote (consecutive lines)
//   | Header | Header |             = table
//   |---|---|
//   | cell | cell |
//   :::tip / :::info / :::warning   = callout box
//   Callout text
//   :::
//   **bold text**                   = inline bold
//   [anchor text](/product/<slug>)  = inline link to a product
//   [anchor text](/<slug>)          = inline link to another post/page
//   <!-- LINK: description -->      = unresolved-link placeholder (never guess a slug)

function textNode(text: string, format = 0) {
  return { type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 }
}

function linkNode(children: any[], url: string) {
  return {
    type: 'link',
    version: 3,
    fields: { url, newTab: /^https?:\/\//.test(url), linkType: 'custom' },
    format: '',
    indent: 0,
    direction: 'ltr',
    children,
  }
}

function parseBoldSegments(text: string): any[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  if (parts.length === 0) return [textNode('')]
  return parts.map((part) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/)
    return m ? textNode(m[1], 1) : textNode(part)
  })
}

export function parseInline(text: string): any[] {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  const segments: { text: string; isLink?: boolean; url?: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(text))) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index) })
    segments.push({ text: match[1], isLink: true, url: match[2] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) })

  const nodes: any[] = []
  for (const seg of segments) {
    if (seg.isLink) {
      nodes.push(linkNode(parseBoldSegments(seg.text), seg.url!))
    } else {
      nodes.push(...parseBoldSegments(seg.text))
    }
  }
  return nodes.length ? nodes : [textNode('')]
}

function paragraph(text: string) {
  return { type: 'paragraph', format: '', indent: 0, version: 1, children: parseInline(text), direction: 'ltr' }
}

function heading(tag: 'h2' | 'h3', text: string) {
  return { type: 'heading', tag, format: '', indent: 0, version: 1, children: parseInline(text), direction: 'ltr' }
}

function list(items: string[], ordered: boolean) {
  return {
    type: 'list',
    listType: ordered ? 'number' : 'bullet',
    tag: ordered ? 'ol' : 'ul',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: items.map((item) => ({
      type: 'listitem',
      value: 1,
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: parseInline(item),
    })),
  }
}

function quote(text: string) {
  return { type: 'quote', format: '', indent: 0, version: 1, children: parseInline(text), direction: 'ltr' }
}

function tableCell(text: string, isHeader: boolean) {
  return {
    type: 'tablecell',
    format: '',
    indent: 0,
    version: 1,
    headerState: isHeader ? 1 : 0,
    colSpan: 1,
    rowSpan: 1,
    backgroundColor: null,
    children: [paragraph(text)],
    direction: 'ltr',
  }
}

function tableRow(cells: string[], isHeader = false) {
  return {
    type: 'tablerow',
    format: '',
    indent: 0,
    version: 1,
    children: cells.map((c) => tableCell(c, isHeader)),
    direction: 'ltr',
  }
}

function table(headers: string[], rows: string[][]) {
  return {
    type: 'table',
    format: '',
    indent: 0,
    version: 1,
    children: [tableRow(headers, true), ...rows.map((r) => tableRow(r))],
    direction: 'ltr',
  }
}

function calloutBox(style: 'info' | 'tip' | 'warning', text: string) {
  return {
    type: 'block',
    format: '',
    version: 2,
    fields: {
      id: Math.random().toString(36).slice(2, 10),
      blockName: '',
      blockType: 'calloutBox',
      style,
      text,
    },
  }
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\||\|$/g, '')
  return trimmed.split('|').map((s) => s.trim())
}

export function parseContentMarkdown(md: string): any {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const nodes: any[] = []
  let i = 0

  const isBlockStart = (line: string) =>
    /^(##\s|###\s|:::|>\s|-\s|\d+\.\s|\|)/.test(line) || line.trim() === ''

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') { i++; continue }

    const calloutMatch = line.match(/^:::(info|tip|warning)\s*$/)
    if (calloutMatch) {
      const style = calloutMatch[1] as 'info' | 'tip' | 'warning'
      i++
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== ':::') { textLines.push(lines[i]); i++ }
      i++
      nodes.push(calloutBox(style, textLines.join(' ').trim()))
      continue
    }

    const h3 = line.match(/^###\s+(.*)$/)
    if (h3) { nodes.push(heading('h3', h3[1].trim())); i++; continue }
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2) { nodes.push(heading('h2', h2[1].trim())); i++; continue }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].slice(2)); i++ }
      nodes.push(quote(quoteLines.join(' ').trim()))
      continue
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^-\s+/.test(lines[i])) { items.push(lines[i].replace(/^-\s+/, '').trim()); i++ }
      nodes.push(list(items, false))
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '').trim()); i++ }
      nodes.push(list(items, true))
      continue
    }

    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i].trim()); i++ }
      const headerCells = parseTableRow(tableLines[0])
      const rows = tableLines.slice(2).map(parseTableRow) // tableLines[1] is the |---|---| separator, skipped
      nodes.push(table(headerCells, rows))
      continue
    }

    const paraLines = [line]
    i++
    while (i < lines.length && !isBlockStart(lines[i])) { paraLines.push(lines[i]); i++ }
    nodes.push(paragraph(paraLines.join(' ').trim()))
  }

  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: nodes } }
}

export function extractLinks(md: string): { text: string; url: string }[] {
  const links: { text: string; url: string }[] = []
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(md))) { links.push({ text: match[1], url: match[2] }) }
  return links
}

export function extractLinkPlaceholders(md: string): string[] {
  const placeholders: string[] = []
  const re = /<!--\s*LINK:\s*([^>]*?)\s*-->/g
  let match: RegExpExecArray | null
  while ((match = re.exec(md))) { placeholders.push(match[1].trim()) }
  return placeholders
}
