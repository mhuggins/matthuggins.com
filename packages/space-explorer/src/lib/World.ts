import {
  Part as EnginePart,
  World as EngineWorld,
  HeightFieldPart,
} from "@matthuggins/platforming-engine";
import { gravityStrengthForPlanet } from "../helpers/gravityStrengthForPlanets";
import { gravityVectorForPlanet } from "../helpers/gravityVectorForPlanet";
import { roundRect } from "../helpers/roundRect";
import { surfaceRadiusAt } from "../helpers/surfaceRadiusAt";
import { Camera } from "./Camera";
import { Input } from "./Input";
import { Asteroid } from "./parts/Asteroid";
import { Crystal } from "./parts/Crystal";
import { Part, RenderLayer } from "./parts/Part";
import { Planet } from "./parts/Planet";
import { Platform } from "./parts/Platform";
import { Player } from "./parts/Player";
import { Starfield } from "./Starfield";
import { playCrystalPickupSound, updateAudioListener } from "./sounds";

const MAX_NEAREST_PLANETS = 10;
const MIN_CONTRIBUTION = 0.02;
const MAX_ASTEROIDS = 8;
const ASTEROID_SPAWN_RADIUS = 8500;

interface Influence {
  planet: Planet;
  distance: number;
  dirX: number;
  dirY: number;
  gx: number;
  gy: number;
  strength: number;
}

export class World extends EngineWorld<Input, Camera> {
  // Narrow inherited types to concrete space-explorer classes.
  protected declare input: Input;
  public declare readonly camera: Camera;

  private _player: Player | null = null;
  private asteroidSpawnTimer = 0;
  private starfield: Starfield;
  private _worldSortDirty = true;
  private _sortedWorldParts: (Part | Planet)[] = [];

  constructor({
    canvas,
    container,
  }: {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
  }) {
    const input = new Input();
    const camera = new Camera();
    super({ canvas, container, input, camera });

    input.setResetCallback(this.reset);
    camera.setWorld(this);

    this.starfield = new Starfield(0, 0);
  }

  protected override classifyPart(part: EnginePart): void {
    super.classifyPart(part);
    if (part instanceof Player) {
      this._player = part;
    } else {
      this.pushToMap(part.constructor.name, part);
    }
    this._worldSortDirty = true;
  }

  protected override unclassifyPart(part: EnginePart): void {
    super.unclassifyPart(part);
    if (part instanceof Player) {
      this._player = null;
    } else {
      this.spliceFromMap(part.constructor.name, part);
    }
    this._worldSortDirty = true;
  }

  get player(): Player {
    if (!this._player) {
      throw new Error("player is undefined");
    }
    return this._player;
  }

  get planets(): Planet[] {
    return (this._partsMap.get(Planet.name) ?? []) as Planet[];
  }

  get platforms(): Platform[] {
    return (this._partsMap.get(Platform.name) ?? []) as Platform[];
  }

  get asteroids(): Asteroid[] {
    return (this._partsMap.get(Asteroid.name) ?? []) as Asteroid[];
  }

  get crystals(): Crystal[] {
    return (this._partsMap.get(Crystal.name) ?? []) as Crystal[];
  }

  override reset = (): void => {
    this.player.reset();
    this.camera.angle = 0;
  };

