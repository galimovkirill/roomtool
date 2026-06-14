import { SCENE_CONFIG } from '@/config/scene'

/**
 * Преобразование координат между мировой системой Three.js и системой «от угла».
 *
 * Мировая система центрирована: комната занимает [-width/2, width/2] по X и
 * [-depth/2, depth/2] по Z, центр пола — (0, 0, 0). Эту систему НЕ трогаем —
 * в ней живут позиции в сторе, gizmo, коллизии и clampToRoom.
 *
 * Пользователю координаты показываем от дальнего угла комнаты (там, где сходятся
 * задняя и левая стены) — в мире это точка (-width/2, 0, -depth/2). В такой системе
 * X и Z всегда положительны и читаются как смещение от угла. Ось Y не преобразуется:
 * её «низ на полу при Y=0» считается отдельно (вычитанием height/2).
 */

const { width, depth } = SCENE_CONFIG.room

/** world (центр = 0) → отображение (дальний угол = 0), диапазон [0, width]. */
export function worldToRoomX(worldX: number): number {
  return worldX + width / 2
}

/** world (центр = 0) → отображение (дальний угол = 0), диапазон [0, depth]. */
export function worldToRoomZ(worldZ: number): number {
  return worldZ + depth / 2
}

/** отображение (дальний угол = 0) → world (центр = 0). */
export function roomToWorldX(roomX: number): number {
  return roomX - width / 2
}

/** отображение (дальний угол = 0) → world (центр = 0). */
export function roomToWorldZ(roomZ: number): number {
  return roomZ - depth / 2
}
