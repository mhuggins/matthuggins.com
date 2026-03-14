import { Part as EnginePart } from "@matthuggins/platforming-engine";
import { angleToUpVector } from "../../helpers/angleToUpVector";
import { clamp } from "../../helpers/clamp";
import { clampVelocity } from "../../helpers/clampVelocity";
import { dot } from "../../helpers/dot";
import { roundRect } from "../../helpers/roundRect";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import type { Input } from "../Input";
import { StunModifier } from "../modifiers/StunModifier";
import {
  playJumpSound,
  playLandSound,
  startJetpackSound,
  startWalkSound,
  stopJetpackSound,
  stopWalkSound,
} from "../sounds";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";
import { Platform } from "./Platform";

const JUMP_STRENGTH = 7.8;
const JETPACK_FORCE = 0.35;
const JETPACK_DRAIN = 0; // 0.0125;
const AIR_ROTATE_SPEED = 0.01;

export class Player extends Part {
  readonly layer = RenderLayer.PLAYER;
  override readonly isPlayer = true;

  // Engine-player interface fields — used by engine World's updatePlayerGrounding
  jumpStrength: number = JUMP_STRENGTH;
  gradability: number = Math.PI / 3; // 60° max slope
  groundedOn: EnginePart | null = null;
  groundedNormal: { x: number; y: number } = { x: 0, y: -1 };
  surfaceTangent: { x: number; y: number } = { x: 1, y: 0 };

  override radius = 12;
  currentPlanet!: Planet;
  activePlanet: Planet | undefined = undefined;
  activePlatform: Platform | undefined = undefined;
  mode: "grounded" | "air" = "grounded";
  freeAngle = 0;
  jetpackArmed = false;
  jetpackActive = false;
  hasUsedJetpackThisAirborne = false;
  fuel = 1;
  maxFuel = 1;
  jumpAngularVelocity = 0;
  jumpAngularVelocityMax = 0;
  private prevJetpackActive = false;
  private prevWalkActive = false;
  private platformLandingCooldown = 0;

  /** Convenience getter: grounded when the engine has set a groundedOn surface. */
  get onGround(): boolean {
    return this.groundedOn !== null;
  }

  /** Engine callback: veto grounding on specific surfaces (e.g. jump cooldown). */
  canGroundOn(surface: EnginePart): boolean {
    if (surface instanceof Platform && this.platformLandingCooldown > 0) return false;
    return true;
  }

  /** Engine callback: fires when the player first lands on a surface. */
  onLand(surface: EnginePart): void {
    playLandSound();
    if (surface instanceof Platform) {
      this.activePlatform = surface;
      this.currentPlanet = surface.planet;
    } else {
      this.activePlatform = undefined;
    }
    this.jetpackArmed = false;
    this.jetpackActive = false;
    this.hasUsedJetpackThisAirborne = false;
    this.mode = "grounded";
  }

  /** Engine callback: fires when the player leaves the ground. */
  onLeaveGround(): void {
    this.activePlatform = undefined;
    this.mode = "air";
  }

  reset(): void {
    const p = this.world.planets[0];
    this.x = p ? p.x : 0;
    this.y = p ? p.y - surfaceRadiusAt(p, -Math.PI / 2) - this.radius : 0;
    this.vx = 0;
    this.vy = 0;
    this.groundedOn = null;
    this.currentPlanet = p;
    this.activePlanet = p;
    this.activePlatform = undefined;
    this.mode = "grounded";
    this.mass = 80;
    this.upX = 0;
    this.upY = -1;
    this.groundedNormal = { x: 0, y: -1 };
    this.surfaceTangent = { x: 1, y: 0 };
    this.freeAngle = 0;
    this.jetpackArmed = false;
    this.jetpackActive = false;
    this.hasUsedJetpackThisAirborne = false;
    this.maxFuel = 1.0;
    this.fuel = this.maxFuel;
    this.platformLandingCooldown = 0;
  }

