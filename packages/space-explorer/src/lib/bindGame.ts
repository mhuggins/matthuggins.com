import { Asteroid, Planet, Player, Satellite, Star } from "../types";

const MAX_NEAREST_PLANETS = 10;
const MIN_CONTRIBUTION = 0.02;

const JUMP_STRENGTH = 7.8;
const JETPACK_FORCE = 0.35;
const JETPACK_DRAIN = 0; // 0.0125;
const AIR_ROTATE_SPEED = 0.01;

// Assumed gravity range across all planets — used to normalize visual intensity.
const GRAVITY_MIN = 0.15;
const GRAVITY_MAX = 0.4;

// Accumulated band opacity range — weakest planet sits at MIN, strongest at MAX.
const GRAVITY_BAND_OPACITY_MIN = 0.08;
const GRAVITY_BAND_OPACITY_MAX = 0.2;

// How far gravity extends above a planet's surface.
// Influence altitude = radius * GRAVITY_RADIUS_MULTIPLIER + GRAVITY_RADIUS_BASE
// The band visual radius adds one extra planet.radius on top (planet center → surface → atmosphere).
const GRAVITY_RADIUS_MULTIPLIER = 2.0;
const GRAVITY_RADIUS_BASE = 240;

export function bindGame({
  container,
  canvas,
  status,
  fuel,
}: {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  status: HTMLElement;
  fuel: HTMLElement;
}) {
  const ctx = canvas.getContext("2d")!;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(container.clientWidth * dpr);
    canvas.height = Math.floor(container.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", resize);
  resize();

  const keys = new Set<string>();
  let prevKeys = new Set<string>();

  function handleKeydown(e: KeyboardEvent) {
    keys.add(e.code);
    if (e.code === "Space") e.preventDefault();
    if (e.code === "KeyR") resetPlayer();
  }

  function handleKeyup(e: KeyboardEvent) {
    keys.delete(e.code);
  }

  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("keyup", handleKeyup);

  function isDown(code: string) {
    return keys.has(code);
  }

  function justPressed(code: string) {
    return keys.has(code) && !prevKeys.has(code);
  }

  function justReleased(code: string) {
    return !keys.has(code) && prevKeys.has(code);
  }

  const planets = generatePlanets();
  const starfield = generateStarfield();
  const satellites = generateSatellites(planets);
  const asteroids: Asteroid[] = [];
  let asteroidSpawnTimer = 0;
  const MAX_ASTEROIDS = 3;

  function getBlendedGravity(px: number, py: number) {
    const influences = planets
      .map((planet) => {
        const dx = planet.x - px;
        const dy = planet.y - py;
        const distance = Math.hypot(dx, dy);
        const g = gravityVectorForPlanet(planet, px, py);

        return {
          ...g,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_NEAREST_PLANETS)
      .filter((g) => g.strength >= MIN_CONTRIBUTION);

    if (influences.length === 0) {
      return {
        gx: 0,
        gy: 0,
        strongest: null,
        influences: [],
      };
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

  function nearestSurfacePlanet(px: number, py: number) {
    let best = planets[0];
    let bestMetric = Infinity;
    for (const planet of planets) {
      const dx = planet.x - px;
      const dy = planet.y - py;
      const angle = Math.atan2(py - planet.y, px - planet.x);
      const distToSurface = Math.hypot(dx, dy) - surfaceRadiusAt(planet, angle);
      if (distToSurface < bestMetric) {
        bestMetric = distToSurface;
        best = planet;
      }
    }
    return best;
  }

  const player: Player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    mass: 80,
    onGround: false,
    currentPlanet: planets[0],
    activePlanet: planets[0],
    mode: "grounded", // grounded | bound | free
    upX: 0,
    upY: -1,
    freeAngle: 0,
    jetpackArmed: false,
    jetpackActive: false,
    hasUsedJetpackThisAirborne: false,
    fuel: 1,
    maxFuel: 1,
    jumpAngularVelocity: 0, // rad/frame, preserved during arc to match surface travel distance
    jumpAngularVelocityMax: 0, // |ω| at jump time — caps aerial steering
  };

  const camera = {
    angle: 0,
  };

  function resetPlayer() {
    const p = planets[0];
    player.x = p.x;
    player.y = p.y - surfaceRadiusAt(p, -Math.PI / 2) - player.radius;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.currentPlanet = p;
    player.activePlanet = p;
    player.mode = "grounded";
    player.upX = 0;
    player.upY = -1;
    player.freeAngle = 0;
    player.jetpackArmed = false;
    player.jetpackActive = false;
    player.hasUsedJetpackThisAirborne = false;
    player.maxFuel = 1.0; // normalized
    player.fuel = player.maxFuel;
    camera.angle = 0;
  }

  function updatePlayer() {
    const move =
      (isDown("KeyD") || isDown("ArrowRight") ? 1 : 0) -
      (isDown("KeyA") || isDown("ArrowLeft") ? 1 : 0);

    if (justReleased("Space") && !player.onGround) {
      player.jetpackArmed = true;
    }

    if (player.onGround) {
      player.jetpackArmed = false;
      player.jetpackActive = false;
      player.hasUsedJetpackThisAirborne = false;
      player.fuel = player.maxFuel;

      const planet = player.currentPlanet;
      player.activePlanet = planet;
      player.mode = "grounded";

      const toCenterX = planet.x - player.x;
      const toCenterY = planet.y - player.y;
      const down = normalize(toCenterX, toCenterY);
      const up = { x: -down.x, y: -down.y };
      const tangent = { x: down.y, y: -down.x };

      const playerAngle = Math.atan2(player.y - planet.y, player.x - planet.x);
      const surfR = surfaceRadiusAt(planet, playerAngle);
      const targetDist = surfR + player.radius;

      player.x = planet.x - down.x * targetDist;
      player.y = planet.y - down.y * targetDist;

      const walkSpeed = 2.4;
      player.vx = tangent.x * walkSpeed * move;
      player.vy = tangent.y * walkSpeed * move;

      player.upX = up.x;
      player.upY = up.y;
      player.freeAngle = Math.atan2(player.upX, -player.upY);

      if (justPressed("Space")) {
        // Store angular velocity so the airborne arc covers the same surface distance as walking.
        // Max is floored at full walk angular velocity so standstill jumps can still steer.
        const vt = dot(player.vx, player.vy, tangent.x, tangent.y);
        player.jumpAngularVelocity = vt / targetDist;
        player.jumpAngularVelocityMax = Math.max(
          Math.abs(player.jumpAngularVelocity),
          walkSpeed / targetDist,
        );

        player.vx += up.x * JUMP_STRENGTH;
        player.vy += up.y * JUMP_STRENGTH;
        player.onGround = false;
        player.mode = "air";
        player.jetpackArmed = false;
        player.hasUsedJetpackThisAirborne = false;
      }
    } else {
      player.jetpackActive = false;
      player.mode = "air";

      const blendedG = getBlendedGravity(player.x, player.y);

      // Gravity always applies.
      player.vx += blendedG.gx;
      player.vy += blendedG.gy;

      // Before jetpack use: orientation tracks the planet jumped from.
      // After jetpack use: player can rotate freely in air.
      if (player.hasUsedJetpackThisAirborne) {
        player.freeAngle += move * AIR_ROTATE_SPEED;
      } else {
        const fromPlanetX = player.x - player.currentPlanet.x;
        const fromPlanetY = player.y - player.currentPlanet.y;
        const r = Math.hypot(fromPlanetX, fromPlanetY);
        const fromPlanet = { x: fromPlanetX / r, y: fromPlanetY / r };
        player.freeAngle = Math.atan2(fromPlanet.x, -fromPlanet.y);

        // Scale enforcement by how dominant the jump planet is vs. other gravity sources.
        // When another planet pulls equally or more, enforcement fades to avoid unnatural lateral speed.
        const jumpInfluence = blendedG.influences.find((g) => g.planet === player.currentPlanet);
        const jumpStrength = jumpInfluence?.strength ?? 0;
        const totalStrength = blendedG.influences.reduce((sum, g) => sum + g.strength, 0);
        const dominance = totalStrength > 0 ? jumpStrength / totalStrength : 0;

        // Allow left/right input to steer in the air, capped at the launch angular speed.
        const airSteerAccel = 0.0003; // rad/frame²
        player.jumpAngularVelocity = clamp(
          player.jumpAngularVelocity + move * airSteerAccel * dominance,
          -player.jumpAngularVelocityMax,
          player.jumpAngularVelocityMax,
        );

        // Enforce the (steerable) angular velocity so arc distance matches surface travel.
        // Decompose velocity into radial + tangential, replace the tangential component
        // so ω = jumpAngularVelocity regardless of current altitude.
        // Correction fades with dominance so blended gravity fields don't over-constrain lateral speed.
        const tang = { x: -fromPlanet.y, y: fromPlanet.x };
        const currentVt = dot(player.vx, player.vy, tang.x, tang.y);
        const targetVt = player.jumpAngularVelocity * r;
        const dvt = (targetVt - currentVt) * dominance;
        player.vx += tang.x * dvt;
        player.vy += tang.y * dvt;
      }

      const facingUp = angleToUpVector(player.freeAngle);

      if (player.jetpackArmed && isDown("Space") && player.fuel > 0) {
        player.vx += facingUp.x * JETPACK_FORCE;
        player.vy += facingUp.y * JETPACK_FORCE;
        player.fuel = Math.max(0, player.fuel - JETPACK_DRAIN);
        player.jetpackActive = true;
        player.hasUsedJetpackThisAirborne = true;
      }

      const capped = clampVelocity(player.vx, player.vy, 9);
      player.vx = capped.vx;
      player.vy = capped.vy;

      player.x += player.vx;
      player.y += player.vy;

      player.upX = facingUp.x;
      player.upY = facingUp.y;

      const landingPlanet = nearestSurfacePlanet(player.x, player.y);
      const ldx = landingPlanet.x - player.x;
      const ldy = landingPlanet.y - player.y;
      const ldown = normalize(ldx, ldy);

      const landingAngle = Math.atan2(player.y - landingPlanet.y, player.x - landingPlanet.x);
      const surfRAfter = surfaceRadiusAt(landingPlanet, landingAngle);
      const distAfter = length(player.x - landingPlanet.x, player.y - landingPlanet.y);
      const targetDistAfter = surfRAfter + player.radius;
      const radialSpeedAfter = dot(player.vx, player.vy, ldown.x, ldown.y);

      if (distAfter < targetDistAfter && radialSpeedAfter > 0) {
        player.x = landingPlanet.x - ldown.x * targetDistAfter;
        player.y = landingPlanet.y - ldown.y * targetDistAfter;

        const tangentAfter = { x: ldown.y, y: -ldown.x };
        const tangentSpeedAfter = dot(player.vx, player.vy, tangentAfter.x, tangentAfter.y);

        player.vx = tangentAfter.x * tangentSpeedAfter;
        player.vy = tangentAfter.y * tangentSpeedAfter;

        const capped = clampVelocity(player.vx, player.vy, 7);
        player.vx = capped.vx;
        player.vy = capped.vy;

        player.onGround = true;
        player.currentPlanet = landingPlanet;
        player.activePlanet = landingPlanet;
        player.mode = "grounded";

        const lup = { x: -ldown.x, y: -ldown.y };
        player.upX = lup.x;
        player.upY = lup.y;
        player.freeAngle = Math.atan2(player.upX, -player.upY);

        player.jetpackArmed = false;
        player.jetpackActive = false;
        player.hasUsedJetpackThisAirborne = false;
      }
    }

    if (player.onGround) {
      player.x += player.vx;
      player.y += player.vy;
    }
  }

  function updateCamera() {
    const targetAngle = Math.atan2(player.upX, -player.upY);
    const follow = player.onGround ? 0.18 : 0.12;
    camera.angle += shortestAngleDiff(camera.angle, targetAngle) * follow;
  }

  function worldToScreen(wx: number, wy: number) {
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    const dx = wx - player.x;
    const dy = wy - player.y;

    const c = Math.cos(-camera.angle);
    const s = Math.sin(-camera.angle);

    return {
      x: cx + dx * c - dy * s,
      y: cy + dx * s + dy * c,
    };
  }

  function drawBackground() {
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (const star of starfield) {
      const p = worldToScreen(star.x, star.y);

      if (p.x < -10 || p.x > canvas.clientWidth + 10 || p.y < -10 || p.y > canvas.clientHeight + 10)
        continue;

      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);
    ctx.rotate(-camera.angle);
    ctx.translate(-player.x, -player.y);

    let bandVisibility: number;
    if (player.hasUsedJetpackThisAirborne) {
      bandVisibility = 1;
    } else {
      const minSurfaceDist = Math.min(
        ...planets.map((p) => {
          const angle = Math.atan2(player.y - p.y, player.x - p.x);
          return Math.hypot(player.x - p.x, player.y - p.y) - surfaceRadiusAt(p, angle);
        }),
      );
      bandVisibility = clamp(minSurfaceDist / 240, 0, 1);
    }

    for (const planet of planets) drawPlanet(planet, bandVisibility);

    ctx.restore();
  }

  function drawPlanet(planet: (typeof planets)[0], bandVisibility: number) {
    // Animated gravity bands — clipped to outside the terrain polygon using evenodd.
    // Fade out when player is near any surface; fade in as they move into open space.
    const influenceRadius = planet.radius * (1 + GRAVITY_RADIUS_MULTIPLIER) + GRAVITY_RADIUS_BASE;
    const numBands = Math.max(3, Math.round(planet.gravity * 32));
    const period = 1500 / planet.gravity; // higher gravity = faster bands
    const now = performance.now();
    const { r: cr, g: cg, b: cb } = planet.ringColor;
    const gravityNormalized = (planet.gravity - GRAVITY_MIN) / (GRAVITY_MAX - GRAVITY_MIN);
    const maxOpacity =
      GRAVITY_BAND_OPACITY_MIN +
      gravityNormalized * (GRAVITY_BAND_OPACITY_MAX - GRAVITY_BAND_OPACITY_MIN);
    const bandAlpha = (maxOpacity / numBands) * bandVisibility;
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      planet.x - influenceRadius - 10,
      planet.y - influenceRadius - 10,
      (influenceRadius + 10) * 2,
      (influenceRadius + 10) * 2,
    );
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      const r = surfaceRadiusAt(planet, a);
      const px = planet.x + Math.cos(a) * r;
      const py = planet.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.clip("evenodd");
    for (let i = 0; i < numBands; i++) {
      const phase = (now / period + i / numBands) % 1; // 0 = outer edge, 1 = surface
      const bandRadius = influenceRadius * (1 - phase);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${bandAlpha})`;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, bandRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const g = ctx.createRadialGradient(
      planet.x - planet.radius * 0.35,
      planet.y - planet.radius * 0.4,
      planet.radius * 0.2,
      planet.x,
      planet.y,
      planet.radius,
    );
    g.addColorStop(0, `rgba(${planet.color.r}, ${planet.color.g}, ${planet.color.b}, 0.7)`);
    g.addColorStop(0.18, `rgb(${planet.color.r}, ${planet.color.g}, ${planet.color.b})`);
    g.addColorStop(1, `rgb(${planet.color.r}, ${planet.color.g}, ${planet.color.b}, 0.3)`);

    const N = 256;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = surfaceRadiusAt(planet, a);
      const px = planet.x + Math.cos(a) * r;
      const py = planet.y + Math.sin(a) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    for (const d of planet.deco) {
      const surfR = surfaceRadiusAt(planet, d.angle);
      const ox = Math.cos(d.angle) * (surfR - d.size * 0.8);
      const oy = Math.sin(d.angle) * (surfR - d.size * 0.8);

      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(planet.x + ox, planet.y + oy, d.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      const surfR = surfaceRadiusAt(planet, a);

      const trunkBaseX = planet.x + nx * surfR;
      const trunkBaseY = planet.y + ny * surfR;
      const trunkTopX = planet.x + nx * (surfR + 10);
      const trunkTopY = planet.y + ny * (surfR + 10);

      ctx.strokeStyle = "rgba(60,35,20,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trunkBaseX, trunkBaseY);
      ctx.lineTo(trunkTopX, trunkTopY);
      ctx.stroke();

      ctx.fillStyle = "rgba(145,220,160,0.95)";
      ctx.beginPath();
      ctx.arc(planet.x + nx * (surfR + 14), planet.y + ny * (surfR + 14), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer() {
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

    if (player.jetpackActive) {
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

  function drawStatus() {
    let label = player.mode;
    if (player.mode === "grounded" || player.mode === "bound") {
      label += player.activePlanet ? ` • ${player.activePlanet.name}` : "";
    } else if (player.mode === "air") {
      label += " • blended";
    }

    if (status) {
      status.textContent = label;
    }
    if (fuel) {
      fuel.textContent = `jetpack fuel: ${Math.round((player.fuel / player.maxFuel) * 100)}%`;
    }
  }

  function drawPlanetIndicator() {
    if (!player.hasUsedJetpackThisAirborne) return;

    const planet = player.currentPlanet;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    // World-space distance; fade from 0 at fadeStart to 1 at fadeEnd
    const worldDist = Math.hypot(planet.x - player.x, planet.y - player.y);
    const fadeStart = Math.hypot(cx, cy);
    const fadeEnd = fadeStart * 2;
    if (worldDist < fadeStart) return;
    const opacity = Math.min(1, (worldDist - fadeStart) / (fadeEnd - fadeStart));

    // Direction from player to planet in screen space (camera-relative)
    const sp = worldToScreen(planet.x, planet.y);
    const dx = sp.x - cx;
    const dy = sp.y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;

    const ndx = dx / len;
    const ndy = dy / len;

    // Orbit around player at fixed screen radius
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

  function drawMinimap() {
    const mapW = 160;
    const mapH = 100;
    const margin = 12;
    const pad = 8;

    const originX = margin;
    const originY = canvas.clientHeight - margin - mapH;
    const mapCX = originX + mapW / 2;
    const mapCY = originY + mapH / 2;

    // Fixed world-space view radius, scaled to fit the minimap's shorter half
    const viewRadius = 8500;
    const scale = Math.min(mapW / 2 - pad, mapH / 2 - pad) / viewRadius;

    function worldToMinimap(wx: number, wy: number) {
      const dx = wx - player.x;
      const dy = wy - player.y;
      const c = Math.cos(-camera.angle);
      const s = Math.sin(-camera.angle);
      return {
        x: mapCX + (dx * c - dy * s) * scale,
        y: mapCY + (dx * s + dy * c) * scale,
      };
    }

    ctx.save();

    // Clip everything to the minimap shape
    roundRect(ctx, originX, originY, mapW, mapH, 8);
    ctx.clip();

    // Background
    ctx.fillStyle = "rgba(10, 16, 32, 0.88)";
    ctx.fillRect(originX, originY, mapW, mapH);

    // Planets
    for (const p of planets) {
      const mp = worldToMinimap(p.x, p.y);
      const r = Math.max(3, p.radius * scale);

      // Planet body with radial gradient matching main view
      const g = ctx.createRadialGradient(mp.x - r * 0.35, mp.y - r * 0.4, r * 0.2, mp.x, mp.y, r);
      g.addColorStop(0, "rgba(255,255,255,0.20)");
      g.addColorStop(0.18, `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`);
      g.addColorStop(1, "#111111");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player — centered, small upward triangle (always faces up in minimap)
    ctx.fillStyle = "#f7f8ff";
    ctx.beginPath();
    // ctx.moveTo(mapCX, mapCY - 4);
    // ctx.lineTo(mapCX + 3, mapCY + 3);
    // ctx.lineTo(mapCX - 3, mapCY + 3);
    // ctx.closePath();
    ctx.arc(mapCX, mapCY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Border drawn after restore so it sits on top of clipped content
    roundRect(ctx, originX, originY, mapW, mapH, 8);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function applyCollisionImpulse(
    a: { vx: number; vy: number; mass: number; x: number; y: number },
    b: { vx: number; vy: number; mass: number; x: number; y: number },
  ) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
    const nx = (b.x - a.x) / dist;
    const ny = (b.y - a.y) / dist;
    const relVx = a.vx - b.vx;
    const relVy = a.vy - b.vy;
    const relDotN = relVx * nx + relVy * ny;
    if (relDotN >= 0) return; // already separating
    const j = (2 * relDotN) / (1 / a.mass + 1 / b.mass);
    a.vx -= (j / a.mass) * nx;
    a.vy -= (j / a.mass) * ny;
    b.vx += (j / b.mass) * nx;
    b.vy += (j / b.mass) * ny;
  }

  function updateSatellites() {
    for (const sat of satellites) {
      if (sat.mode === "kinematic") {
        const angularVelocity = (Math.PI * 2) / sat.orbitalPeriod;
        sat.angle += angularVelocity;
        sat.x = sat.planet.x + Math.cos(sat.angle) * sat.orbitalRadius;
        sat.y = sat.planet.y + Math.sin(sat.angle) * sat.orbitalRadius;
        sat.vx = -Math.sin(sat.angle) * sat.orbitalRadius * angularVelocity;
        sat.vy = Math.cos(sat.angle) * sat.orbitalRadius * angularVelocity;
      } else {
        const g = getBlendedGravity(sat.x, sat.y);
        sat.vx += g.gx;
        sat.vy += g.gy;
        sat.x += sat.vx;
        sat.y += sat.vy;

        // Crash into parent planet
        const dToPlanet = Math.hypot(sat.x - sat.planet.x, sat.y - sat.planet.y);
        const surfAngle = Math.atan2(sat.y - sat.planet.y, sat.x - sat.planet.x);
        if (dToPlanet < surfaceRadiusAt(sat.planet, surfAngle) + sat.radius) {
          sat.mode = "kinematic"; // respawn kinematically (reset)
          sat.angle = Math.random() * Math.PI * 2;
          sat.x = sat.planet.x + Math.cos(sat.angle) * sat.orbitalRadius;
          sat.y = sat.planet.y + Math.sin(sat.angle) * sat.orbitalRadius;
          const av = (Math.PI * 2) / sat.orbitalPeriod;
          sat.vx = -Math.sin(sat.angle) * sat.orbitalRadius * av;
          sat.vy = Math.cos(sat.angle) * sat.orbitalRadius * av;
        }
      }

      // Collision with player
      const dToPlayer = Math.hypot(player.x - sat.x, player.y - sat.y);
      if (dToPlayer < player.radius + sat.radius) {
        if (sat.mode === "kinematic") {
          sat.mode = "physics"; // vx/vy already set to tangential velocity
        }
        applyCollisionImpulse(player, sat);
        // Separate them
        const overlap = player.radius + sat.radius - dToPlayer;
        const nx = (player.x - sat.x) / (dToPlayer || 0.001);
        const ny = (player.y - sat.y) / (dToPlayer || 0.001);
        player.x += nx * overlap * 0.5;
        player.y += ny * overlap * 0.5;
        sat.x -= nx * overlap * 0.5;
        sat.y -= ny * overlap * 0.5;
        if (player.onGround) {
          player.onGround = false;
          player.mode = "air";
        }
      }
    }
  }

  function spawnAsteroid() {
    // Pick off-screen spawn point
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = Math.hypot(canvas.clientWidth, canvas.clientHeight) / 2 + 500;
    const spawnX = player.x + Math.cos(angle) * spawnDist;
    const spawnY = player.y + Math.sin(angle) * spawnDist;

    // Aim roughly toward planet cluster center with ±30° randomness
    const centerX = planets.reduce((s, p) => s + p.x, 0) / planets.length;
    const centerY = planets.reduce((s, p) => s + p.y, 0) / planets.length;
    const toCenter = Math.atan2(centerY - spawnY, centerX - spawnX);
    const aimAngle = toCenter + (Math.random() - 0.5) * (Math.PI / 3);
    const speed = 6 + Math.random() * 6;
    const radius = 15 + Math.random() * 30;
    const numVertices = 7 + Math.floor(Math.random() * 3);
    const vertexOffsets = Array.from({ length: numVertices }, () => 0.75 + Math.random() * 0.5);

    asteroids.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      radius,
      mass: radius * radius * 0.5,
      active: true,
      vertexOffsets,
    });
  }

  function updateAsteroids() {
    const nearestPlanetDist = (ax: number, ay: number) =>
      Math.min(...planets.map((p) => Math.hypot(ax - p.x, ay - p.y)));

    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast = asteroids[i];
      if (!ast.active) {
        asteroids.splice(i, 1);
        continue;
      }

      // Gravity — 50% of full gravity so they curve but usually pass through
      const g = getBlendedGravity(ast.x, ast.y);
      ast.vx += g.gx * 0.5;
      ast.vy += g.gy * 0.5;
      ast.x += ast.vx;
      ast.y += ast.vy;

      // Despawn if too far
      if (nearestPlanetDist(ast.x, ast.y) > 3000) {
        ast.active = false;
        continue;
      }

      // Collision with planets
      let hitPlanet = false;
      for (const planet of planets) {
        const d = Math.hypot(ast.x - planet.x, ast.y - planet.y);
        const surfAngle = Math.atan2(ast.y - planet.y, ast.x - planet.x);
        if (d < surfaceRadiusAt(planet, surfAngle) + ast.radius) {
          ast.active = false;
          hitPlanet = true;
          break;
        }
      }
      if (hitPlanet) continue;

      // Collision with player
      const dToPlayer = Math.hypot(player.x - ast.x, player.y - ast.y);
      if (dToPlayer < player.radius + ast.radius) {
        const playerProxy = {
          vx: player.vx,
          vy: player.vy,
          mass: player.mass,
          x: player.x,
          y: player.y,
        };
        applyCollisionImpulse(playerProxy, ast);
        player.vx = playerProxy.vx;
        player.vy = playerProxy.vy;
        if (player.onGround) {
          player.onGround = false;
          player.mode = "air";
        }
      }

      // Collision with satellites
      for (const sat of satellites) {
        const dToSat = Math.hypot(ast.x - sat.x, ast.y - sat.y);
        if (dToSat < ast.radius + sat.radius) {
          if (sat.mode === "kinematic") {
            sat.mode = "physics";
          }
          applyCollisionImpulse(ast, sat);
        }
      }
    }
  }

  function drawSatellites() {
    ctx.save();
    ctx.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);
    ctx.rotate(-camera.angle);
    ctx.translate(-player.x, -player.y);

    for (const sat of satellites) {
      // Draw faint orbital ring in kinematic mode
      if (sat.mode === "kinematic") {
        ctx.beginPath();
        ctx.arc(sat.planet.x, sat.planet.y, sat.orbitalRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${sat.color.r}, ${sat.color.g}, ${sat.color.b}, 0.12)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Orientation: body perpendicular to orbit (radial axis), panels along orbit tangent.
      // In kinematic mode use orbital angle directly; in physics use velocity direction.
      const orientAngle =
        sat.mode === "kinematic"
          ? sat.angle + Math.PI / 2
          : Math.atan2(sat.vy, sat.vx) + Math.PI / 2;

      const s = sat.radius; // scale unit

      ctx.save();
      ctx.translate(sat.x, sat.y);
      ctx.rotate(orientAngle);

      // --- Solar panels ---
      // Each wing: two panel segments separated by a short strut gap.
      // Panels are blue/dark-blue cells with a grid, mounted on a thin boom.
      const boomLen = s * 1.7; // half-width: center to outer edge of each wing
      const boomW = s * 0.08;
      const panelW = s * 1.3; // each panel section width
      const panelH = s * 0.55;
      const panelGap = s * 0.12; // gap at center (where boom meets body)

      for (const side of [-1, 1]) {
        const boomStartX = side * s * 0.38; // attached at body edge
        const boomEndX = side * (s * 0.38 + boomLen);

        // Boom strut
        ctx.fillStyle = "rgba(160,165,180,0.9)";
        ctx.fillRect(
          Math.min(boomStartX, boomEndX),
          -boomW / 2,
          Math.abs(boomEndX - boomStartX),
          boomW,
        );

        // Two panel sections along the boom (inner and outer)
        for (let pi = 0; pi < 2; pi++) {
          const pStartX =
            side > 0
              ? boomStartX + panelGap + pi * (panelW + panelGap)
              : boomStartX - panelGap - (pi + 1) * panelW - pi * panelGap;

          // Panel base — deep navy-blue
          ctx.fillStyle = "rgba(22, 44, 120, 0.95)";
          ctx.fillRect(pStartX, -panelH / 2, panelW * side, panelH);

          // Solar cell grid lines
          ctx.strokeStyle = "rgba(80, 120, 220, 0.6)";
          ctx.lineWidth = 0.5;
          const cols = 4;
          const rows = 2;
          for (let ci = 1; ci < cols; ci++) {
            const lx = pStartX + (panelW * side * ci) / cols;
            ctx.beginPath();
            ctx.moveTo(lx, -panelH / 2);
            ctx.lineTo(lx, panelH / 2);
            ctx.stroke();
          }
          for (let ri = 1; ri < rows; ri++) {
            const ly = -panelH / 2 + (panelH * ri) / rows;
            ctx.beginPath();
            ctx.moveTo(pStartX, ly);
            ctx.lineTo(pStartX + panelW * side, ly);
            ctx.stroke();
          }

          // Subtle reflective sheen on the panel
          ctx.fillStyle = "rgba(100,160,255,0.10)";
          ctx.fillRect(pStartX, -panelH / 2, panelW * side, panelH * 0.4);

          // Panel border
          ctx.strokeStyle = "rgba(140,170,255,0.5)";
          ctx.lineWidth = 0.8;
          ctx.strokeRect(pStartX, -panelH / 2, panelW * side, panelH);
        }
      }

      // --- Main body ---
      const bodyW = s * 0.76;
      const bodyH = s * 1.1;

      // Body shell — metallic gradient
      const bodyGrad = ctx.createLinearGradient(-bodyW / 2, -bodyH / 2, bodyW / 2, bodyH / 2);
      bodyGrad.addColorStop(0, `rgba(230,232,240,0.97)`);
      bodyGrad.addColorStop(0.45, `rgb(${sat.color.r}, ${sat.color.g}, ${sat.color.b})`);
      bodyGrad.addColorStop(1, `rgba(60,65,80,0.95)`);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      const br = s * 0.1; // corner radius
      ctx.moveTo(-bodyW / 2 + br, -bodyH / 2);
      ctx.lineTo(bodyW / 2 - br, -bodyH / 2);
      ctx.quadraticCurveTo(bodyW / 2, -bodyH / 2, bodyW / 2, -bodyH / 2 + br);
      ctx.lineTo(bodyW / 2, bodyH / 2 - br);
      ctx.quadraticCurveTo(bodyW / 2, bodyH / 2, bodyW / 2 - br, bodyH / 2);
      ctx.lineTo(-bodyW / 2 + br, bodyH / 2);
      ctx.quadraticCurveTo(-bodyW / 2, bodyH / 2, -bodyW / 2, bodyH / 2 - br);
      ctx.lineTo(-bodyW / 2, -bodyH / 2 + br);
      ctx.quadraticCurveTo(-bodyW / 2, -bodyH / 2, -bodyW / 2 + br, -bodyH / 2);
      ctx.closePath();
      ctx.fill();

      // Body edge highlight
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Body face detail — thermal louvres (horizontal stripes)
      ctx.strokeStyle = "rgba(100,110,140,0.45)";
      ctx.lineWidth = 0.7;
      const louvrCount = 5;
      for (let li = 1; li < louvrCount; li++) {
        const ly = -bodyH / 2 + (bodyH * li) / louvrCount;
        ctx.beginPath();
        ctx.moveTo(-bodyW / 2 + br, ly);
        ctx.lineTo(bodyW / 2 - br, ly);
        ctx.stroke();
      }

      // --- Dish antenna ---
      // Small parabolic dish on top of the body, pointing away from planet.
      const dishR = s * 0.28;
      const dishStemH = s * 0.22;
      const dishY = -bodyH / 2 - dishStemH;

      // Stem
      ctx.strokeStyle = "rgba(180,185,200,0.9)";
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.moveTo(0, -bodyH / 2);
      ctx.lineTo(0, dishY);
      ctx.stroke();

      // Dish arc (half-circle facing up)
      ctx.beginPath();
      ctx.arc(0, dishY, dishR, Math.PI, Math.PI * 2);
      ctx.fillStyle = "rgba(210,215,230,0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Dish feed horn (tiny dot at focus)
      ctx.fillStyle = "rgba(80,85,100,0.9)";
      ctx.beginPath();
      ctx.arc(0, dishY - dishR * 0.55, s * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  function drawAsteroids() {
    ctx.save();
    ctx.translate(canvas.clientWidth / 2, canvas.clientHeight / 2);
    ctx.rotate(-camera.angle);
    ctx.translate(-player.x, -player.y);

    for (const ast of asteroids) {
      if (!ast.active) continue;

      const numVerts = ast.vertexOffsets.length;
      ctx.beginPath();
      for (let i = 0; i <= numVerts; i++) {
        const vAngle = (i / numVerts) * Math.PI * 2;
        const r = ast.radius * ast.vertexOffsets[i % numVerts];
        const vx = ast.x + Math.cos(vAngle) * r;
        const vy = ast.y + Math.sin(vAngle) * r;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();

      const gray = 85 + Math.floor(ast.radius * 1.5);
      ctx.fillStyle = `rgb(${gray}, ${gray - 5}, ${gray - 10})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(180,180,185,0.5)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawWorld();
    drawSatellites();
    drawAsteroids();
    drawPlayer();
    drawPlanetIndicator();
    drawMinimap();
    drawStatus();
  }

  let rafId: number;

  function tick() {
    updatePlayer();
    updateSatellites();
    updateAsteroids();

    // Asteroid spawn timer
    const activeCount = asteroids.filter((a) => a.active).length;
    asteroidSpawnTimer--;
    if (asteroidSpawnTimer <= 0 && activeCount < MAX_ASTEROIDS) {
      spawnAsteroid();
      asteroidSpawnTimer = 300 + Math.floor(Math.random() * 600);
    }

    updateCamera();
    draw();
    prevKeys = new Set(keys);
    rafId = requestAnimationFrame(tick);
  }

  resetPlayer();
  rafId = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener("resize", resize);
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("keyup", handleKeyup);
    cancelAnimationFrame(rafId);
  };
}

function surfaceRadiusAt(planet: Planet, angle: number): number {
  let offset = 0;
  for (const feature of planet.terrain) {
    const diff = wrapAngle(angle - feature.angle);
    if (Math.abs(diff) < feature.width) {
      const t = diff / feature.width; // -1 to 1
      offset += feature.amplitude * 0.5 * (1 + Math.cos(Math.PI * t)); // Hann window: C1, zero at edges
    }
  }
  return planet.radius + offset;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function length(x: number, y: number) {
  return Math.hypot(x, y);
}

function normalize(x: number, y: number) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function dot(ax: number, ay: number, bx: number, by: number) {
  return ax * bx + ay * by;
}

function wrapAngle(angle: number) {
  while (angle <= -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

function shortestAngleDiff(from: number, to: number) {
  return wrapAngle(to - from);
}

function angleToUpVector(angle: number) {
  return { x: Math.sin(angle), y: -Math.cos(angle) };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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

function gravityStrengthForPlanet(planet: Planet, px: number, py: number) {
  const dx = planet.x - px;
  const dy = planet.y - py;
  const dist = Math.hypot(dx, dy);

  const altitude = Math.max(0, dist - planet.radius);
  const influence = planet.radius * GRAVITY_RADIUS_MULTIPLIER + GRAVITY_RADIUS_BASE;
  const t = clamp(altitude / influence, 0, 1);

  const falloff = 1 - t * t * (3 - 2 * t);

  return planet.gravity * (0.015 + 0.985 * falloff);
}

function gravityVectorForPlanet(planet: Planet, px: number, py: number) {
  const dx = planet.x - px;
  const dy = planet.y - py;
  const dir = normalize(dx, dy);
  const strength = gravityStrengthForPlanet(planet, px, py);

  return {
    planet,
    dirX: dir.x,
    dirY: dir.y,
    gx: dir.x * strength,
    gy: dir.y * strength,
    strength,
  };
}

function clampVelocity(vx: number, vy: number, maxSpeed: number) {
  const speed = Math.hypot(vx, vy);

  if (speed <= maxSpeed) {
    return { vx, vy };
  }

  const scale = maxSpeed / speed;

  return {
    vx: vx * scale,
    vy: vy * scale,
  };
}

function generatePlanets(): Planet[] {
  return [
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
}

function generateSatellites(planets: Planet[]): Satellite[] {
  const sats: Satellite[] = [];
  const satColors = [
    { r: 180, g: 185, b: 200 }, // silver-blue
    { r: 200, g: 190, b: 175 }, // warm silver
    { r: 165, g: 200, b: 180 }, // cool teal-silver
  ];

  for (const planet of planets) {
    const count = 1 + Math.floor(Math.random() * 2); // 1 or 2
    for (let i = 0; i < count; i++) {
      const orbitalRadius = planet.radius * (1.6 + Math.random() * 0.6);
      // period scales with orbital radius: farther = slower
      const orbitalPeriod = 600 + (orbitalRadius / planet.radius - 1.6) * 1500;
      const angle = Math.random() * Math.PI * 2;
      const angularVelocity = (Math.PI * 2) / orbitalPeriod;
      const color = satColors[Math.floor(Math.random() * satColors.length)];
      // Slight tint toward planet color
      const tintedColor = {
        r: Math.round(color.r * 0.8 + planet.color.r * 0.2),
        g: Math.round(color.g * 0.8 + planet.color.g * 0.2),
        b: Math.round(color.b * 0.8 + planet.color.b * 0.2),
      };

      sats.push({
        planet,
        orbitalRadius,
        orbitalPeriod,
        angle,
        x: planet.x + Math.cos(angle) * orbitalRadius,
        y: planet.y + Math.sin(angle) * orbitalRadius,
        vx: -Math.sin(angle) * orbitalRadius * angularVelocity,
        vy: Math.cos(angle) * orbitalRadius * angularVelocity,
        radius: 20 + Math.random() * 20,
        mass: 200 + Math.random() * 300,
        mode: "kinematic",
        color: tintedColor,
      });
    }
  }
  return sats;
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
