import { marked } from "marked";

/**
 * Converts markdown text to HTML string
 * Preserves line breaks from YAML multi-line strings by converting them to markdown line breaks
 */
export function markdownToHtml(markdown: string): string {
  // Convert single newlines to markdown line breaks (two spaces + newline)
  // This preserves line breaks from YAML multi-line strings
  const processedMarkdown = markdown.replace(/([^\n])\n([^\n])/g, "$1  \n$2");

  return marked.parse(processedMarkdown, { async: false }) as string;
}

/**
 * React component prop for rendering HTML content safely
 */
export function createHtmlProps(htmlContent: string): {
  dangerouslySetInnerHTML: { __html: string };
} {
  return { dangerouslySetInnerHTML: { __html: htmlContent } };
}
