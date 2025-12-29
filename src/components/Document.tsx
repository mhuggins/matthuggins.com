import dedent from "dedent";
import type { ReactNode } from "react";

interface DocumentProps {
  children: ReactNode;
  scripts?: string[];
  styles?: string[];
}

export function Document({ children, scripts = [], styles = [] }: DocumentProps) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* REF: https://github.com/vitejs/vite/issues/1984 */}
        {!import.meta.env.PROD && (
          <script type="module">{dedent`
          import RefreshRuntime from "/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
          `}</script>
        )}
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="icon" type="image/x-icon" href="/assets/icon/favicon.ico" />
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        {scripts.map((src) => (
          <script key={src} type="module" src={src} />
        ))}
        <script
          async
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          data-hostname="matthuggins.com"
        />
      </body>
    </html>
  );
}
