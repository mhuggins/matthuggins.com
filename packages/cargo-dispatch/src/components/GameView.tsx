import type { ReactNode } from "react";
import type { WorldState } from "../types";
import { GameRenderer } from "./GameRenderer";
import { InfoBar } from "./InfoBar";

interface GameViewProps {
  world: WorldState;
  overlay?: ReactNode;
}

export function GameView({ world, overlay }: GameViewProps) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-200">
      <GameRenderer world={world} />
      <InfoBar world={world} />
      {overlay}
    </div>
  );
}
