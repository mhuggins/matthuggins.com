import { shortestAngleDiff } from "./utils";

interface PlayerState {
  upX: number;
  upY: number;
  onGround: boolean;
  x: number;
  y: number;
}

export class Camera {
  angle = 0;

  update(player: PlayerState): void {
    const targetAngle = Math.atan2(player.upX, -player.upY);
    const follow = player.onGround ? 0.18 : 0.12;
    this.angle += shortestAngleDiff(this.angle, targetAngle) * follow;
  }

  worldToScreen(
    wx: number,
    wy: number,
    player: PlayerState,
    canvas: HTMLCanvasElement,
  ): { x: number; y: number } {
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const dx = wx - player.x;
    const dy = wy - player.y;
    const c = Math.cos(-this.angle);
    const s = Math.sin(-this.angle);
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  }
}
