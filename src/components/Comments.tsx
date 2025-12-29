import { useEffect, useRef } from "react";

interface CommentsProps {
  pageId: string;
  pageTitle: string;
}

declare global {
  interface Window {
    REMARK42?: {
      createInstance: (config: Record<string, unknown>) => void;
      destroy: () => void;
    };
    remark_config?: Record<string, unknown>;
  }
}

export function Comments({ pageId, pageTitle }: CommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const host = import.meta.env.VITE_REMARK42_HOST;
    const siteId = import.meta.env.VITE_REMARK42_SITE_ID;

    if (!host || !siteId) {
      return;
    }

    const config = {
      host,
      site_id: siteId,
      url: `${window.location.origin}/blog/posts/${pageId}`,
      page_title: pageTitle,
      theme: "light",
      locale: "en",
    };

    window.remark_config = config;

    const script = document.createElement("script");
    script.src = `${host}/web/embed.js`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (window.REMARK42) {
        window.REMARK42.destroy();
      }
      script.remove();
    };
  }, [pageId, pageTitle]);

  return <div ref={containerRef} id="remark42" />;
}
