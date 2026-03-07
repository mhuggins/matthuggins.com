import type { WorldState } from "../types";
import { GameRenderer } from "./GameRenderer";
import { InfoBar } from "./InfoBar";

interface GameViewProps {
  world: WorldState;
}

export function GameView({ world }: GameViewProps) {
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
      <GameRenderer world={world} />
      <InfoBar world={world} />
    </div>
  );
}
