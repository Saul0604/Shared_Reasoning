import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a chat bubble with Markdown support.
 * Handles bold, italic, lists, tables, code blocks, etc.
 */
export default function MarkdownBubble({ content, className }) {
  return (
    <div className={className}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override default elements to avoid extra margins in bubbles
          p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children, inline }) =>
            inline !== false && !String(children).includes('\n') ? (
              <code style={{
                background: 'rgba(0,0,0,0.06)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.9em',
                fontFamily: "'Fira Code', 'Consolas', monospace",
              }}>{children}</code>
            ) : (
              <pre style={{
                background: 'rgba(0,0,0,0.06)',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.85em',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                margin: '8px 0',
              }}>
                <code>{children}</code>
              </pre>
            ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '12px 0', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9em',
                background: 'white',
              }}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: 'rgba(0,0,0,0.04)' }}>{children}</thead>,
          th: ({ children }) => (
            <th style={{
              textAlign: 'left',
              padding: '10px 14px',
              borderBottom: '2px solid rgba(0,0,0,0.1)',
              fontWeight: 700,
              color: '#1e293b',
              fontSize: '0.85em',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              color: '#334155'
            }}>{children}</td>
          ),
          tr: ({ children }) => (
            <tr style={{ transition: 'background-color 0.2s' }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              {children}
            </tr>
          ),
          h1: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: 700, margin: '8px 0 4px' }}>{children}</h3>,
          h2: ({ children }) => <h4 style={{ fontSize: '1.05em', fontWeight: 700, margin: '8px 0 4px' }}>{children}</h4>,
          h3: ({ children }) => <h5 style={{ fontSize: '1em', fontWeight: 600, margin: '6px 0 4px' }}>{children}</h5>,
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '3px solid rgba(0,0,0,0.15)',
              paddingLeft: '12px',
              margin: '8px 0',
              color: 'inherit',
              opacity: 0.85,
            }}>{children}</blockquote>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '12px 0' }} />,
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
