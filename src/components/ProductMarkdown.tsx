import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders the structured product description (with H2/H3 sections, bullets, etc.)
// in a consistent, branded way. Colors the section headings using the AccessNow palette.
export function ProductMarkdown({ source }: { source?: string | null }) {
  if (!source) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="mt-2 mb-3 text-xl font-bold text-violet-700">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h2 className="mt-6 mb-2 text-lg font-bold text-indigo-700">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-1 text-base font-semibold text-emerald-700">
            {children}
          </h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 my-2 space-y-1 marker:text-primary">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 my-2 space-y-1 marker:text-primary">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        p: ({ children }) => (
          <p className="my-2 leading-relaxed text-slate-700">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-900">{children}</strong>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80">
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-border/60" />,
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
