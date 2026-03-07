const CSS = `
@media (prefers-reduced-motion: no-preference) {
  /* Inset box-shadow fills the row without affecting child opacity */
  @keyframes truck-flash {
    0%   { box-shadow: inset 0 0 0 999px rgba(34,197,94,0); }
    20%  { box-shadow: inset 0 0 0 999px rgba(34,197,94,0.35); }
    100% { box-shadow: inset 0 0 0 999px rgba(34,197,94,0); }
  }

  @keyframes robot-idle {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
}
`;

let injected = false;

export function ensureGameAnimations(): void {
  if (injected || typeof document === "undefined") {
    return;
  }
  injected = true;
  const el = document.createElement("style");
  el.textContent = CSS;
  document.head.appendChild(el);
}
