import { Camera as EngineCamera, type Point } from "@matthuggins/platforming-engine";
import { shortestAngleDiff } from "../helpers/shortestAngleDiff";
import type { World } from "./World";

interface PlayerState {
  upX: number;
  upY: number;
  onGround: boolean;
  x: number;
  y: number;
}

export class Camera extends EngineCamera {
  angle = 0;
  private world: World | undefined;

  setWorld(world: World): void {
    this.world = world;
  }

  override reset = (): void => {
    this.angle = 0;
  };

  override update = (): void => {
    const player = this.world?.player;
    if (!player) return;
    const targetAngle = Math.atan2(player.upX, -player.upY);
    const follow = player.onGround ? 0.18 : 0.12;
    this.angle += shortestAngleDiff(this.angle, targetAngle) * follow;
  };

  worldToScreen(wx: number, wy: number, player: PlayerState, canvas: HTMLCanvasElement): Point {
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const dx = wx - player.x;
    const dy = wy - player.y;
    const c = Math.cos(-this.angle);
    const s = Math.sin(-this.angle);
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  }
}
