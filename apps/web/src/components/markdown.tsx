import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prose } from "@compass/ui";

/** Course Markdown in the house prose style. Raw HTML in the source is skipped, never rendered. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <Prose className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {children}
      </ReactMarkdown>
    </Prose>
  );
}
