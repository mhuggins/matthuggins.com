import {
  Part as EnginePart,
  Player as EnginePlayer,
  type Point,
} from "@matthuggins/platforming-engine";
import { angleToUpVector } from "../../helpers/angleToUpVector";
import { clamp } from "../../helpers/clamp";
import { clampVelocity } from "../../helpers/clampVelocity";
import { dot } from "../../helpers/dot";
import { normalize } from "../../helpers/normalize";
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
import { World } from "../World";
import { RenderLayer } from "./Part";
import { Planet } from "./Planet";
import { Platform } from "./Platform";

const PLAYER_WIDTH = 16;
const PLAYER_HEIGHT = 24;
const JUMP_STRENGTH = 7.8;
const JETPACK_FORCE = 0.35;
const JETPACK_DRAIN = 0; // 0.0125;
const AIR_ROTATE_SPEED = 0.01;

abstract class PlayerPart extends EnginePlayer {
  // Narrow world type to the concrete SpaceWorld for access to game-specific methods.
  declare world: World;

  abstract readonly layer: RenderLayer;
  override upX = 0;
  override upY = -1;
}

export class Player extends PlayerPart {
  readonly layer = RenderLayer.PLAYER;

  // Engine-player interface fields — used by engine World's updatePlayerGrounding
  override jumpStrength: number = JUMP_STRENGTH;
  override gradability: number = Math.PI / 3; // 60° max slope
  override groundedOn: EnginePart | null = null;
  override groundedNormal: Point = { x: 0, y: -1 };
  override surfaceTangent: Point = { x: 1, y: 0 };
  currentPlanet!: Planet;
  activePart: Platform | Ramp | undefined = undefined;
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
  override canGroundOn(surface: EnginePart): boolean {
    if (!this.inputsEnabled) {
      return false; // don't ground while stunned
    }
    if (
      (surface instanceof Platform || surface instanceof Ramp) &&
      this.platformLandingCooldown > 0
    ) {
      return false;
    }
    return true;
  }

  /** Engine callback: fires when the player first lands on a surface. */
  override onLand(surface: EnginePart): void {
    playLandSound();
    if (surface instanceof Platform || surface instanceof Ramp) {
      this.activePart = surface;
      this.currentPlanet = surface.planet;
    } else {
      this.activePart = undefined;
      if (surface instanceof Planet) {
        this.currentPlanet = surface;
      }
    }
    this.jetpackArmed = false;
    this.jetpackActive = false;
    this.hasUsedJetpackThisAirborne = false;
    this.mode = "grounded";
  }

  /** Engine callback: fires when the player leaves the ground. */
  override onLeaveGround(): void {
    const wasOnPart = this.activePart !== undefined;
    this.activePart = undefined;
    this.mode = "air";

    const planet = this.currentPlanet;
    const dx = this.x - planet.x;
    const dy = this.y - planet.y;
    const r = Math.hypot(dx, dy) || 0.001;
    const rad = normalize(dx, dy);

    if (wasOnPart) {
      // Strip tangential velocity so collision nudges at platform/ramp edges
      // don't cause backward drift. The player falls purely radially.
      const radialV = dot(this.vx, this.vy, rad.x, rad.y);
      this.vx = rad.x * radialV;
      this.vy = rad.y * radialV;
    }

    this.initAirAngularVelocity(-rad.y, rad.x, r);
  }

