import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface Props {
  children: ReactNode
}

export function AppLayout({ children }: Props) {
  return (
    <TooltipProvider delay={400}>
      <div className="h-screen w-screen overflow-hidden flex flex-col">{children}</div>
    </TooltipProvider>
  )
}
