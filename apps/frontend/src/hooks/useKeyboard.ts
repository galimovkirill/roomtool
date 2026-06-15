import { useEffect, useLayoutEffect, useRef } from 'react'

type Handlers = Record<string, (e: KeyboardEvent) => void>

export function useKeyboard(handlers: Handlers) {
  const handlersRef = useRef(handlers)

  useLayoutEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return

      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('ctrl')
      if (e.shiftKey) parts.push('shift')
      parts.push(e.key.toLowerCase())
      const combo = parts.join('+')

      const fn = handlersRef.current[combo]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
