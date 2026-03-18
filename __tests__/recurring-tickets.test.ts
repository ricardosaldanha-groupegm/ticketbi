import { calculateNextRunDate } from '@/lib/recurring-tickets'

describe('recurring ticket helpers', () => {
  it('calculates next daily run date', () => {
    expect(calculateNextRunDate('2026-03-18', 'daily')).toBe('2026-03-19')
  })

  it('calculates next weekly run date', () => {
    expect(calculateNextRunDate('2026-03-18', 'weekly')).toBe('2026-03-25')
  })

  it('calculates next monthly run date', () => {
    expect(calculateNextRunDate('2026-03-18', 'monthly')).toBe('2026-04-18')
  })
})
