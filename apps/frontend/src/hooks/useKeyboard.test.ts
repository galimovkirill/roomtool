import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyboard } from './useKeyboard'

function fireKey(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; target?: EventTarget } = {}
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    bubbles: true,
  })
  if (opts.target) {
    Object.defineProperty(event, 'target', { value: opts.target, writable: false })
  }
  window.dispatchEvent(event)
  return event
}

describe('useKeyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('коллбек вызывается при нажатии нужной клавиши', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ a: handler }))
    fireKey('a')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('коллбек не вызывается при нажатии другой клавиши', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ a: handler }))
    fireKey('b')
    expect(handler).not.toHaveBeenCalled()
  })

  it('ctrl+z не вызывается при нажатии z без ctrl', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ 'ctrl+z': handler }))
    fireKey('z')
    expect(handler).not.toHaveBeenCalled()
  })

  it('ctrl+z вызывается при e.ctrlKey (Windows)', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ 'ctrl+z': handler }))
    fireKey('z', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ctrl+z вызывается при e.metaKey (macOS)', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ 'ctrl+z': handler }))
    fireKey('z', { metaKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('коллбек не вызывается, если target — <input>', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ a: handler }))
    const input = document.createElement('input')
    fireKey('a', { target: input })
    expect(handler).not.toHaveBeenCalled()
  })

  it('коллбек не вызывается, если target — <textarea>', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ a: handler }))
    const textarea = document.createElement('textarea')
    fireKey('a', { target: textarea })
    expect(handler).not.toHaveBeenCalled()
  })
})
