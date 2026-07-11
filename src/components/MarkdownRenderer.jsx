import React from 'react';

/**
 * MarkdownRenderer — Shared safe Markdown-to-React renderer.
 *
 * Replaces the 3 duplicated renderMarkdown() functions that were
 * copy-pasted across AIPlanner, TravelAdvisory, and HelpCenter.
 *
 * Supports: ## / ### / #### headings, **bold**, *italic*,
 * bullet lists (- / *), numbered lists (1.), and safety-index highlighting.
 *
 * Security: All text is rendered via React's built-in XSS escaping (JSX text nodes).
 * No dangerouslySetInnerHTML is used anywhere.
 */

/** Parse **bold** and *italic* inline formatting. */
function parseInlineFormatting(text) {
  // Split on **bold** first
  const boldParts = text.split(/\*\*(.*?)\*\*/g);
  return boldParts.map((segment, i) => {
    if (i % 2 === 1) {
      // Bold segment
      return <strong key={`b-${i}`}>{segment}</strong>;
    }
    // Within non-bold segments, parse *italic*
    const italicParts = segment.split(/\*(.*?)\*/g);
    return italicParts.map((part, j) => {
      if (j % 2 === 1) {
        return <em key={`i-${i}-${j}`}>{part}</em>;
      }
      return part;
    });
  });
}

/**
 * Render a markdown string as React elements.
 * @param {object} props
 * @param {string} props.content — the markdown text to render
 * @param {string} [props.className] — optional wrapper className
 * @returns {React.ReactElement|null}
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let inList = false;

  const flushList = (key) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ marginBottom: '1rem', marginLeft: '1.5rem' }}>
          {[...listItems]}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(
        <h2 key={index} style={{
          fontSize: '1.25rem', color: 'var(--primary-color)',
          marginTop: '1.25rem', marginBottom: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem'
        }}>
          {parseInlineFormatting(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(
        <h3 key={index} style={{
          fontSize: '1.1rem', color: 'var(--text-main)',
          marginTop: '1rem', marginBottom: '0.5rem'
        }}>
          {parseInlineFormatting(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      flushList(index);
      elements.push(
        <h4 key={index} style={{
          fontSize: '0.95rem', color: 'var(--warning-color)',
          marginTop: '0.75rem', marginBottom: '0.25rem'
        }}>
          {parseInlineFormatting(trimmed.substring(5))}
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={`li-${index}`} style={{
          marginBottom: '0.35rem', color: '#e2e8f0', fontSize: '0.9rem'
        }}>
          {parseInlineFormatting(trimmed.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(index);
      const dotIndex = trimmed.indexOf('.');
      elements.push(
        <p key={index} style={{
          marginBottom: '0.5rem', fontSize: '0.9rem',
          color: '#cbd5e1', paddingLeft: '0.5rem'
        }}>
          <strong>{trimmed.substring(0, dotIndex + 1)}</strong>{' '}
          {parseInlineFormatting(trimmed.substring(dotIndex + 1).trim())}
        </p>
      );
    } else if (trimmed === '') {
      flushList(index);
    } else {
      flushList(index);
      // Highlight safety rating blocks
      if (trimmed.includes('Safety Index:') || trimmed.includes('सुरक्षा सूचकांक:')) {
        elements.push(
          <div key={index} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem', padding: '0.75rem',
            marginBottom: '1rem', fontSize: '1.05rem'
          }}>
            {parseInlineFormatting(trimmed)}
          </div>
        );
      } else {
        elements.push(
          <p key={index} style={{
            marginBottom: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1'
          }}>
            {parseInlineFormatting(trimmed)}
          </p>
        );
      }
    }
  });

  flushList('final');

  return <div className={`markdown-body ${className}`.trim()}>{elements}</div>;
}
