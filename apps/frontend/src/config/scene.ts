export const SCENE_CONFIG = {
  room: {
    width: 4000, // мм, ось X
    depth: 4000, // мм, ось Z
    height: 3000, // мм, ось Y
  },
  camera: {
    initialPosition: [1500, 4500, 3000] as const,
    fov: 50,
    near: 1,
    far: 50000,
    minDistance: 500,
    maxDistance: 8000,
    target: [-1000, 0, -1000] as const,
  },
  grid: {
    fadeDistance: 10000, // мм, на каком расстоянии линии сетки исчезают
  },
} as const
