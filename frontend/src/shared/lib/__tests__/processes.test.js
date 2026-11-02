import { describe, expect, it } from 'vitest'

import { PROCESS_AREAS, areaCriteria, areaScore } from '@/shared/lib/processes'
import { SCORE_CRITERIA } from '@/shared/lib/governanceScore'

const area = (key) => PROCESS_AREAS.find((item) => item.key === key)

describe('processes mapping (rules C2, C3)', () => {
  it('feeds each index criterion into exactly one area (C2)', () => {
    const mapped = PROCESS_AREAS.flatMap((item) => item.criteria)

    expect([...mapped].sort()).toEqual(SCORE_CRITERIA.map(({ key }) => key).sort())
  })

  it('uses the score of the only criterion of an area', () => {
    expect(areaScore(area('ver'), { review: 50 })).toBe(50)
    expect(areaScore(area('cm'), { protection: 0 })).toBe(0)
  })

  it('weights the criteria of an area with the index weights (C3)', () => {
    // flow (peso 20) e deadline (peso 20): média simples
    expect(areaScore(area('pmc'), { flow: 100, deadline: 50 })).toBe(75)
  })

  it('ignores a criterion without data and rescales the weights (C3)', () => {
    expect(areaScore(area('pmc'), { flow: 80, deadline: null })).toBe(80)
  })

  it('is null when no criterion of the area has data, never zero (C3)', () => {
    expect(areaScore(area('ma'), { leadTime: null })).toBeNull()
    expect(areaScore(area('ma'), {})).toBeNull()
  })

  it('lists the criteria of an area with weight and score', () => {
    expect(areaCriteria(area('pmc'), { flow: 100 })).toEqual([
      { key: 'flow', label: 'Fluxo de PRs', weight: 20, score: 100 },
      { key: 'deadline', label: 'Prazo', weight: 20, score: null },
    ])
  })
})
