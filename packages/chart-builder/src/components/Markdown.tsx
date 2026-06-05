import { cn } from "@matthuggins/ui";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders chat text as GitHub-flavored markdown. react-markdown renders to React
 * elements and ignores raw HTML by default, so model output can't inject markup
 * (no dangerouslySetInnerHTML, no XSS).
 *
 * Styling comes from the typography plugin's `prose` classes. This only works
 * because ChartBuilder is no longer mounted inside a `not-prose` (or `.prose`)
 * subtree, so the plugin's selectors apply normally here. Text colors are forced
 * to `currentColor` so each bubble's own color wins, keeping it readable on both
 * the light assistant bubble and the primary-colored user one.
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words",
        // Inherit the bubble's color instead of prose's own palette.
        "prose-a:text-current prose-blockquote:text-current prose-code:text-current prose-em:text-current prose-headings:text-current prose-strong:text-current text-current",
        // Compact spacing for chat bubbles.
        "prose-ol:my-1 prose-p:my-1 prose-pre:my-2 prose-ul:my-1 first:prose-p:mt-0 last:prose-p:mb-0",
        // Keep links and code blocks legible regardless of bubble color.
        "prose-pre:bg-black/80 prose-pre:text-white prose-a:underline",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{children}</ReactMarkdown>
    </div>
  );
}
