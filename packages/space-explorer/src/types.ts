export interface TerrainFeature {
  angle: number; // center angle in radians (Math.atan2 convention)
  amplitude: number; // height offset in world units (positive = hill, negative = crater)
  width: number; // angular half-width in radians
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

export interface Color {
  r: number;
  g: number;
  b: number;
}
