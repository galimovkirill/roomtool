import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { formatRelativeDate } from './formatDate'

// Fixed "now" = 2026-06-15 12:00 Moscow time (UTC+3) → UTC 09:00
const NOW = new Date('2026-06-15T09:00:00Z')

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

describe('formatRelativeDate', () => {
  it('returns "сегодня в HH:MM" for a time today', () => {
    const result = formatRelativeDate('2026-06-15T11:32:00')
    expect(result).toMatch(/^сегодня в \d{2}:\d{2}$/)
  })

  it('returns "вчера в HH:MM" for a time yesterday', () => {
    const result = formatRelativeDate('2026-06-14T09:15:00')
    expect(result).toMatch(/^вчера в \d{2}:\d{2}$/)
  })

  it('returns "D mon в HH:MM" for a date in the current year', () => {
    const result = formatRelativeDate('2026-03-15T11:00:00')
    expect(result).toMatch(/^15 \S+ в \d{2}:\d{2}$/)
    expect(result).not.toMatch(/\d{4}/)
  })

  it('returns "D mon YYYY" for a date in a previous year', () => {
    const result = formatRelativeDate('2024-03-15T10:00:00')
    expect(result).toMatch(/^15 \S+ 2024$/)
    expect(result).not.toMatch(/в/)
  })

  it('does not include "вчера" for two days ago', () => {
    const result = formatRelativeDate('2026-06-13T10:00:00')
    expect(result).not.toMatch(/вчера/)
    expect(result).not.toMatch(/сегодня/)
  })
})
