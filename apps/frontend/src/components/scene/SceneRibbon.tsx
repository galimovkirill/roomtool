import { ViewModeToggle } from './ribbon/ViewModeToggle'
import { GizmoToggle } from './ribbon/GizmoToggle'
import { CeilingLightToggle } from './ribbon/CeilingLightToggle'
import { AlignmentPopover } from './ribbon/AlignmentPopover'
import { ItemActionsGroup } from './ribbon/ItemActionsGroup'
import { ResetSceneButton } from './ribbon/ResetSceneButton'
import { SaveStatusIndicator } from './ribbon/SaveStatusIndicator'
import { UserButton } from './ribbon/UserButton'
import { BackButton } from './ribbon/BackButton'
import { useSyncStore } from '@/store/syncStore'

export function SceneRibbon() {
  const sceneName = useSyncStore((s) => s.sceneName)

  return (
    <div className="relative flex items-center gap-1 px-3 h-10 bg-white border-b border-gray-200 shrink-0">
      {sceneName && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{sceneName}</span>
        </div>
      )}
      <BackButton />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <ViewModeToggle />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <GizmoToggle />
      <CeilingLightToggle />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <AlignmentPopover />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <ItemActionsGroup />
      <div className="ml-auto" />
      <SaveStatusIndicator />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <ResetSceneButton />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <UserButton />
    </div>
  )
}
