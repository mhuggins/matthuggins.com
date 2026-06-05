import type { ComponentPropsWithoutRef } from "react";

/** Joins class strings, preserving any className MDX/rehype already injected. */
function merge(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

/**
 * Styles the HTML elements that markdown compiles to, approximating the old
 * `prose prose-gray dark:prose-invert` wrapper but applied per element instead
 * of via a container. Because the map only targets intrinsic tags, imported
 * components used in MDX (e.g. `<ChartBuilder />`) render completely untouched
 * and never sit inside a prose subtree, so they need no `not-prose` and can use
 * their own `prose` styling internally. Passed to `<Component components={...}>`
 * in apps/website/src/routes/lab.$id.tsx. Inline `<code>` is styled here; code
 * inside `<pre>` (Shiki) is reset by the `.mdx-prose pre code` rule in style.css.
 */
export const mdxProse = {
  p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className={merge("my-5 leading-7", className)} {...props} />
  ),
  a: ({ className, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      className={merge(
        "font-medium text-primary underline underline-offset-2 hover:text-primary-dark",
        className,
      )}
      {...props}
    />
  ),
  h1: ({ className, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className={merge(
        "mt-8 mb-4 font-bold text-3xl text-gray-900 tracking-tight dark:text-white",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={merge(
        "mt-8 mb-4 font-semibold text-2xl text-gray-900 tracking-tight dark:text-white",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className={merge("mt-6 mb-3 font-semibold text-gray-900 text-xl dark:text-white", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }: ComponentPropsWithoutRef<"h4">) => (
    <h4
      className={merge("mt-6 mb-2 font-semibold text-gray-900 text-lg dark:text-white", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className={merge("my-5 list-disc space-y-2 pl-6", className)} {...props} />
  ),
  ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className={merge("my-5 list-decimal space-y-2 pl-6", className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className={merge("leading-7", className)} {...props} />
  ),
  strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong
      className={merge("font-semibold text-gray-900 dark:text-white", className)}
      {...props}
    />
  ),
  em: ({ className, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className={merge("italic", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={merge(
        "my-5 border-gray-300 border-l-4 pl-4 text-gray-600 italic dark:border-white/20 dark:text-white/70",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: ComponentPropsWithoutRef<"hr">) => (
    <hr className={merge("my-8 border-gray-200 dark:border-white/10", className)} {...props} />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => (
    <code
      className={merge(
        "rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-gray-800 dark:bg-white/10 dark:text-white/90",
        className,
      )}
      {...props}
    />
  ),
  img: ({ className, ...props }: ComponentPropsWithoutRef<"img">) => (
    <img className={merge("my-6 rounded-lg", className)} {...props} />
  ),
  table: ({ className, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-6 overflow-x-auto">
      <table className={merge("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className={merge(
        "border border-gray-300 px-3 py-2 font-semibold text-gray-900 dark:border-white/15 dark:text-white",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td
      className={merge("border border-gray-300 px-3 py-2 dark:border-white/15", className)}
      {...props}
    />
  ),
};
