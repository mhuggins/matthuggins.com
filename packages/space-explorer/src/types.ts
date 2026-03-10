export interface Planet {
  name: string;
  x: number;
  y: number;
  radius: number;
  gravity: number;
  color: Color;
  ringColor: Color;
  deco: PlanetDecoration[];
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
