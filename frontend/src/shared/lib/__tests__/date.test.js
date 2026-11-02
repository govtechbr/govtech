import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonths,
  clampIsoDay,
  formatIsoDay,
  formatLongDay,
  formatMonthYear,
  isIsoDay,
  monthWeeks,
  todayIso,
} from '@/shared/lib/date'

describe('dias ISO', () => {
  it('reconhece só datas válidas', () => {
    expect(isIsoDay('2026-02-28')).toBe(true)
    expect(isIsoDay('2026-02-30')).toBe(false)
    expect(isIsoDay('20/12/2026')).toBe(false)
    expect(isIsoDay('')).toBe(false)
  })

  it('usa o dia local para "hoje"', () => {
    expect(todayIso(new Date(2026, 10, 2, 23, 30))).toBe('2026-11-02')
  })

  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('soma meses sem pular para o mês seguinte', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('limita o dia entre min e max', () => {
    expect(clampIsoDay('2026-01-01', '2026-02-01', '2026-03-01')).toBe('2026-02-01')
    expect(clampIsoDay('2026-04-01', '2026-02-01', '2026-03-01')).toBe('2026-03-01')
    expect(clampIsoDay('2026-02-10', undefined, undefined)).toBe('2026-02-10')
  })

  it('monta as semanas do mês começando no domingo', () => {
    const weeks = monthWeeks('2026-11-18')

    expect(weeks).toHaveLength(5)
    expect(weeks[0][0]).toBe('2026-11-01')
    expect(weeks[4].filter(Boolean).at(-1)).toBe('2026-11-30')
    expect(weeks[4].slice(2)).toEqual([null, null, null, null, null])
  })

  it('formata em pt-BR', () => {
    expect(formatIsoDay('2026-12-20')).toBe('20/12/2026')
    expect(formatLongDay('2026-12-20')).toBe('20 de dezembro de 2026')
    expect(formatMonthYear('2026-12-20')).toBe('dezembro de 2026')
  })
})
