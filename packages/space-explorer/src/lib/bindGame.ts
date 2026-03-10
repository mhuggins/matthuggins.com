import { Planet, Star } from "../types";

const MAX_NEAREST_PLANETS = 10;
const MIN_CONTRIBUTION = 0.02;

const JUMP_STRENGTH = 7.8;
const JETPACK_FORCE = 0.35;
const JETPACK_DRAIN = 0; // 0.0125;
const AIR_ROTATE_SPEED = 0.01;

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
      const distToSurface = Math.hypot(dx, dy) - planet.radius;
      if (distToSurface < bestMetric) {
        bestMetric = distToSurface;
        best = planet;
      }
    }
    return best;
  }

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 12,
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
  };

  const camera = {
    angle: 0,
  };

  function resetPlayer() {
    const p = planets[0];
    player.x = p.x;
    player.y = p.y - p.radius - player.radius;
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

      const targetDist = planet.radius + player.radius;

      player.x = planet.x - down.x * targetDist;
      player.y = planet.y - down.y * targetDist;

      const walkSpeed = 2.4;
      player.vx = tangent.x * walkSpeed * move;
      player.vy = tangent.y * walkSpeed * move;

      player.upX = up.x;
      player.upY = up.y;
      player.freeAngle = Math.atan2(player.upX, -player.upY);

      if (justPressed("Space")) {
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
        const fromPlanet = normalize(
          player.x - player.currentPlanet.x,
          player.y - player.currentPlanet.y,
        );
        player.freeAngle = Math.atan2(fromPlanet.x, -fromPlanet.y);
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

      const distAfter = length(player.x - landingPlanet.x, player.y - landingPlanet.y);
      const targetDistAfter = landingPlanet.radius + player.radius;
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

    for (const planet of planets) drawPlanet(planet);

    ctx.restore();
  }

  function drawPlanet(planet: (typeof planets)[0]) {
    const range = gravityRange(planet);

    ctx.strokeStyle = `rgba(${planet.ringColor.r}, ${planet.ringColor.g}, ${planet.ringColor.b}, 0.16)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, range, 0, Math.PI * 2);
    ctx.stroke();

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

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    for (const d of planet.deco) {
      const ox = Math.cos(d.angle) * (planet.radius - d.size * 0.8);
      const oy = Math.sin(d.angle) * (planet.radius - d.size * 0.8);

      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(planet.x + ox, planet.y + oy, d.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const nx = Math.cos(a);
      const ny = Math.sin(a);

      const trunkBaseX = planet.x + nx * planet.radius;
      const trunkBaseY = planet.y + ny * planet.radius;
      const trunkTopX = planet.x + nx * (planet.radius + 10);
      const trunkTopY = planet.y + ny * (planet.radius + 10);

      ctx.strokeStyle = "rgba(60,35,20,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trunkBaseX, trunkBaseY);
      ctx.lineTo(trunkTopX, trunkTopY);
      ctx.stroke();

      ctx.fillStyle = "rgba(145,220,160,0.95)";
      ctx.beginPath();
      ctx.arc(
        planet.x + nx * (planet.radius + 14),
        planet.y + ny * (planet.radius + 14),
        4,
        0,
        Math.PI * 2,
      );
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
    } else if (player.mode === "free") {
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

  function draw() {
    drawBackground();
    drawWorld();
    drawPlayer();
    drawPlanetIndicator();
    drawStatus();
  }

  let rafId: number;

  function tick() {
    updatePlayer();
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

function gravityRange(planet: Planet) {
  return planet.radius + 90 + planet.gravity * 280;
}

function gravityStrengthForPlanet(planet: Planet, px: number, py: number) {
  const dx = planet.x - px;
  const dy = planet.y - py;
  const dist = Math.hypot(dx, dy);

  const altitude = Math.max(0, dist - planet.radius);
  const influence = planet.radius * 2.6 + 320;
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
      radius: 400,
      gravity: 0.32,
      color: { r: 85, g: 125, b: 255 },
      ringColor: { r: 85, g: 125, b: 255 },
      deco: [
        { angle: 0.4, size: 14, color: "#93b0ff" },
        { angle: 1.6, size: 12, color: "#93b0ff" },
        { angle: 4.8, size: 13, color: "#93b0ff" },
      ],
    },
    {
      name: "Cinder",
      x: 900,
      y: -860,
      radius: 300,
      gravity: 0.34,
      color: { r: 255, g: 155, b: 74 },
      ringColor: { r: 255, g: 155, b: 74 },
      deco: [
        { angle: 0.8, size: 13, color: "#ffd7b4" },
        { angle: 2.5, size: 15, color: "#ffd7b4" },
        { angle: 5.1, size: 11, color: "#ffd7b4" },
      ],
    },
    {
      name: "Verdant",
      x: 1900,
      y: 60,
      radius: 200,
      gravity: 0.2,
      color: { r: 72, g: 199, b: 142 },
      ringColor: { r: 72, g: 199, b: 142 },
      deco: [
        { angle: 1.0, size: 12, color: "#b8f3d7" },
        { angle: 3.3, size: 13, color: "#b8f3d7" },
      ],
    },
    {
      name: "Violet",
      x: 1850,
      y: -920,
      radius: 280,
      gravity: 0.25,
      color: { r: 192, g: 107, b: 255 },
      ringColor: { r: 192, g: 107, b: 255 },
      deco: [
        { angle: 2.0, size: 11, color: "#ead1ff" },
        { angle: 4.2, size: 10, color: "#ead1ff" },
      ],
    },
  ];
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
