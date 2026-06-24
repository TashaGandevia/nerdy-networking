// Minimal markdown renderer — supports the subset the study notes use:
//   - # / ## / ### / #### headings
//   - **bold**, *italic*, `inline code`
//   - bullet lists (`- ` / `* `) and ordered lists (`1. `)
//   - --- horizontal rule
//   - paragraphs
//   - fenced ``` code blocks
//
// Not a full CommonMark parser — but good enough to display longform study text
// without adding a runtime dependency.

import { Fragment, type ReactNode } from 'react'

interface MarkdownProps {
  source: string
}

export function Markdown({ source }: MarkdownProps) {
  return <div className="study-md text-noc-text">{renderBlocks(source)}</div>
}

// ── Block-level ─────────────────────────────────────────────────────────────

function renderBlocks(src: string): ReactNode[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const j = lines.findIndex((l, idx) => idx > i && l.startsWith('```'))
      const end = j === -1 ? lines.length : j
      const code = lines.slice(i + 1, end).join('\n')
      out.push(
        <pre key={key++} className="bg-noc-bg border border-noc-border rounded px-3 py-2 overflow-x-auto my-3">
          <code className="text-noc-text text-xs font-mono">{code}</code>
        </pre>,
      )
      i = end + 1
      continue
    }

    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      out.push(<hr key={key++} className="border-noc-border my-4" />)
      i++
      continue
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const text  = h[2]
      const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm'] as const
      const Tag   = (`h${level + 1}`) as 'h2' | 'h3' | 'h4' | 'h5'
      out.push(
        <Tag key={key++} className={`text-noc-bright font-semibold ${sizes[level - 1]} mt-5 mb-2`}>
          {renderInline(text)}
        </Tag>,
      )
      i++
      continue
    }

    // Lists (collect contiguous)
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (
        i < lines.length
        && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))
        i++
      }
      const ListTag = ordered ? 'ol' : 'ul'
      out.push(
        <ListTag key={key++}
          className={`${ordered ? 'list-decimal' : 'list-disc'} list-outside pl-5 my-2 flex flex-col gap-1`}>
          {items.map((it, idx) => (
            <li key={idx} className="text-sm leading-relaxed">{renderInline(it)}</li>
          ))}
        </ListTag>,
      )
      continue
    }

    // Blank line → paragraph break
    if (line.trim() === '') { i++; continue }

    // Paragraph (collect until blank line or block-starter)
    const para: string[] = []
    while (
      i < lines.length
      && lines[i].trim() !== ''
      && !lines[i].startsWith('```')
      && !/^(#{1,4})\s+/.test(lines[i])
      && !/^\s*---\s*$/.test(lines[i])
      && !/^\s*[-*]\s+/.test(lines[i])
      && !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    out.push(
      <p key={key++} className="text-sm leading-relaxed my-2">
        {renderInline(para.join(' '))}
      </p>,
    )
  }

  return out
}

// ── Inline (bold, italic, code) ─────────────────────────────────────────────

/** Tokenise inline markdown into React nodes. */
function renderInline(text: string): ReactNode {
  // Order matters: code first (so its contents aren't parsed), then bold, then italic.
  const out: ReactNode[] = []
  let rest = text
  let key  = 0

  while (rest.length > 0) {
    const next = findNextMarker(rest)
    if (!next) {
      out.push(<Fragment key={key++}>{rest}</Fragment>)
      break
    }

    if (next.index > 0) {
      out.push(<Fragment key={key++}>{rest.slice(0, next.index)}</Fragment>)
    }

    if (next.kind === 'code') {
      out.push(
        <code key={key++} className="bg-noc-bg border border-noc-border px-1 py-0.5 rounded text-xs font-mono text-link-packet">
          {next.content}
        </code>,
      )
    } else if (next.kind === 'bold') {
      out.push(
        <strong key={key++} className="text-noc-bright font-semibold">
          {renderInline(next.content)}
        </strong>,
      )
    } else {
      out.push(
        <em key={key++} className="text-noc-text italic">
          {renderInline(next.content)}
        </em>,
      )
    }
    rest = rest.slice(next.endIndex)
  }

  return <>{out}</>
}

interface Token {
  index:    number   // start
  endIndex: number   // end (exclusive of closing delimiter)
  kind:     'code' | 'bold' | 'italic'
  content:  string
}

function findNextMarker(s: string): Token | null {
  let best: Token | null = null
  function consider(t: Token | null) {
    if (!t) return
    if (best === null || t.index < best.index) best = t
  }
  consider(findDelim(s, '`', '`', 'code'))
  consider(findDelim(s, '**', '**', 'bold'))
  consider(findDelim(s, '*', '*', 'italic'))
  return best
}

function findDelim(s: string, open: string, close: string, kind: Token['kind']): Token | null {
  const start = s.indexOf(open)
  if (start === -1) return null
  // For *italic*, avoid matching the ** bold marker
  if (kind === 'italic' && (s[start + 1] === '*' || (start > 0 && s[start - 1] === '*'))) {
    const next = findDelim(s.slice(start + 1), open, close, kind)
    return next ? { ...next, index: next.index + start + 1, endIndex: next.endIndex + start + 1 } : null
  }
  const after = start + open.length
  const end   = s.indexOf(close, after)
  if (end === -1) return null
  return {
    index:    start,
    endIndex: end + close.length,
    kind,
    content:  s.slice(after, end),
  }
}
