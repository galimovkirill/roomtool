import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ScreenGuard({ children }: Props) {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (!isWide) {
    return (
      <div className="bg-gray-100 h-screen flex items-center justify-center">
        <p className="text-center max-w-sm mx-auto text-gray-600">
          Приложение доступно только на десктопных устройствах (минимальная ширина экрана — 1024px)
        </p>
      </div>
    )
  }

  return <>{children}</>
}
