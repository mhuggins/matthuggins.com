export type Theme = "light" | "dark";

export const THEME_COOKIE = "theme";

/**
 * Parse the theme from a cookie string. Works with both the server's
 * `req.headers.cookie` and the client's `document.cookie` so SSR and
 * hydration always derive the same value. Defaults to "light".
 */
export function parseThemeCookie(cookieHeader: string | undefined): Theme {
  if (!cookieHeader) {
    return "light";
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === THEME_COOKIE) {
      return rest.join("=") === "dark" ? "dark" : "light";
    }
  }

  return "light";
}

/** Persist the theme preference so the next SSR render matches. Client-only. */
export function writeThemeCookie(theme: Theme): void {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}
