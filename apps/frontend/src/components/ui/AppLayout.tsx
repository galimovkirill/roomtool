import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface Props {
  children: [ReactNode, ReactNode]
}

export function AppLayout({ children }: Props) {
  const [scene, panel] = children

  return (
    <TooltipProvider delay={400}>
      <div className="h-screen w-screen overflow-hidden flex">
        <div className="flex-1 relative bg-gray-400">{scene}</div>
        <div className="w-80 flex flex-col border-l border-gray-200 bg-white overflow-y-auto">
          {panel}
        </div>
      </div>
    </TooltipProvider>
  )
}
