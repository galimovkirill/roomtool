export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (dateDay.getTime() === today.getTime()) {
    return `сегодня в ${timeStr}`
  }
  if (dateDay.getTime() === yesterday.getTime()) {
    return `вчера в ${timeStr}`
  }

  const day = date.getDate()
  const month = date.toLocaleString('ru-RU', { month: 'short' }).replace('.', '').trim()

  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month} в ${timeStr}`
  }

  return `${day} ${month} ${date.getFullYear()}`
}