  getBlendedGravity = (px: number, py: number) => {
    const influences = this.planets
      .map((planet): Influence => {
        const dx = planet.x - px;
        const dy = planet.y - py;
        const distance = Math.hypot(dx, dy);
        const g = gravityVectorForPlanet(planet, px, py);
        return { ...g, planet, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_NEAREST_PLANETS)
      .filter((g) => g.strength >= MIN_CONTRIBUTION);

    if (influences.length === 0) {
      return { gx: 0, gy: 0, strongest: null, influences: [] };
    }

    let gx = 0;
    let gy = 0;
    for (const g of influences) {
      gx += g.gx;
      gy += g.gy;
    }

    return {
      gx,
      gy,
      strongest: influences.reduce(
        (best: Influence | null, g) => (!best || g.strength > best.strength ? g : best),
        null,
      ),
      influences,
    };
  };

  nearestSurfacePlanet = (px: number, py: number): Planet | undefined => {
    let best = this.planets[0];
    if (!best) {
      return undefined;
    }
    let bestMetric = Infinity;
    for (const planet of this.planets) {
      const angle = Math.atan2(py - planet.y, px - planet.x);
      const distToSurface =
        Math.hypot(planet.x - px, planet.y - py) - surfaceRadiusAt(planet, angle);
      if (distToSurface < bestMetric) {
        bestMetric = distToSurface;
        best = planet;
      }
    }
    return best;
  };

  protected override afterPhysics(): void {
    super.afterPhysics();
    this.tickAsteroidSpawner();
    this.tickCrystalPickup();

    const player = this.player;
    this.viewX = player.x;
    this.viewY = player.y;
    this.starfield.update(player.x, player.y);
    updateAudioListener(player.x, player.y);
  }

  protected override gravityForce(source: EnginePart, target: EnginePart, _dist: number): number {
    if (source instanceof Planet) {
      return gravityStrengthForPlanet(source, target.x, target.y);
    }
    return source.gravity;
  }

  override render = (): void => {
    this.drawBackground();

    const player = this.player;
    const ctx = this.ctx;
    const cx = this.canvas.clientWidth / 2;
    const cy = this.canvas.clientHeight / 2;

    // Camera transform — world layer
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.camera.angle);
    ctx.translate(-player.x, -player.y);

    if (this._worldSortDirty) {
      this._sortedWorldParts = this.parts
        .filter(
          (p): p is Part | Planet =>
            (p instanceof Part || p instanceof Planet) && p.layer === RenderLayer.WORLD,
        )
        .sort((a, b) => a.zIndex - b.zIndex);
      this._worldSortDirty = false;
    }

    for (const part of this._sortedWorldParts) {
      part.render(ctx);
    }

    if (this.input.debugCollisions) {
      this.drawDebugCollisions(ctx);
    }

    ctx.restore();

    // Player layer (screen space)
    player.render(ctx);

    // HUD layer
    this.drawPlanetIndicator();
    this.drawMinimap();
    this.drawFuelGauge();
  };

  private drawDebugCollisions = (ctx: CanvasRenderingContext2D): void => {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 1;

    for (const part of this.parts) {
      if (part instanceof HeightFieldPart) {
        const steps = 256;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const r = part.surfaceRadiusAt(angle);
          const px = part.x + Math.cos(angle) * r;
          const py = part.y + Math.sin(angle) * r;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.stroke();
      } else if (part.smooth) {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.boundingRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (part.polygon.length > 0) {
        const verts = part.worldVertices();
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < verts.length; i++) {
          ctx.lineTo(verts[i].x, verts[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  };

  private tickCrystalPickup = (): void => {
    const player = this.player;
    for (const crystal of this.crystals) {
      if (crystal.isNearPlayer()) {
        player.fuel = Math.min(player.maxFuel, player.fuel + crystal.fuelAmount);
        playCrystalPickupSound(undefined, { source: crystal });
        this.remove(crystal);
      }
    }
  };

  private tickAsteroidSpawner = (): void => {
    const asteroidCount = this.asteroids.length;
    this.asteroidSpawnTimer--;
    if (this.asteroidSpawnTimer <= 0 && asteroidCount < MAX_ASTEROIDS) {
      this.spawnAsteroid();
      this.asteroidSpawnTimer = 120 + Math.floor(Math.random() * 240);
    }
  };

  private spawnAsteroid = (): void => {
    const player = this.player;
    const angle = Math.random() * Math.PI * 2;
    const spawnX = player.x + Math.cos(angle) * ASTEROID_SPAWN_RADIUS;
    const spawnY = player.y + Math.sin(angle) * ASTEROID_SPAWN_RADIUS;

    // Aim inward with some spread so asteroids cross the play area.
    const toPlayer = Math.atan2(player.y - spawnY, player.x - spawnX);
    const aimAngle = toPlayer + (Math.random() - 0.5) * (Math.PI / 3);
    const speed = 2 + Math.random() * 4;
    const radius = 15 + Math.random() * 30;
    const numVertices = 7 + Math.floor(Math.random() * 3);
    const vertexOffsets = Array.from({ length: numVertices }, () => 0.75 + Math.random() * 0.5);

    const asteroid = new Asteroid(this, { radius, vertexOffsets });
    asteroid.x = spawnX;
    asteroid.y = spawnY;
    asteroid.vx = Math.cos(aimAngle) * speed;
    asteroid.vy = Math.sin(aimAngle) * speed;
    this.add(asteroid);
  };

  private drawBackground = (): void => {
    const ctx = this.ctx;
    const player = this.player;

    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    for (const star of this.starfield.stars) {
      const p = this.camera.worldToScreen(star.x, star.y, player, this.canvas);

      if (
        p.x < -10 ||
        p.x > this.canvas.clientWidth + 10 ||
        p.y < -10 ||
        p.y > this.canvas.clientHeight + 10
      ) {
        continue;
      }

      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  private drawPlanetIndicator = (): void => {
    const player = this.player;
    if (!player.hasUsedJetpackThisAirborne) {
      return;
    }

    const ctx = this.ctx;
    const planet = this.nearestSurfacePlanet(player.x, player.y);
    if (!planet) return;
    const cx = this.canvas.clientWidth / 2;
    const cy = this.canvas.clientHeight / 2;

    const worldDist = Math.hypot(planet.x - player.x, planet.y - player.y);
    const fadeStart = Math.hypot(cx, cy);
    const fadeEnd = fadeStart * 2;
    if (worldDist < fadeStart) {
      return;
    }
    const opacity = Math.min(1, (worldDist - fadeStart) / (fadeEnd - fadeStart));

    const sp = this.camera.worldToScreen(planet.x, planet.y, player, this.canvas);
    const dx = sp.x - cx;
    const dy = sp.y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) {
      return;
    }

    const ndx = dx / len;
    const ndy = dy / len;

    const orbitRadius = 72;
    const ex = cx + ndx * orbitRadius;
    const ey = cy + ndy * orbitRadius;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(ex, ey);
    ctx.rotate(Math.atan2(ndy, ndx));

    const caretSize = 8;
    const caretSpacing = 10;
    const numCarets = 3;
    const activeIndex = numCarets - 1 - Math.floor((performance.now() % 600) / 200);

    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let i = 0; i < numCarets; i++) {
      ctx.strokeStyle =
        i === activeIndex ? "rgba(255, 160, 40, 0.95)" : "rgba(255, 230, 100, 0.85)";
      const tipX = -i * caretSpacing;
      ctx.beginPath();
      ctx.moveTo(tipX - caretSize, -caretSize);
      ctx.lineTo(tipX, 0);
      ctx.lineTo(tipX - caretSize, caretSize);
      ctx.stroke();
    }

    ctx.restore();
  };

  private drawMinimap = (): void => {
    const ctx = this.ctx;
    const player = this.player;
    const mapW = 160;
    const mapH = 100;
    const margin = 12;
    const pad = 8;

    const originX = margin;
    const originY = this.canvas.clientHeight - margin - mapH;
    const mapCX = originX + mapW / 2;
    const mapCY = originY + mapH / 2;

    const viewRadius = 8500;
    const scale = Math.min(mapW / 2 - pad, mapH / 2 - pad) / viewRadius;

    const worldToMinimap = (wx: number, wy: number) => {
      const dx = wx - player.x;
      const dy = wy - player.y;
      const c = Math.cos(-this.camera.angle);
      const s = Math.sin(-this.camera.angle);
      return {
        x: mapCX + (dx * c - dy * s) * scale,
        y: mapCY + (dx * s + dy * c) * scale,
      };
    };

    ctx.save();
    roundRect(ctx, originX, originY, mapW, mapH, 8);
    ctx.clip();

    ctx.fillStyle = "rgba(10, 16, 32, 0.88)";
    ctx.fillRect(originX, originY, mapW, mapH);

    for (const p of this.planets) {
      const mp = worldToMinimap(p.x, p.y);
      const r = Math.max(3, p.radius * scale);

      const g = ctx.createRadialGradient(mp.x - r * 0.35, mp.y - r * 0.4, r * 0.2, mp.x, mp.y, r);
      g.addColorStop(0, "rgba(255,255,255,0.20)");
      g.addColorStop(0.18, `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`);
      g.addColorStop(1, "#111111");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    for (const a of this.asteroids) {
      const mp = worldToMinimap(a.x, a.y);
      ctx.fillRect(mp.x, mp.y, 1, 1);
    }

    ctx.fillStyle = "rgba(255, 80, 180, 0.8)";
    for (const c of this.crystals) {
      const mp = worldToMinimap(c.x, c.y);
      ctx.fillRect(mp.x - 0.5, mp.y - 0.5, 2, 2);
    }

    ctx.fillStyle = "#f7f8ff";
    ctx.beginPath();
    ctx.arc(mapCX, mapCY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    roundRect(ctx, originX, originY, mapW, mapH, 8);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  private drawFuelGauge = (): void => {
    const ctx = this.ctx;
    const player = this.player;
    const fuelPct = player.fuel / player.maxFuel;

    // Position: top-right area of the canvas.
    const gaugeX = this.canvas.clientWidth - 52;
    const gaugeY = 52;
    const outerRadius = 32;
    const innerRadius = 24;
    const lineWidth = outerRadius - innerRadius;

    // Arc spans 270° (from 135° to 405°, i.e. bottom-left to bottom-right going clockwise).
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const fuelAngle = startAngle + (endAngle - startAngle) * fuelPct;

    ctx.save();

    // Background track.
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, outerRadius - lineWidth / 2, startAngle, endAngle);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Fuel fill — color shifts from green to orange to red.
    let r: number;
    let g: number;
    let b: number;
    if (fuelPct > 0.5) {
      // Green to orange.
      const t = (fuelPct - 0.5) * 2;
      r = Math.round(255 * (1 - t) + 80 * t);
      g = Math.round(180 * (1 - t) + 220 * t);
      b = Math.round(60 * (1 - t) + 120 * t);
    } else {
      // Orange to red.
      const t = fuelPct * 2;
      r = 255;
      g = Math.round(180 * t + 50 * (1 - t));
      b = Math.round(60 * t + 50 * (1 - t));
    }

    if (fuelPct > 0.005) {
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, outerRadius - lineWidth / 2, startAngle, fuelAngle);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      // Glow on the fuel arc.
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, outerRadius - lineWidth / 2, startAngle, fuelAngle);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
      ctx.lineWidth = lineWidth + 6;
      ctx.stroke();
    }

    // Percentage text in the center.
    const pctText = `${Math.round(fuelPct * 100)}`;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pctText, gaugeX, gaugeY - 2);

    // "FUEL" label below the arc.
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "8px monospace";
    ctx.fillText("FUEL", gaugeX, gaugeY + 12);

    ctx.restore();
  };
}
