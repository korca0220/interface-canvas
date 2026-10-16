import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownPreview({ source }: { source: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{ a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" /> }}
    >
      {source}
    </Markdown>
  )
}
