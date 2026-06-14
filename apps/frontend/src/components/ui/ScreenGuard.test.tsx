import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ScreenGuard } from './ScreenGuard'

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
}

describe('ScreenGuard', () => {
  let originalWidth: number

  beforeEach(() => {
    originalWidth = window.innerWidth
  })

  afterEach(() => {
    setWidth(originalWidth)
  })

  it('renders children when width >= 1024', () => {
    setWidth(1280)
    render(
      <ScreenGuard>
        <span>content</span>
      </ScreenGuard>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('renders children at exactly width 1024', () => {
    setWidth(1024)
    render(
      <ScreenGuard>
        <span>content</span>
      </ScreenGuard>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('renders fallback when width < 1024', () => {
    setWidth(768)
    render(
      <ScreenGuard>
        <span>content</span>
      </ScreenGuard>
    )
    expect(screen.queryByText('content')).not.toBeInTheDocument()
    expect(screen.getByText(/минимальная ширина экрана/)).toBeInTheDocument()
  })

  it('switches to fallback on resize below 1024', () => {
    setWidth(1280)
    render(
      <ScreenGuard>
        <span>content</span>
      </ScreenGuard>
    )
    expect(screen.getByText('content')).toBeInTheDocument()

    act(() => {
      setWidth(800)
      window.dispatchEvent(new Event('resize'))
    })

    expect(screen.queryByText('content')).not.toBeInTheDocument()
    expect(screen.getByText(/минимальная ширина экрана/)).toBeInTheDocument()
  })

  it('restores children on resize back above 1024', () => {
    setWidth(800)
    render(
      <ScreenGuard>
        <span>content</span>
      </ScreenGuard>
    )
    expect(screen.queryByText('content')).not.toBeInTheDocument()

    act(() => {
      setWidth(1280)
      window.dispatchEvent(new Event('resize'))
    })

    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
