import { Color } from "../types";
import { Planet, PlanetConfig } from "./parts/Planet";
import { Platform } from "./parts/Platform";
import { Player } from "./parts/Player";
import { Ramp } from "./parts/Ramp";
import { Satellite } from "./parts/Satellite";
import { Tree, TreeConfig } from "./parts/Tree";
import { World } from "./World";

type WorldArgs = ConstructorParameters<typeof World>;

export function createWorld(...args: WorldArgs): World {
  const world = new World(...args);

  // Add planets
  for (const cfg of PLANET_CONFIGS) {
    world.add(new Planet(world, cfg));
  }

  // Add trees
  for (const planet of world.planets) {
    for (const tree of createTrees(planet)) {
      world.add(tree);
    }
  }

  // Add satellites
  for (const planet of world.planets) {
    for (const sat of createSatellites(planet)) {
      world.add(sat);
    }
  }

  // Add platforms
  const planets = world.planets;
  const [azure, cinder, verdant, violet] = planets;

  if (azure) {
    // Ground-level block (resting on the surface)
    world.add(
      new Platform(world, {
        planet: azure,
        angle: 2.6,
        altitude: 0,
        width: 290,
        height: 22,
        color: "#7ba3e0",
      }),
    );
    // Floating platform, moderate height
    world.add(
      new Platform(world, {
        planet: azure,
        angle: -0.5,
        altitude: 60,
        width: 110,
        height: 18,
        color: "#5a8ad4",
      }),
    );
    // Higher floating platform
    world.add(
      new Platform(world, {
        planet: azure,
        angle: 0.8,
        altitude: 140,
        width: 80,
        height: 18,
        color: "#4a7ac4",
      }),
    );
    // Ramp near player spawn (slightly to the right)
    world.add(
      new Ramp(world, {
        planet: azure,
        angle: -Math.PI / 2 + 0.3,
        altitude: 0,
        width: 80,
        height: 40,
        color: "#6090d0",
      }),
    );
  }

  if (cinder) {
    // Ground-level block
    world.add(
      new Platform(world, {
        planet: cinder,
        angle: 1.6,
        altitude: 0,
        width: 80,
        height: 24,
        color: "#c07850",
      }),
    );
    // Floating platform
    world.add(
      new Platform(world, {
        planet: cinder,
        angle: 3.8,
        altitude: 70,
        width: 100,
        height: 20,
        color: "#b06840",
      }),
    );
  }

  if (verdant) {
    // Floating step platforms — low, mid, high
    world.add(
      new Platform(world, {
        planet: verdant,
        angle: 0.2,
        altitude: 40,
        width: 80,
        height: 18,
        color: "#3aaa72",
      }),
    );
    world.add(
      new Platform(world, {
        planet: verdant,
        angle: -0.3,
        altitude: 100,
        width: 70,
        height: 18,
        color: "#2a9a62",
      }),
    );
  }

  if (violet) {
    // Ground-level block
    world.add(
      new Platform(world, {
        planet: violet,
        angle: 2.2,
        altitude: 0,
        width: 85,
        height: 22,
        color: "#9060c0",
      }),
    );
    // High floating platform
    world.add(
      new Platform(world, {
        planet: violet,
        angle: 4.8,
        altitude: 110,
        width: 95,
        height: 18,
        color: "#7845a8",
      }),
    );
  }

  // Add player
  world.add(new Player(world));

  return world;
}

function createSatellites(planet: Planet): Satellite[] {
  const sats: Satellite[] = [];
  const satColors: Color[] = [
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
    const mass = 600 + Math.random() * 300;

    sats.push(
      new Satellite(planet.world, {
        planet,
        orbitalRadius,
        orbitalPeriod,
        angle,
        width: radius * 4,
        height: radius * 1.5,
        mass,
        color: tintedColor,
      }),
    );
  }
  return sats;
}

// Per-planet tree color palettes: [leafHue, leafSat, trunkHue, trunkSat]
const TREE_PALETTES: Record<
  string,
  Pick<TreeConfig, "leafHue" | "leafSat" | "trunkHue" | "trunkSat">[]
> = {
  Azure: [
    { leafHue: 160, leafSat: 55, trunkHue: 25, trunkSat: 40 }, // teal-green
    { leafHue: 210, leafSat: 50, trunkHue: 220, trunkSat: 20 }, // cool blue
    { leafHue: 130, leafSat: 50, trunkHue: 30, trunkSat: 45 }, // classic green
  ],
  Cinder: [
    { leafHue: 25, leafSat: 70, trunkHue: 15, trunkSat: 50 }, // orange
    { leafHue: 45, leafSat: 65, trunkHue: 20, trunkSat: 45 }, // golden
    { leafHue: 0, leafSat: 55, trunkHue: 10, trunkSat: 40 }, // red-orange
  ],
  Verdant: [
    { leafHue: 140, leafSat: 60, trunkHue: 30, trunkSat: 40 }, // forest green
    { leafHue: 170, leafSat: 55, trunkHue: 160, trunkSat: 20 }, // teal
    { leafHue: 100, leafSat: 50, trunkHue: 35, trunkSat: 45 }, // lime green
  ],
  Violet: [
    { leafHue: 280, leafSat: 55, trunkHue: 270, trunkSat: 25 }, // purple
    { leafHue: 310, leafSat: 50, trunkHue: 290, trunkSat: 20 }, // magenta
    { leafHue: 250, leafSat: 45, trunkHue: 260, trunkSat: 22 }, // indigo
  ],
};

function createTrees(planet: Planet): Tree[] {
  const trees: Tree[] = [];
  const count = 6 + Math.floor(Math.random() * 5); // 6-10 trees per planet
  const palettes = TREE_PALETTES[planet.name] ?? TREE_PALETTES.Verdant;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const seed = Math.floor(planet.x * 7 + planet.y * 13 + i * 997);
    const palette = palettes[i % palettes.length];
    trees.push(new Tree(planet.world, { planet, angle, seed, ...palette }));
  }
  return trees;
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
