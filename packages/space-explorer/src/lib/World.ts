import { Star } from "../types";
import { Camera } from "./Camera";
import { Input } from "./Input";
import { Asteroid } from "./parts/Asteroid";
import { Part, RenderLayer } from "./parts/Part";
import { Planet, PlanetConfig } from "./parts/Planet";
import { Player } from "./parts/Player";
import { Satellite } from "./parts/Satellite";
import { gravityVectorForPlanet, roundRect, surfaceRadiusAt } from "./utils";

const MAX_NEAREST_PLANETS = 10;
const MIN_CONTRIBUTION = 0.02;
const MAX_ASTEROIDS = 3;

export class World {
  parts: Part[] = [];
  input: Input;
  camera: Camera;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

  private statusEl: HTMLElement;
  private fuelEl: HTMLElement;
  private rafId = 0;
  private asteroidSpawnTimer = 0;
  private starfield: Star[];
  private boundTick: () => void;
  private handleResize: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    statusEl: HTMLElement,
    fuelEl: HTMLElement,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.statusEl = statusEl;
    this.fuelEl = fuelEl;

    this.input = new Input(() => this.reset());
    this.camera = new Camera();
    this.starfield = generateStarfield();

    this.handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(container.clientWidth * dpr);
      canvas.height = Math.floor(container.clientHeight * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", this.handleResize);
    this.handleResize();

    this.boundTick = this.tick.bind(this);

    // Add planets
    for (const cfg of PLANET_CONFIGS) {
      this.add(new Planet(cfg));
    }

    // Add satellites
    for (const planet of this.planets) {
      for (const sat of createSatellites(planet)) {
        this.add(sat);
      }
    }

    // Add player
    this.add(new Player());
  }

  add(part: Part): void {
    part.world = this;
    this.parts.push(part);
    part.onSpawn();
  }

  remove(part: Part): void {
    part.onDestroy();
    const idx = this.parts.indexOf(part);
    if (idx !== -1) this.parts.splice(idx, 1);
  }

  get planets(): Planet[] {
    return this.parts.filter((p): p is Planet => p instanceof Planet);
  }

  get player(): Player {
    return this.parts.find((p): p is Player => p instanceof Player)!;
  }

  getBlendedGravity(px: number, py: number) {
    const influences = this.planets
      .map((planet) => {
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
        (best, g) => (!best || g.strength > best.strength ? g : best),
        null as (typeof influences)[0] | null,
      ),
      influences,
    };
  }

  nearestSurfacePlanet(px: number, py: number): Planet {
    let best = this.planets[0];
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
  }

  reset(): void {
    this.player.reset();
    this.camera.angle = 0;
  }

  start(): void {
    this.reset();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    this.input.destroy();
  }

  tick(): void {
    for (const part of [...this.parts]) {
      part.update();
      part.updateModifiers();
    }
    this.tickAsteroidSpawner();
    this.camera.update(this.player);
    this.input.endFrame();
    this.render();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private tickAsteroidSpawner(): void {
    const asteroidCount = this.parts.filter((p) => p instanceof Asteroid).length;
    this.asteroidSpawnTimer--;
    if (this.asteroidSpawnTimer <= 0 && asteroidCount < MAX_ASTEROIDS) {
      this.spawnAsteroid();
      this.asteroidSpawnTimer = 300 + Math.floor(Math.random() * 600);
    }
  }

  private spawnAsteroid(): void {
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

    const ast = new Asteroid(radius, vertexOffsets);
    ast.x = spawnX;
    ast.y = spawnY;
    ast.vx = Math.cos(aimAngle) * speed;
    ast.vy = Math.sin(aimAngle) * speed;
    this.add(ast);
  }

  render(): void {
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

    const worldParts = this.parts
      .filter((p) => p.layer === RenderLayer.WORLD)
      .sort((a, b) => a.zIndex - b.zIndex);
    for (const part of worldParts) part.render(ctx);

    ctx.restore();

    // Player layer (screen space)
    player.render(ctx);

    // HUD layer
    this.drawPlanetIndicator();
    this.drawMinimap();
    this.drawStatus();
  }

  private drawBackground(): void {
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
      )
        continue;

      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private drawPlanetIndicator(): void {
    const player = this.player;
    if (!player.hasUsedJetpackThisAirborne) return;

    const ctx = this.ctx;
    const planet = player.currentPlanet;
    const cx = this.canvas.clientWidth / 2;
    const cy = this.canvas.clientHeight / 2;

    const worldDist = Math.hypot(planet.x - player.x, planet.y - player.y);
    const fadeStart = Math.hypot(cx, cy);
    const fadeEnd = fadeStart * 2;
    if (worldDist < fadeStart) return;
    const opacity = Math.min(1, (worldDist - fadeStart) / (fadeEnd - fadeStart));

    const sp = this.camera.worldToScreen(planet.x, planet.y, player, this.canvas);
    const dx = sp.x - cx;
    const dy = sp.y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;

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
  }

  private drawMinimap(): void {
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
  }

  private drawStatus(): void {
    const player = this.player;
    let label = player.mode;
    if (player.mode === "grounded" || player.mode === "bound") {
      label += player.activePlanet ? ` • ${player.activePlanet.name}` : "";
    } else if (player.mode === "air") {
      label += " • blended";
    }

    if (this.statusEl) {
      this.statusEl.textContent = label;
    }
    if (this.fuelEl) {
      this.fuelEl.textContent = `jetpack fuel: ${Math.round((player.fuel / player.maxFuel) * 100)}%`;
    }
  }
}

// ─── Data generation ──────────────────────────────────────────────────────────

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

function createSatellites(planet: Planet): Satellite[] {
  const sats: Satellite[] = [];
  const satColors = [
    { r: 180, g: 185, b: 200 },
    { r: 200, g: 190, b: 175 },
    { r: 165, g: 200, b: 180 },
  ];

  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const orbitalRadius = planet.radius * (1.6 + Math.random() * 0.6);
    const orbitalPeriod = 600 + (orbitalRadius / planet.radius - 1.6) * 1500;
    const angle = Math.random() * Math.PI * 2;
    const color = satColors[Math.floor(Math.random() * satColors.length)];
    const tintedColor = {
      r: Math.round(color.r * 0.8 + planet.color.r * 0.2),
      g: Math.round(color.g * 0.8 + planet.color.g * 0.2),
      b: Math.round(color.b * 0.8 + planet.color.b * 0.2),
    };
    const radius = 20 + Math.random() * 20;
    const mass = 200 + Math.random() * 300;
    sats.push(
      new Satellite(planet, orbitalRadius, orbitalPeriod, angle, radius, mass, tintedColor),
    );
  }
  return sats;
}