  override applyInputs(input: Input): void {
    const move =
      (input.isDown("KeyD") || input.isDown("ArrowRight") ? 1 : 0) -
      (input.isDown("KeyA") || input.isDown("ArrowLeft") ? 1 : 0);

    if (input.justReleased("Space") && !this.onGround) {
      this.jetpackArmed = true;
    }

    if (this.onGround) {
      this.jetpackArmed = false;
      this.jetpackActive = false;
      this.hasUsedJetpackThisAirborne = false;
      this.fuel = this.maxFuel;
      this.mode = "grounded";

      const platform = this.activePlatform;

      if (platform) {
        // ── Platform grounding ──────────────────────────────────────────────
        const planet = platform.planet;
        const radialX = this.groundedNormal.x;
        const radialY = this.groundedNormal.y;
        const tangentX = this.surfaceTangent.x;
        const tangentY = this.surfaceTangent.y;
        const up = this.groundedNormal;

        // How far along the platform (in the tangent direction) is the player?
        const dx = this.x - planet.x;
        const dy = this.y - planet.y;
        const tangComp = dx * tangentX + dy * tangentY;
        const halfEdge = platform.width / 2 + this.radius;

        if (Math.abs(tangComp) > halfEdge) {
          // Walked off the edge — transition to air.
          this.groundedOn = null;
          this.activePlatform = undefined;
          this.mode = "air";
          this.platformLandingCooldown = 5;
        } else {
          // Snap to platform top surface, preserving tangential offset
          const targetRadial = platform.topRadius + this.radius;
          this.x = planet.x + radialX * targetRadial + tangentX * tangComp;
          this.y = planet.y + radialY * targetRadial + tangentY * tangComp;

          const walkSpeed = 2.4;
          this.vx = tangentX * walkSpeed * move;
          this.vy = tangentY * walkSpeed * move;

          this.upX = up.x;
          this.upY = up.y;
          this.freeAngle = Math.atan2(this.upX, -this.upY);

          if (input.justPressed("Space")) {
            playJumpSound();
            const vt = dot(this.vx, this.vy, tangentX, tangentY);
            const jumpDist = targetRadial;
            this.jumpAngularVelocity = vt / jumpDist;
            this.jumpAngularVelocityMax = Math.max(
              Math.abs(this.jumpAngularVelocity),
              walkSpeed / jumpDist,
            );
            this.vx += up.x * JUMP_STRENGTH;
            this.vy += up.y * JUMP_STRENGTH;
            this.groundedOn = null;
            this.activePlatform = undefined;
            this.mode = "air";
            this.jetpackArmed = false;
            this.hasUsedJetpackThisAirborne = false;
            this.platformLandingCooldown = 5;
          }
        }
      } else {
        // ── Planet grounding ────────────────────────────────────────────────
        const planet = this.currentPlanet;
        this.activePlanet = planet;

        const radialX = this.groundedNormal.x;
        const radialY = this.groundedNormal.y;
        const tangentX = this.surfaceTangent.x;
        const tangentY = this.surfaceTangent.y;
        const up = this.groundedNormal;

        const playerAngle = Math.atan2(this.y - planet.y, this.x - planet.x);
        const surfR = surfaceRadiusAt(planet, playerAngle);
        const targetDist = surfR + this.radius;

        this.x = planet.x + radialX * targetDist;
        this.y = planet.y + radialY * targetDist;

        const walkSpeed = 2.4;
        this.vx = tangentX * walkSpeed * move;
        this.vy = tangentY * walkSpeed * move;

        this.upX = up.x;
        this.upY = up.y;
        this.freeAngle = Math.atan2(this.upX, -this.upY);

        if (input.justPressed("Space")) {
          playJumpSound();
          const vt = dot(this.vx, this.vy, tangentX, tangentY);
          this.jumpAngularVelocity = vt / targetDist;
          this.jumpAngularVelocityMax = Math.max(
            Math.abs(this.jumpAngularVelocity),
            walkSpeed / targetDist,
          );

          this.vx += up.x * JUMP_STRENGTH;
          this.vy += up.y * JUMP_STRENGTH;
          this.groundedOn = null;
          this.mode = "air";
          this.jetpackArmed = false;
          this.hasUsedJetpackThisAirborne = false;
        }
      }
    } else {
      this.jetpackActive = false;
      this.mode = "air";

      if (this.platformLandingCooldown > 0) {
        this.platformLandingCooldown--;
      }

      const blendedG = this.world.getBlendedGravity(this.x, this.y);

      if (this.hasUsedJetpackThisAirborne) {
        this.freeAngle += move * AIR_ROTATE_SPEED;
      } else {
        const fromPlanetX = this.x - this.currentPlanet.x;
        const fromPlanetY = this.y - this.currentPlanet.y;
        const r = Math.hypot(fromPlanetX, fromPlanetY);
        const fromPlanet = { x: fromPlanetX / r, y: fromPlanetY / r };
        this.freeAngle = Math.atan2(fromPlanet.x, -fromPlanet.y);

        const jumpInfluence = blendedG.influences.find((g) => g.planet === this.currentPlanet);
        const jumpStrength = jumpInfluence?.strength ?? 0;
        const totalStrength = blendedG.influences.reduce((sum, g) => sum + g.strength, 0);
        const dominance = totalStrength > 0 ? jumpStrength / totalStrength : 0;

        const airSteerAccel = 0.0003;
        this.jumpAngularVelocity = clamp(
          this.jumpAngularVelocity + move * airSteerAccel * dominance,
          -this.jumpAngularVelocityMax,
          this.jumpAngularVelocityMax,
        );

        const tang = { x: -fromPlanet.y, y: fromPlanet.x };
        const currentVt = dot(this.vx, this.vy, tang.x, tang.y);
        const targetVt = this.jumpAngularVelocity * r;
        const dvt = (targetVt - currentVt) * dominance;
        this.vx += tang.x * dvt;
        this.vy += tang.y * dvt;
      }

      const facingUp = angleToUpVector(this.freeAngle);

      if (this.jetpackArmed && input.isDown("Space") && this.fuel > 0) {
        this.vx += facingUp.x * JETPACK_FORCE;
        this.vy += facingUp.y * JETPACK_FORCE;
        this.fuel = Math.max(0, this.fuel - JETPACK_DRAIN);
        this.jetpackActive = true;
        this.hasUsedJetpackThisAirborne = true;
      }

      this.upX = facingUp.x;
      this.upY = facingUp.y;
    }

    if (this.jetpackActive && !this.prevJetpackActive) {
      startJetpackSound();
    }
    if (!this.jetpackActive && this.prevJetpackActive) {
      stopJetpackSound();
    }
    this.prevJetpackActive = this.jetpackActive;

    const walkActive = this.onGround && move !== 0;
    if (walkActive && !this.prevWalkActive) {
      startWalkSound();
    }
    if (!walkActive && this.prevWalkActive) {
      stopWalkSound();
    }
    this.prevWalkActive = walkActive;
  }

