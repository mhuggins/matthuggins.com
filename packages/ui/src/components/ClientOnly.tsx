import { type FC, type ReactNode, useEffect, useState } from "react";

export interface ClientOnlyProps {
  /**
   * Rendered only after the component has mounted on the client. A function so
   * its (potentially browser-only) contents are never constructed during SSR or
   * the first hydration render.
   */
  children: () => ReactNode;
  /** Shown on the server and until the client has mounted. */
  fallback?: ReactNode;
}

/**
 * Defers rendering of its children until after the component mounts in the
 * browser. Use it to wrap client-only UI (browser APIs, lazy components,
 * canvas/DOM libraries) so the server and first client render match and
 * hydration can't mismatch.
 */
export const ClientOnly: FC<ClientOnlyProps> = ({ children, fallback = null }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children()}</>;
};
