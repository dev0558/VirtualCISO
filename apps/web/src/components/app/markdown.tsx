import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function extractReviewNotes(md: string): { body: string; notes: string[] } {
  const m = md.match(/<!-- review-notes: ([\s\S]*?) -->/);
  return { body: md.replace(/<!-- review-notes:[\s\S]*?-->/, "").trim(), notes: m ? m[1].split(" | ").filter(Boolean) : [] };
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[0.9375rem] leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mb-4 text-2xl font-semibold tracking-tight" {...p} />,
          h2: (p) => <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight" {...p} />,
          h3: (p) => <h3 className="mt-6 mb-2 font-semibold" {...p} />,
          p: (p) => <p className="my-3" {...p} />,
          ul: (p) => <ul className="my-3 list-disc space-y-1 pl-6" {...p} />,
          ol: (p) => <ol className="my-3 list-decimal space-y-1 pl-6" {...p} />,
          hr: () => <hr className="my-6" />,
          strong: (p) => <strong className="font-semibold" {...p} />,
          em: (p) => <em className="text-muted-foreground" {...p} />,
          table: (p) => <div className="my-4 overflow-x-auto rounded-lg border"><table className="w-full text-sm" {...p} /></div>,
          th: (p) => <th className="bg-muted/50 border-b px-3 py-2 text-left font-medium" {...p} />,
          td: (p) => <td className="border-b px-3 py-2" {...p} />,
          a: (p) => <a className="underline underline-offset-4" {...p} />,
          code: (p) => <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