  reset(): void {
    const p = this.world.planets[0];
    this.x = p ? p.x : 0;
    this.y = p ? p.y - surfaceRadiusAt(p, -Math.PI / 2) - PLAYER_HEIGHT / 2 : 0;
    this.vx = 0;
    this.vy = 0;
    this.groundedOn = null;
    this.currentPlanet = p;
    this.activePart = undefined;
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

  protected override applyInputs(input: Input): void {
    let move =
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

      if (this.activePart instanceof Platform) {
        // ── Platform grounding ──────────────────────────────────────────────
        const platform = this.activePart;
        const planet = platform.planet;
        const radialX = this.groundedNormal.x;
        const radialY = this.groundedNormal.y;
        const tangentX = this.surfaceTangent.x;
        const tangentY = this.surfaceTangent.y;

        // How far along the platform (in the tangent direction) is the player?
        const dx = this.x - planet.x;
        const dy = this.y - planet.y;
        const tangComp = dx * tangentX + dy * tangentY;
        const halfEdge = platform.width / 2 + PLAYER_WIDTH / 2;

        if (Math.abs(tangComp) > halfEdge) {
          // Walked off the edge — transition to air.
          // Initialize angular velocity from walk speed so the air code
          // preserves tangential momentum and allows steering.
          this.initAirAngularVelocity(tangentX, tangentY, platform.topRadius + PLAYER_HEIGHT / 2);
          this.groundedOn = null;
          this.activePart = undefined;
          this.mode = "air";
          this.platformLandingCooldown = 20;
        } else {
          // Snap to platform top surface, preserving tangential offset
          const targetRadial = platform.topRadius + PLAYER_HEIGHT / 2;
          this.x = planet.x + radialX * targetRadial + tangentX * tangComp;
          this.y = planet.y + radialY * targetRadial + tangentY * tangComp;

          const walkSpeed = 2.4;
          this.vx = tangentX * walkSpeed * move;
          this.vy = tangentY * walkSpeed * move;

          // Orient upright relative to gravity source (planet center),
          // not the platform surface normal.
          const platRad = normalize(this.x - planet.x, this.y - planet.y);
          this.upX = platRad.x;
          this.upY = platRad.y;
          this.freeAngle = Math.atan2(platRad.x, -platRad.y);

          if (input.justPressed("Space")) {
            playJumpSound();
            this.initAirAngularVelocity(tangentX, tangentY, targetRadial);
            this.vx += platRad.x * JUMP_STRENGTH;
            this.vy += platRad.y * JUMP_STRENGTH;
            this.groundedOn = null;
            this.activePart = undefined;
            this.mode = "air";
            this.jetpackArmed = false;
            this.hasUsedJetpackThisAirborne = false;
            this.platformLandingCooldown = 20;
          }
        }
      } else if (this.activePart instanceof Ramp) {
        // ── Ramp grounding ──────────────────────────────────────────────────
        const ramp = this.activePart;
        const planet = ramp.planet;
        const sn = ramp.slopeNormal;
        const st = ramp.slopeTangent;

        // Project player onto the slope line.
        const dx = this.x - ramp.slopeStart.x;
        const dy = this.y - ramp.slopeStart.y;
        const t = dx * st.x + dy * st.y;

        const halfEdge = PLAYER_WIDTH / 2;

        if (t < halfEdge) {
          // Walked off the low end (base at planet surface) → air, will
          // re-ground on planet next tick.
          this.groundedOn = null;
          this.activePart = undefined;
          this.mode = "air";
          const r = Math.hypot(this.x - planet.x, this.y - planet.y);
          const rad = normalize(this.x - planet.x, this.y - planet.y);
          this.initAirAngularVelocity(-rad.y, rad.x, r);
        } else if (t > ramp.slopeLength - halfEdge) {
          // Reached the high end (wall corner) → air
          this.groundedOn = null;
          this.activePart = undefined;
          this.mode = "air";
          const r = Math.hypot(this.x - planet.x, this.y - planet.y);
          const rad = normalize(this.x - planet.x, this.y - planet.y);
          this.initAirAngularVelocity(-rad.y, rad.x, r);
        } else {
          // Snap to slope surface.
          const clampedT = Math.max(0, Math.min(ramp.slopeLength, t));
          const surfX = ramp.slopeStart.x + st.x * clampedT;
          const surfY = ramp.slopeStart.y + st.y * clampedT;
          this.x = surfX + (sn.x * PLAYER_HEIGHT) / 2;
          this.y = surfY + (sn.y * PLAYER_HEIGHT) / 2;

          // Walk along the slope. Determine which direction "right" maps to
          // by comparing the slope tangent to the engine's surface tangent.
          const tangentDot = st.x * this.surfaceTangent.x + st.y * this.surfaceTangent.y;
          const walkDir = tangentDot >= 0 ? 1 : -1;

          const walkSpeed = 2.4;
          this.vx = st.x * walkSpeed * move * walkDir;
          this.vy = st.y * walkSpeed * move * walkDir;

          // Orient upright relative to gravity source (planet center),
          // not the slope normal.
          const rampRad = normalize(this.x - planet.x, this.y - planet.y);
          this.upX = rampRad.x;
          this.upY = rampRad.y;
          this.freeAngle = Math.atan2(rampRad.x, -rampRad.y);

          if (input.justPressed("Space")) {
            playJumpSound();
            const r = Math.hypot(this.x - planet.x, this.y - planet.y);
            this.initAirAngularVelocity(-rampRad.y, rampRad.x, r);
            this.vx += rampRad.x * JUMP_STRENGTH;
            this.vy += rampRad.y * JUMP_STRENGTH;
            this.groundedOn = null;
            this.activePart = undefined;
            this.mode = "air";
            this.jetpackArmed = false;
            this.hasUsedJetpackThisAirborne = false;
          }
        }
      } else {
        // ── Planet grounding ────────────────────────────────────────────────
        const planet = this.currentPlanet;

        // Derive snap direction and walk tangent from the player's actual
        // angle relative to the planet center.  Using the groundedNormal
        // (from the height-field contact) would be wrong here because that
        // normal is computed at the deepest polygon *vertex*, which on a
        // convex surface is a trailing bottom corner — not the player center.
        const playerAngle = Math.atan2(this.y - planet.y, this.x - planet.x);
        const radialX = Math.cos(playerAngle);
        const radialY = Math.sin(playerAngle);
        const tangentX = -radialY;
        const tangentY = radialX;

        const surfR = surfaceRadiusAt(planet, playerAngle);
        const targetDist = surfR + PLAYER_HEIGHT / 2;

        this.x = planet.x + radialX * targetDist;
        this.y = planet.y + radialY * targetDist;

        const walkSpeed = 2.4;
        this.vx = tangentX * walkSpeed * move;
        this.vy = tangentY * walkSpeed * move;

        // Orient upright relative to gravity source (planet center).
        this.upX = radialX;
        this.upY = radialY;
        this.freeAngle = Math.atan2(radialX, -radialY);

        if (input.justPressed("Space")) {
          playJumpSound();
          this.initAirAngularVelocity(tangentX, tangentY, targetDist);

          this.vx += radialX * JUMP_STRENGTH;
          this.vy += radialY * JUMP_STRENGTH;
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
        const fromPlanet = normalize(fromPlanetX, fromPlanetY);
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
    this.rotation = this.freeAngle;

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
    }
  }

  override onSpawn = (): void => {
    this.modifiers.push(new StunModifier(this));
  };

  override onCollide = (other: EnginePart, nx: number, ny: number, impactSpeed: number): void => {
    if (this.onGround && !other.anchored) {
      this.groundedOn = null;
      this.activePart = undefined;
      this.mode = "air";
    }

    for (const m of this.modifiers) {
      m.onCollide(other, nx, ny, impactSpeed);
    }
  };

  /** Set angular velocity for the air-steering code based on current tangential speed. */
  private initAirAngularVelocity(tangentX: number, tangentY: number, radius: number): void {
    const walkSpeed = 2.4;
    const vt = dot(this.vx, this.vy, tangentX, tangentY);
    this.jumpAngularVelocity = vt / radius;
    this.jumpAngularVelocityMax = Math.max(Math.abs(this.jumpAngularVelocity), walkSpeed / radius);
  }

  protected override isOffScreen(): boolean {
    return false; // player renders at screen center, always visible
  }

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
