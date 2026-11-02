import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Markdown sin HTML crudo; los enlaces se abren fuera y sin acceso al opener. */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
