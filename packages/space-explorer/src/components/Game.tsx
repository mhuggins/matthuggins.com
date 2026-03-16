import { cn } from "@matthuggins/ui";
import { CornersInIcon, CornersOutIcon, MusicNotesSimpleIcon } from "@phosphor-icons/react";
import { ButtonHTMLAttributes, useEffect, useRef, useState } from "react";
import { createWorld } from "../lib/createWorld";
import { startAmbientSound, stopAmbientSound } from "../lib/sounds";

export const SpaceExplorer = ({ className }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [displayFullscreen, setDisplayFullscreen] = useState(false);
  const [playAmbientSounds, setPlayAmbientSounds] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return undefined;
    }

    const world = createWorld({ canvas, container });
    world.start();
    startAmbientSound();
    return () => {
      world.stop();
      stopAmbientSound();
    };
  }, []);

  const toggleAmbientSound = () => {
    setPlayAmbientSounds((prev) => {
      prev ? stopAmbientSound() : startAmbientSound();
      return !prev;
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative h-[600px] overflow-hidden bg-[#0a1020] font-sans", className)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        <ConsoleButton onClick={toggleAmbientSound} aria-label="Toggle background sound">
          <MusicNotesSimpleIcon
            size={24}
            weight="fill"
            className={cn(!playAmbientSounds && "opacity-25")}
          />
        </ConsoleButton>
        <ConsoleButton
          onClick={async () => {
            setDisplayFullscreen(await toggleFullscreen(containerRef.current));
          }}
          aria-label="Toggle fullscreen"
        >
          {displayFullscreen ? <CornersInIcon size={24} /> : <CornersOutIcon size={24} />}
        </ConsoleButton>
      </div>
    </div>
  );
};

function ConsoleButton({ className, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={(e) => {
        onClick?.(e);
        e.currentTarget.blur();
      }}
      className={cn(
        "cursor-pointer rounded-lg border border-white/[0.08] bg-black/[0.42] p-2 text-[#dce7ff] backdrop-blur-sm transition-colors hover:bg-black/[0.65]",
        className,
      )}
    />
  );
}

async function toggleFullscreen(element: Element | null): Promise<boolean> {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return false;
  }

  try {
    await element?.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}
