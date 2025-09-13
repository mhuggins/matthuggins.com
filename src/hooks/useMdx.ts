import { useEffect, useMemo, useState } from "react";
import { Frontmatter, getBlogPost } from "@/utils/getBlogPosts";

export function useMdx(slug: string) {
  const loader = useMemo(() => getBlogPost(slug), [slug]);

  const [state, setState] = useState<{ Component: React.ComponentType; frontmatter?: Frontmatter }>(
    {
      Component: () => null,
    },
  );

  useEffect(() => {
    let cancelled = false;

    loader().then((mod) => {
      if (!cancelled) {
        setState({ Component: mod.default, frontmatter: mod.frontmatter });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return state;
}
