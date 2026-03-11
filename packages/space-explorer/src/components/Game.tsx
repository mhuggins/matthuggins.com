import { cn } from "@matthuggins/ui";
import { useEffect, useRef } from "react";
import { bindGame } from "../lib/bindGame";

export const SpaceExplorer = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const fuelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const status = statusRef.current;
    const fuel = fuelRef.current;

    if (!container || !canvas || !status || !fuel) {
      return undefined;
    }

    return bindGame({ container, canvas, status, fuel });
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-[600px] overflow-hidden bg-[#0a1020] font-sans", className)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      <div className="absolute top-3 left-3 max-w-[360px] rounded-xl border border-white/[0.08] bg-black/[0.42] px-3 py-[10px] text-[#dce7ff] text-sm leading-[1.45] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm">
        <div ref={statusRef} className="mt-1.5 opacity-[0.82]" />
        <div ref={fuelRef} className="opacity-[0.82]" />
      </div>

      <button
        onClick={(e) => {
          toggleFullscreen(containerRef.current);
          e.currentTarget.blur();
        }}
        className="absolute right-3 bottom-3 cursor-pointer rounded-lg border border-white/[0.08] bg-black/[0.42] p-2 text-[#dce7ff] backdrop-blur-sm transition-colors hover:bg-black/[0.65]"
        aria-label="Toggle fullscreen"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5" />
        </svg>
      </button>
    </div>
  );
};

function toggleFullscreen(element: Element | null) {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    element?.requestFullscreen();
  }
}
