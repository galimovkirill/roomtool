import { SCENE_CONFIG } from '@/config/scene'

/**
 * Удерживает элемент внутри границ комнаты по всем трём осям с учётом его размеров.
 * X/Z центрируются в пределах [-half + halfDim, half - halfDim].
 * Y: низ элемента не ниже пола (y >= height/2), верх не выше потолка (y <= roomH - height/2).
 *
 * Принимает любой объект с x/y/z (в т.ч. THREE.Vector3 — структурно совместим).
 */
export function clampToRoom(
  pos: { x: number; y: number; z: number },
  dims: { width: number; height: number; depth: number }
): [number, number, number] {
  const { width: roomW, depth: roomD, height: roomH } = SCENE_CONFIG.room
  return [
    Math.min(roomW / 2 - dims.width / 2, Math.max(-roomW / 2 + dims.width / 2, pos.x)),
    Math.min(roomH - dims.height / 2, Math.max(dims.height / 2, pos.y)),
    Math.min(roomD / 2 - dims.depth / 2, Math.max(-roomD / 2 + dims.depth / 2, pos.z)),
  ]
}
