const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "agora", "há 5 min", "há 3 h", "há 2 dias"; acima de 30 dias, a data
export function timeAgo(value, now = new Date()) {
  if (!value) return '—'

  const date = new Date(value)
  const elapsed = now.getTime() - date.getTime()

  if (Number.isNaN(elapsed)) return '—'
  if (elapsed < MINUTE) return 'agora'
  if (elapsed < HOUR) return `há ${Math.floor(elapsed / MINUTE)} min`
  if (elapsed < DAY) return `há ${Math.floor(elapsed / HOUR)} h`

  const days = Math.floor(elapsed / DAY)
  if (days <= 30) return days === 1 ? 'há 1 dia' : `há ${days} dias`

  return date.toLocaleDateString('pt-BR')
}

// Duração em horas → "5 h" ou "2,5 dias"
export function formatDuration(hours) {
  if (hours === null || hours === undefined) return '—'
  if (hours < 24) return `${Math.max(1, Math.round(hours))} h`

  const days = Math.round((hours / 24) * 10) / 10
  return `${days.toLocaleString('pt-BR')} ${days === 1 ? 'dia' : 'dias'}`
}

export function hoursBetween(start, end) {
  return (new Date(end).getTime() - new Date(start).getTime()) / HOUR
}

export function isWithinDays(value, days, now = new Date()) {
  return Boolean(value) && now.getTime() - new Date(value).getTime() <= days * DAY
}

// "03/11" (dia/mês), para eixos de gráfico
export function formatShortDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// "03/11" a partir de "2026-11-03" (dia sem horário, sem passar por fuso)
export function formatDay(day) {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`
}

// "2026-11-03": o dia em Campo Grande, o mesmo fuso em que o índice é apurado
export function dayInCampoGrande(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Campo_Grande' }).format(date)
}

// "14:07", no horário de quem está vendo
export function formatTime(value) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
