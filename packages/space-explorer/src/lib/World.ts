import { type Part as EnginePart, World as EngineWorld } from "@matthuggins/platforming-engine";
import { gravityStrengthForPlanet } from "../helpers/gravityStrengthForPlanets";
import { gravityVectorForPlanet } from "../helpers/gravityVectorForPlanet";
import { roundRect } from "../helpers/roundRect";
import { surfaceRadiusAt } from "../helpers/surfaceRadiusAt";
import { Star } from "../types";
import { Camera } from "./Camera";
import { Input } from "./Input";
import { Asteroid } from "./parts/Asteroid";
import { Part, RenderLayer } from "./parts/Part";
import { Planet } from "./parts/Planet";
import { Platform } from "./parts/Platform";
import { Player } from "./parts/Player";
import { updateAudioListener } from "./sounds";

const MAX_NEAREST_PLANETS = 10;
const MIN_CONTRIBUTION = 0.02;
const MAX_ASTEROIDS = 3;

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

  private status: HTMLElement;
  private fuel: HTMLElement;
  private asteroidSpawnTimer = 0;
  private starfield: Star[];

  constructor({
    canvas,
    container,
    status,
    fuel,
  }: {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    status: HTMLElement;
    fuel: HTMLElement;
  }) {
    const input = new Input();
    const camera = new Camera();
    super({ canvas, container, input, camera });
    input.setResetCallback(this.reset);
    camera.setWorld(this);

    this.status = status;
    this.fuel = fuel;
    this.starfield = generateStarfield();
  }

  get planets(): Planet[] {
    return this.parts.filter((p): p is Planet => p instanceof Planet);
  }

  get platforms(): Platform[] {
    return this.parts.filter((p): p is Platform => p instanceof Platform);
  }

  get player(): Player {
    return this.parts.find((p): p is Player => p instanceof Player)!;
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

    const player = this.player;
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

    // TODO: Remove this type casting; Platform not extending the local Part class makes this challenge
    const worldParts = (this.parts as Part[])
      .filter((p) => p.layer === RenderLayer.WORLD)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const part of worldParts) {
      part.render(ctx);
    }

    ctx.restore();

    // Player layer (screen space)
    player.render(ctx);

    // HUD layer
    this.drawPlanetIndicator();
    this.drawMinimap();
    this.drawStatus();
  };

  private tickAsteroidSpawner = (): void => {
    const asteroidCount = this.parts.filter((p) => p instanceof Asteroid).length;
    this.asteroidSpawnTimer--;
    if (this.asteroidSpawnTimer <= 0 && asteroidCount < MAX_ASTEROIDS) {
      this.spawnAsteroid();
      this.asteroidSpawnTimer = 300 + Math.floor(Math.random() * 600);
    }
  };

  private spawnAsteroid = (): void => {
    const player = this.player;
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = Math.hypot(this.canvas.clientWidth, this.canvas.clientHeight) / 2 + 500;
    const spawnX = player.x + Math.cos(angle) * spawnDist;
    const spawnY = player.y + Math.sin(angle) * spawnDist;

    const planets = this.planets;
    const centerX = planets.reduce((s, p) => s + p.x, 0) / planets.length;
    const centerY = planets.reduce((s, p) => s + p.y, 0) / planets.length;
    const toCenter = Math.atan2(centerY - spawnY, centerX - spawnX);
    const aimAngle = toCenter + (Math.random() - 0.5) * (Math.PI / 3);
    const speed = 6 + Math.random() * 6;
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

    for (const star of this.starfield) {
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
    const planet = player.currentPlanet;
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

  private drawStatus = (): void => {
    const player = this.player;
    let label = player.mode;
    if (player.mode === "grounded") {
      label += player.activePlanet ? ` • ${player.activePlanet.name}` : "";
    } else if (player.mode === "air") {
      label += " • blended";
    }

    if (this.status) {
      this.status.textContent = label;
    }
    if (this.fuel) {
      this.fuel.textContent = `jetpack fuel: ${Math.round((player.fuel / player.maxFuel) * 100)}%`;
    }
  };
}

function generateStarfield(count = 240): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const spread = 4200;
    return {
      x: ((i * 347) % spread) - spread / 2,
      y: ((i * 191) % spread) - spread / 2,
      r: (i % 3) + 0.8,
      a: 0.18 + (i % 5) * 0.08,
    };
  });
}
