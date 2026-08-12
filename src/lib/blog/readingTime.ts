const WORDS_PER_MINUTE = 200

function extractText(node: any): string {
  if (!node) return ''
  let text = typeof node.text === 'string' ? node.text : ''
  if (Array.isArray(node.children)) {
    text += ' ' + node.children.map(extractText).join(' ')
  }
  return text
}

export function estimateReadingTime(content: any): string {
  const root = content?.root
  const text = root ? extractText(root) : ''
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
  return `${minutes} min read`
}
