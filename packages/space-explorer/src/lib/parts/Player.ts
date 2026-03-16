import {
  Part as EnginePart,
  Player as EnginePlayer,
  Part,
  type RenderingContext2D,
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

const PLAYER_WIDTH = 16;
const PLAYER_HEIGHT = 24;
const JUMP_STRENGTH = 7.8;
const JETPACK_FORCE = 0.35;
const JETPACK_DRAIN = 0.00125;
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

  override jumpStrength: number = JUMP_STRENGTH;
  override stepHeight: number = 10;
  activePart: Part | undefined = undefined;
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
    if (surface.anchored && this.platformLandingCooldown > 0) {
      return false;
    }
    return true;
  }

  /** Engine callback: fires when the player first lands on a surface. */
  override onLand(surface: EnginePart): void {
    playLandSound();
    if (surface.anchored) {
      this.activePart = surface;
    } else {
      this.activePart = undefined;
    }
    this.jetpackArmed = false;
    this.jetpackActive = false;
    this.hasUsedJetpackThisAirborne = false;
    this.mode = "grounded";
  }

  /** Engine callback: fires when the player steps up onto an adjacent surface. */
  override onStepUp(surface: EnginePart): void {
    if (surface.anchored) {
      this.activePart = surface;
    }
  }

  /** Engine callback: fires when the player leaves the ground. */
  override onLeaveGround(): void {
    const wasOnPart = this.activePart !== undefined;
    this.activePart = undefined;
    this.mode = "air";

    const planet = this.world.nearestSurfacePlanet(this.x, this.y);
    if (planet) {
      const dx = this.x - planet.x;
      const dy = this.y - planet.y;
      const r = Math.hypot(dx, dy) || 0.001;
      const rad = normalize(dx, dy);

      if (wasOnPart) {
        // Strip tangential velocity so collision nudges at anchored part edges
        // don't cause backward drift. The player falls purely radially.
        const radialV = dot(this.vx, this.vy, rad.x, rad.y);
        this.vx = rad.x * radialV;
        this.vy = rad.y * radialV;
      }

      this.initAirAngularVelocity(-rad.y, rad.x, r);
    }
  }

  reset(): void {
    const p = this.world.planets[0];
    this.x = p ? p.x : 0;
    this.y = p ? p.y - surfaceRadiusAt(p, -Math.PI / 2) - PLAYER_HEIGHT / 2 : 0;
    this.vx = 0;
    this.vy = 0;
    this.groundedOn = null;
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

    this.movementIntent = move;

    if (input.justReleased("Space") && !this.onGround) {
      this.jetpackArmed = true;
    }

    if (this.onGround) {
      this.jetpackArmed = false;
      this.jetpackActive = false;
      this.hasUsedJetpackThisAirborne = false;
      this.mode = "grounded";

      const groundPart = this.activePart ?? this.groundedOn;

      if (groundPart) {
        const grounding = groundPart.getGrounding(
          this.x,
          this.y,
          PLAYER_WIDTH / 2,
          PLAYER_HEIGHT / 2,
          this.upX,
          this.upY,
          this.gradability,
        );

        if (!grounding) {
          // Walked off the edge → transition to air.
          this.groundedOn = null;
          this.activePart = undefined;
          this.mode = "air";
          this.platformLandingCooldown = groundPart.landingCooldown;

          const planet = this.world.nearestSurfacePlanet(this.x, this.y);
          if (planet) {
            const rad = normalize(this.x - planet.x, this.y - planet.y);
            const r = Math.hypot(this.x - planet.x, this.y - planet.y);
            this.initAirAngularVelocity(-rad.y, rad.x, r);
          }
        } else {
          // Snap to surface.
          this.x = grounding.x;
          this.y = grounding.y;

          // Walk along tangent, aligned with engine surfaceTangent.
          const tangentDot =
            grounding.tx * this.surfaceTangent.x + grounding.ty * this.surfaceTangent.y;
          const walkDir = tangentDot >= 0 ? 1 : -1;

          const walkSpeed = 2.4;
          this.vx = grounding.tx * walkSpeed * move * walkDir;
          this.vy = grounding.ty * walkSpeed * move * walkDir;

          // Orient upright relative to nearest gravity source.
          const planet = this.world.nearestSurfacePlanet(this.x, this.y);
          if (planet) {
            const rad = normalize(this.x - planet.x, this.y - planet.y);
            this.upX = rad.x;
            this.upY = rad.y;
            this.freeAngle = Math.atan2(rad.x, -rad.y);
          }

          if (input.justPressed("Space")) {
            playJumpSound();
            // Use planet-relative tangent for air angular velocity.
            const airTangentX = -this.upY;
            const airTangentY = this.upX;
            const r = planet ? Math.hypot(this.x - planet.x, this.y - planet.y) : PLAYER_HEIGHT;
            this.initAirAngularVelocity(airTangentX, airTangentY, r);
            this.vx += this.upX * JUMP_STRENGTH;
            this.vy += this.upY * JUMP_STRENGTH;
            this.groundedOn = null;
            this.activePart = undefined;
            this.mode = "air";
            this.jetpackArmed = false;
            this.hasUsedJetpackThisAirborne = false;
            this.platformLandingCooldown = groundPart.landingCooldown;
          }
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
      } else if (blendedG.strongest) {
        const strongest = blendedG.strongest;
        const fromPlanetX = this.x - strongest.planet.x;
        const fromPlanetY = this.y - strongest.planet.y;
        const r = Math.hypot(fromPlanetX, fromPlanetY);
        const fromPlanet = normalize(fromPlanetX, fromPlanetY);
        this.freeAngle = Math.atan2(fromPlanet.x, -fromPlanet.y);

        const totalStrength = blendedG.influences.reduce((sum, g) => sum + g.strength, 0);
        const dominance = totalStrength > 0 ? strongest.strength / totalStrength : 0;

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

  doRender(ctx: RenderingContext2D): void {
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
