import { useEffect } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";

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
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted) {
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
      no_footer: true,
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
  }, [isMounted, pageId, pageTitle]);

  if (!isMounted) {
    return null;
  }

  return <div id="remark42" />;
}
