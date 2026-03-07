import type { WorldState } from "../types";
import { GameRenderer } from "./GameRenderer";

interface GameViewProps {
  world: WorldState | null;
}

export function GameView({ world }: GameViewProps) {
  if (world) {
    return (
      <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
        <GameRenderer world={world} />
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-gray-300 border-dashed p-8 text-center text-[13px] text-gray-400">
      Press Run to start the simulation
    </div>
  );
}
