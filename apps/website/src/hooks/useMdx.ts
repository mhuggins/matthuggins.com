import { useEffect, useState } from "react";
import { BlogPostLoader } from "@/data/blog-metadata";

const defaultComponent: React.ComponentType = () => null;

export function useMdx(loader?: BlogPostLoader) {
  const [state, setState] = useState<React.ComponentType>(() => defaultComponent);

  useEffect(() => {
    let cancelled = false;

    if (!loader) {
      setState(defaultComponent);
      return;
    }

    loader
      .then((Component) => {
        if (!cancelled) {
          // Ensure we're setting a valid React component
          setState(() => Component);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load blog post", error);
          setState(defaultComponent);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return state;
}
