export interface TerrainFeature {
  angle: number; // center angle in radians (Math.atan2 convention)
  amplitude: number; // height offset in world units (positive = hill, negative = crater)
  width: number; // angular half-width in radians
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  radius: number;
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
