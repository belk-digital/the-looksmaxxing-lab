import React from 'react'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { CalloutBox } from './CalloutBox'

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    if (node.tag === 'h3') {
      return (
        <h3 className="font-serif text-editorial-md text-ink font-semibold leading-snug mt-10 mb-4 first:mt-0">
          {children}
        </h3>
      )
    }
    return (
      <h2 className="font-serif text-editorial-lg md:text-[2.25rem] text-ink font-semibold leading-snug mt-14 mb-5 pb-3 border-b border-border-subtle first:mt-0">
        {children}
      </h2>
    )
  },
  paragraph: ({ node, nodesToJSX }) => (
    <p className="text-body-lg text-ink/80 leading-relaxed mb-6">{nodesToJSX({ nodes: node.children })}</p>
  ),
  list: ({ node, nodesToJSX }) => {
    const NodeTag = node.tag as 'ul' | 'ol'
    return (
      <NodeTag
        className={
          NodeTag === 'ol'
            ? 'list-decimal marker:text-gold-dark marker:font-semibold pl-6 mb-6 space-y-2 text-body-lg text-ink/80 leading-relaxed'
            : 'list-disc marker:text-gold-dark pl-6 mb-6 space-y-2 text-body-lg text-ink/80 leading-relaxed'
        }
      >
        {nodesToJSX({ nodes: node.children })}
      </NodeTag>
    )
  },
  listitem: ({ node, nodesToJSX }) => <li className="pl-1">{nodesToJSX({ nodes: node.children })}</li>,
  quote: ({ node, nodesToJSX }) => (
    <blockquote className="my-8 border-l-2 border-gold pl-6 py-1 text-editorial-md font-serif text-ink/90 italic leading-snug">
      {nodesToJSX({ nodes: node.children })}
    </blockquote>
  ),
  blocks: {
    calloutBox: ({ node }: { node: any }) => (
      <CalloutBox style={node.fields.style} text={node.fields.text} />
    ),
  },
  table: ({ node, nodesToJSX }) => (
    <div className="overflow-x-auto my-10 rounded-lg border border-border-subtle shadow-sm">
      <table className="w-full min-w-[640px] table-auto border-collapse text-sm sm:text-base">
        <tbody>{nodesToJSX({ nodes: node.children })}</tbody>
      </table>
    </div>
  ),
  tablerow: ({ node, nodesToJSX }) => <tr className="border-b border-border-subtle last:border-0 even:bg-ink/[0.025]">{nodesToJSX({ nodes: node.children })}</tr>,
  tablecell: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    const isHeader = (node as any).headerState > 0
    const Tag = isHeader ? 'th' : 'td'
    return (
      <Tag
        className={isHeader ? 'text-left font-bold uppercase text-label-md tracking-wider text-ink bg-white py-3.5 px-5 border-b-2 border-gold/30' : 'py-3.5 px-5 text-body-md text-ink/80'}
        colSpan={(node as any).colSpan > 1 ? (node as any).colSpan : undefined}
      >
        {children}
      </Tag>
    )
  },
})

export function PostRichText({ content }: { content: any }) {
  if (!content) return null
  return <RichText data={content} converters={jsxConverters} className="prose-article" />
}
