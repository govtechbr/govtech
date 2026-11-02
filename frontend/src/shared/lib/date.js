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
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`
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

// "02/11/2026 14:07", no horário de quem está vendo
export function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "14:07", no horário de quem está vendo
export function formatTime(value) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ---- Dias no formato ISO "YYYY-MM-DD" (contrato do campo de data) ----
// As contas usam UTC para não sofrer com horário de verão; "hoje" usa o fuso de quem vê.

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

function isoToUtc(day) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, date))
}

function utcToIso(date) {
  return date.toISOString().slice(0, 10)
}

export function isIsoDay(value) {
  return typeof value === 'string' && ISO_DAY.test(value) && utcToIso(isoToUtc(value)) === value
}

export function todayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${date}`
}

export function addDays(day, amount) {
  const date = isoToUtc(day)
  date.setUTCDate(date.getUTCDate() + amount)
  return utcToIso(date)
}

// Mesmo dia no outro mês; se ele não existir (31/01 + 1 mês), o último dia do mês
export function addMonths(day, amount) {
  const date = isoToUtc(day)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return utcToIso(target)
}

// Mantém o dia entre min e max (strings ISO se comparam em ordem)
export function clampIsoDay(day, min, max) {
  if (min && day < min) return min
  if (max && day > max) return max
  return day
}

export function startOfMonth(day) {
  return `${day.slice(0, 7)}-01`
}

// Semanas do mês (domingo a sábado); dias de fora do mês vêm como null
export function monthWeeks(day) {
  const first = isoToUtc(startOfMonth(day))
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate()
  const cells = [
    ...Array(first.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(utcToIso(first), index)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7))
}

// "20/12/2026"
export function formatIsoDay(day) {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`
}

// "20 de dezembro de 2026"
export function formatLongDay(day) {
  return isoToUtc(day).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// "dezembro de 2026"
export function formatMonthYear(day) {
  return isoToUtc(day).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const WEEKDAYS = [
  { short: 'D', long: 'domingo' },
  { short: 'S', long: 'segunda-feira' },
  { short: 'T', long: 'terça-feira' },
  { short: 'Q', long: 'quarta-feira' },
  { short: 'Q', long: 'quinta-feira' },
  { short: 'S', long: 'sexta-feira' },
  { short: 'S', long: 'sábado' },
]
