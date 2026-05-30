export const SCENE_CONFIG = {
  room: {
    width: 4000, // мм, ось X
    depth: 4000, // мм, ось Z
    height: 3000, // мм, ось Y
  },
  camera: {
    initialPosition: [2500, 2500, 2500] as const,
    fov: 50,
    minDistance: 500,
    maxDistance: 8000,
    target: [0, 0, 0] as const,
  },
} as const
