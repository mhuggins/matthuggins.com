import { cn } from "@matthuggins/ui";
import type { CSSProperties } from "react";
import { useTheme } from "@/context/ThemeContext";

// Animated sun/moon switch built with Tailwind utilities. The morph is driven
// by React state (`isDark`); CSS transitions on the toggled classes animate it.
//
// Palette matches the site: white for the disc/sun and the "on" track (like the
// nav's white text), and the `--color-ink` token (a stable deep teal, defined in
// style.css) for the ink — used via `bg-ink` and referenced in the ring's inset
// box-shadows.
//
// Dimensions are fixed on Tailwind's spacing scale (track h-6/w-12, disc size-5,
// etc.). A few intricate icon values can't land on the 4px grid and stay as
// arbitrary classes: the off-centre crescent, the ring's inset shadows, and the
// rays' combined `translateX/rotate/translateY` transform (whose function order
// Tailwind's composable utilities can't reproduce). Each ray's only difference
// is its rotation, passed via the `--angle` CSS variable so the transform stays
// a static arbitrary class (Tailwind's JIT can't see an interpolated angle).
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className={cn(
        "relative block h-6 w-12 cursor-pointer rounded-full border-0 p-0 transition duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
        isDark ? "bg-white" : "bg-ink",
      )}
    >
      {/* Icon disc — slides across and clips the rays to its circle. */}
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 left-0.5 size-5 overflow-hidden rounded-full bg-white transition duration-300 ease-in-out",
          isDark ? "translate-x-6" : "translate-x-0",
        )}
      >
        {/* Sun/moon body. */}
        <span className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-3 rounded-full bg-white" />

        {/* Dark circle that grows into the moon's crescent cutout. */}
        <span
          className={cn(
            "absolute top-[calc(50%_-_7px)] left-[calc(50%_-_1px)] size-2 rounded-full bg-ink transition duration-300 ease-in-out",
            isDark
              ? "[transform:translate(0,0)_scale(1)]"
              : "[transform:translate(-3px,3px)_scale(0.2)]",
          )}
        />

        {/* Ring (inset shadow) that thins and grows into the moon. */}
        <span
          className={cn(
            "absolute top-0 left-0 size-5 rounded-full transition duration-300 ease-in-out",
            isDark
              ? "scale-100 [box-shadow:0_0_0_4px_var(--color-ink)_inset]"
              : "scale-[0.25] [box-shadow:0_0_0_10px_var(--color-ink)_inset]",
          )}
        />

        {/* Sun rays — retract and vanish in dark mode. */}
        {RAY_ANGLES.map((angle) => (
          <span
            key={angle}
            style={{ "--angle": `${angle}deg` } as CSSProperties}
            className={cn(
              "absolute top-1/2 left-1/2 h-[3px] w-0.5 origin-top rounded-[1px] bg-ink transition duration-300 ease-in-out",
              isDark
                ? "[transform:translateX(-50%)_rotate(var(--angle))_translateY(10px)_scale(0)]"
                : "[transform:translateX(-50%)_rotate(var(--angle))_translateY(4px)]",
            )}
          />
        ))}
      </span>
    </button>
  );
}