  doUpdate(): void {
    if (!this.inputsEnabled) {
      stopWalkSound();
      if (this.jetpackActive) {
        stopJetpackSound();
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    if (!this.onGround) {
      const capped = clampVelocity(this.vx, this.vy, 9);
      this.vx = capped.vx;
      this.vy = capped.vy;

      // Underside bounce — game-specific: engine skips underside contacts
      // (isPermeable returns true for bottom approach), so we handle it manually.
      for (const platform of this.world.platforms) {
        const sn = platform.topNormal;
        const pdx = this.x - platform.x;
        const pdy = this.y - platform.y;
        // Player must be on the inward (bottom) side of the platform.
        if (pdx * sn.x + pdy * sn.y >= 0) continue;

        const cosA = Math.cos(-platform.tiltAngle);
        const sinA = Math.sin(-platform.tiltAngle);
        const localX = pdx * cosA - pdy * sinA;
        const localY = pdx * sinA + pdy * cosA;
        const hw = platform.width / 2;
        const hh = platform.height / 2;
        const closestX = Math.max(-hw, Math.min(hw, localX));
        const closestY = Math.max(-hh, Math.min(hh, localY));
        const distLen = Math.hypot(localX - closestX, localY - closestY);
        if (distLen >= this.radius) continue;

        // Kill velocity component directed toward the platform top.
        const approachSpeed = this.vx * sn.x + this.vy * sn.y;
        if (approachSpeed > 0) {
          this.vx -= approachSpeed * sn.x;
          this.vy -= approachSpeed * sn.y;
        }

        // Push player out of overlap in the inward direction.
        const overlap = this.radius - distLen;
        this.x -= sn.x * overlap;
        this.y -= sn.y * overlap;
        break;
      }
    }
  }

  override onSpawn = (): void => {
    this.modifiers.push(new StunModifier(this));
  };

  override onCollide = (other: EnginePart, nx: number, ny: number, impactSpeed: number): void => {
    if (this.onGround && !other.anchored) {
      this.groundedOn = null;
      this.activePlatform = undefined;
      this.mode = "air";
    }

    for (const m of this.modifiers) {
      m.onCollide(other, nx, ny, impactSpeed);
    }
  };

  doRender(ctx: CanvasRenderingContext2D): void {
    const canvas = this.world.canvas;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 13, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f7f8ff";
    roundRect(ctx, -8, -12, 16, 24, 6);
    ctx.fill();

    ctx.fillStyle = "#74d8ff";
    roundRect(ctx, -6, -8, 12, 6, 3);
    ctx.fill();

    ctx.fillStyle = "#d9def8";
    roundRect(ctx, 6, -6, 4, 10, 2);
    ctx.fill();

    ctx.fillStyle = "#ff6378";
    ctx.beginPath();
    ctx.arc(0, 10, 3, 0, Math.PI * 2);
    ctx.fill();

    if (this.jetpackActive) {
      ctx.fillStyle = "rgba(255,180,80,0.95)";
      ctx.beginPath();
      ctx.moveTo(-4, 12);
      ctx.lineTo(0, 24 + Math.random() * 4);
      ctx.lineTo(4, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,230,120,0.95)";
      ctx.beginPath();
      ctx.moveTo(-2.2, 12);
      ctx.lineTo(0, 18 + Math.random() * 3);
      ctx.lineTo(2.2, 12);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
