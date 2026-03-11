import { StunModifier } from "../modifiers/StunModifier";
import {
  angleToUpVector,
  clamp,
  clampVelocity,
  dot,
  length,
  normalize,
  surfaceRadiusAt,
} from "../utils";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";

const JUMP_STRENGTH = 7.8;
const JETPACK_FORCE = 0.35;
const JETPACK_DRAIN = 0; // 0.0125;
const AIR_ROTATE_SPEED = 0.01;

export class Player extends Part {
  readonly layer = RenderLayer.PLAYER;

  override radius = 12;
  onGround = false;
  currentPlanet!: Planet;
  activePlanet: Planet | undefined = undefined;
  mode: "grounded" | "air" = "grounded";
  freeAngle = 0;
  jetpackArmed = false;
  jetpackActive = false;
  hasUsedJetpackThisAirborne = false;
  fuel = 1;
  maxFuel = 1;
  jumpAngularVelocity = 0;
  jumpAngularVelocityMax = 0;

  override onSpawn(): void {
    this.modifiers.push(new StunModifier(this));
  }

  reset(): void {
    const p = this.world.planets[0];
    this.x = p ? p.x : 0;
    this.y = p ? p.y - surfaceRadiusAt(p, -Math.PI / 2) - this.radius : 0;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.currentPlanet = p;
    this.activePlanet = p;
    this.mode = "grounded";
    this.mass = 80;
    this.upX = 0;
    this.upY = -1;
    this.freeAngle = 0;
    this.jetpackArmed = false;
    this.jetpackActive = false;
    this.hasUsedJetpackThisAirborne = false;
    this.maxFuel = 1.0;
    this.fuel = this.maxFuel;
  }

  override applyInputs(): void {
    const input = this.world.input;
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

      const planet = this.currentPlanet;
      this.activePlanet = planet;
      this.mode = "grounded";

      const toCenterX = planet.x - this.x;
      const toCenterY = planet.y - this.y;
      const down = normalize(toCenterX, toCenterY);
      const up = { x: -down.x, y: -down.y };
      const tangent = { x: down.y, y: -down.x };

      const playerAngle = Math.atan2(this.y - planet.y, this.x - planet.x);
      const surfR = surfaceRadiusAt(planet, playerAngle);
      const targetDist = surfR + this.radius;

      this.x = planet.x - down.x * targetDist;
      this.y = planet.y - down.y * targetDist;

      const walkSpeed = 2.4;
      this.vx = tangent.x * walkSpeed * move;
      this.vy = tangent.y * walkSpeed * move;

      this.upX = up.x;
      this.upY = up.y;
      this.freeAngle = Math.atan2(this.upX, -this.upY);

      if (input.justPressed("Space")) {
        const vt = dot(this.vx, this.vy, tangent.x, tangent.y);
        this.jumpAngularVelocity = vt / targetDist;
        this.jumpAngularVelocityMax = Math.max(
          Math.abs(this.jumpAngularVelocity),
          walkSpeed / targetDist,
        );

        this.vx += up.x * JUMP_STRENGTH;
        this.vy += up.y * JUMP_STRENGTH;
        this.onGround = false;
        this.mode = "air";
        this.jetpackArmed = false;
        this.hasUsedJetpackThisAirborne = false;
      }
    } else {
      this.jetpackActive = false;
      this.mode = "air";

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
  }

  update(): void {
    if (this.onGround) {
      this.x += this.vx;
      this.y += this.vy;
    } else {
      const blendedG = this.world.getBlendedGravity(this.x, this.y);

      this.vx += blendedG.gx;
      this.vy += blendedG.gy;

      const capped = clampVelocity(this.vx, this.vy, 9);
      this.vx = capped.vx;
      this.vy = capped.vy;

      this.x += this.vx;
      this.y += this.vy;

      const landingPlanet = this.world.nearestSurfacePlanet(this.x, this.y);

      if (landingPlanet) {
        const ldx = landingPlanet.x - this.x;
        const ldy = landingPlanet.y - this.y;
        const ldown = normalize(ldx, ldy);

        const landingAngle = Math.atan2(this.y - landingPlanet.y, this.x - landingPlanet.x);
        const surfRAfter = surfaceRadiusAt(landingPlanet, landingAngle);
        const distAfter = length(this.x - landingPlanet.x, this.y - landingPlanet.y);
        const targetDistAfter = surfRAfter + this.radius;
        const radialSpeedAfter = dot(this.vx, this.vy, ldown.x, ldown.y);

        if (distAfter < targetDistAfter && radialSpeedAfter > 0) {
          this.x = landingPlanet.x - ldown.x * targetDistAfter;
          this.y = landingPlanet.y - ldown.y * targetDistAfter;

          const tangentAfter = { x: ldown.y, y: -ldown.x };
          const tangentSpeedAfter = dot(this.vx, this.vy, tangentAfter.x, tangentAfter.y);

          this.vx = tangentAfter.x * tangentSpeedAfter;
          this.vy = tangentAfter.y * tangentSpeedAfter;

          const capped2 = clampVelocity(this.vx, this.vy, 7);
          this.vx = capped2.vx;
          this.vy = capped2.vy;

          this.onGround = true;
          this.currentPlanet = landingPlanet;
          this.activePlanet = landingPlanet;
          this.mode = "grounded";

          const lup = { x: -ldown.x, y: -ldown.y };
          this.upX = lup.x;
          this.upY = lup.y;
          this.freeAngle = Math.atan2(this.upX, -this.upY);

          this.jetpackArmed = false;
          this.jetpackActive = false;
          this.hasUsedJetpackThisAirborne = false;
        }
      }
    }
  }

  override onCollide(other: Part, nx: number, ny: number, impactSpeed: number): void {
    if (this.onGround) {
      this.onGround = false;
      this.mode = "air";
    }
    super.onCollide(other, nx, ny, impactSpeed);
  }

  render(ctx: CanvasRenderingContext2D): void {
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
    this.roundRect(ctx, -8, -12, 16, 24, 6);
    ctx.fill();

    ctx.fillStyle = "#74d8ff";
    this.roundRect(ctx, -6, -8, 12, 6, 3);
    ctx.fill();

    ctx.fillStyle = "#d9def8";
    this.roundRect(ctx, 6, -6, 4, 10, 2);
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

    this.renderModifiers(ctx);

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }
}
