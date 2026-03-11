export interface TerrainFeature {
  angle: number; // center angle in radians (Math.atan2 convention)
  amplitude: number; // height offset in world units (positive = hill, negative = crater)
  width: number; // angular half-width in radians
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  radius: number; // recommended range: [0.15, 0.40]
  gravity: number;
  color: Color;
  ringColor: Color;
  deco: PlanetDecoration[];
  terrain: TerrainFeature[];
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface PlanetDecoration {
  angle: number;
  size: number;
  color: string;
}

export interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  onGround: boolean;
  currentPlanet: Planet;
  activePlanet: Planet | undefined;
  mode: "grounded" | "bound" | "air";
  upX: number;
  upY: number;
  freeAngle: number;
  jetpackArmed: boolean;
  jetpackActive: boolean;
  hasUsedJetpackThisAirborne: boolean;
  fuel: number;
  maxFuel: number;
  jumpAngularVelocity: number; // rad/frame, preserved during arc to match surface travel distance
  jumpAngularVelocityMax: number; // |ω| at jump time — caps aerial steering
}