const PLANET_CONFIGS: PlanetConfig[] = [
  {
    name: "Azure",
    x: 0,
    y: 0,
    radius: 750,
    gravity: 0.32,
    color: { r: 85, g: 125, b: 255 },
    ringColor: { r: 85, g: 125, b: 255 },
    deco: [
      { angle: 0.4, size: 14, color: "#93b0ff" },
      { angle: 1.6, size: 12, color: "#93b0ff" },
      { angle: 4.8, size: 13, color: "#93b0ff" },
    ],
    terrain: [
      { angle: 0.0, amplitude: 18, width: 0.9 },
      { angle: 1.8, amplitude: 22, width: 0.7 },
      { angle: 3.2, amplitude: 14, width: 1.1 },
      { angle: 4.6, amplitude: 20, width: 0.8 },
      { angle: 5.5, amplitude: 12, width: 0.6 },
    ],
  },
  {
    name: "Cinder",
    x: 2700,
    y: -2600,
    radius: 550,
    gravity: 0.34,
    color: { r: 255, g: 155, b: 74 },
    ringColor: { r: 255, g: 155, b: 74 },
    deco: [
      { angle: 0.8, size: 13, color: "#ffd7b4" },
      { angle: 2.5, size: 15, color: "#ffd7b4" },
      { angle: 5.1, size: 11, color: "#ffd7b4" },
    ],
    terrain: [
      { angle: 0.3, amplitude: 38, width: 0.45 },
      { angle: 1.1, amplitude: -22, width: 0.35 },
      { angle: 2.0, amplitude: 28, width: 0.5 },
      { angle: 3.0, amplitude: -18, width: 0.3 },
      { angle: 4.1, amplitude: 42, width: 0.4 },
      { angle: 5.0, amplitude: -25, width: 0.38 },
      { angle: 5.9, amplitude: 20, width: 0.5 },
    ],
  },
  {
    name: "Verdant",
    x: 5700,
    y: 200,
    radius: 420,
    gravity: 0.2,
    color: { r: 72, g: 199, b: 142 },
    ringColor: { r: 72, g: 199, b: 142 },
    deco: [
      { angle: 1.0, size: 12, color: "#b8f3d7" },
      { angle: 3.3, size: 13, color: "#b8f3d7" },
    ],
    terrain: [
      { angle: 0.5, amplitude: 16, width: 0.55 },
      { angle: 1.3, amplitude: 12, width: 0.65 },
      { angle: 2.2, amplitude: 20, width: 0.5 },
      { angle: 3.1, amplitude: 15, width: 0.6 },
      { angle: 4.0, amplitude: 18, width: 0.55 },
      { angle: 5.1, amplitude: 10, width: 0.7 },
    ],
  },
  {
    name: "Violet",
    x: 6900,
    y: -3100,
    radius: 520,
    gravity: 0.25,
    color: { r: 192, g: 107, b: 255 },
    ringColor: { r: 192, g: 107, b: 255 },
    deco: [
      { angle: 2.0, size: 11, color: "#ead1ff" },
      { angle: 4.2, size: 10, color: "#ead1ff" },
    ],
    terrain: [
      { angle: 0.0, amplitude: 50, width: 0.3 },
      { angle: 0.9, amplitude: -12, width: 0.6 },
      { angle: 1.7, amplitude: 45, width: 0.28 },
      { angle: 2.6, amplitude: -10, width: 0.5 },
      { angle: 3.5, amplitude: 52, width: 0.32 },
      { angle: 4.5, amplitude: -14, width: 0.55 },
      { angle: 5.3, amplitude: 40, width: 0.3 },
    ],
  },
];
