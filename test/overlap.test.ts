import { describe, expect, it } from 'vitest'
import { describeOverlap, findWindows, overlapScore } from '../src/lib/overlap'

describe('meeting windows', () => {
  it('finds one contiguous run', () => {
    const windows = findWindows([0, 0, 2, 2, 2, 0, 0], 2)
    expect(windows).toHaveLength(1)
    expect(windows[0]).toMatchObject({ start: 2, end: 5, shared: 2, perfect: true, quality: 'perfect' })
  })

  it('ranks a window where everyone is working above a longer partial one', () => {
    // hours 1-3 have both people; hours 8-14 only one
    const windows = findWindows([0, 2, 2, 2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1], 2)
    expect(windows[0].perfect).toBe(true)
    expect(windows[0].start).toBe(1)
    expect(windows[1]).toMatchObject({ shared: 1, quality: 'thin' })
  })

  it('marks the middle tier as good, not thin', () => {
    const windows = findWindows([3, 3, 3, 0], 4)
    expect(windows[0].quality).toBe('good') // 3 of 4 = 75%
    expect(windows[0]).toMatchObject({ start: 0, end: 3, shared: 3, perfect: false })
  })

  it('returns nothing when no hour has anyone at work', () => {
    expect(findWindows([0, 0, 0], 3)).toEqual([])
    expect(findWindows([], 3)).toEqual([])
    expect(findWindows([1, 1], 0)).toEqual([])
  })

  it('splits runs on the gap and respects the limit', () => {
    const windows = findWindows([1, 0, 1, 0, 1, 0, 1, 0, 1], 1, 3)
    expect(windows).toHaveLength(3)
    expect(windows.map((w) => w.start)).toEqual([0, 2, 4])
  })

  it('scores overlap for the heat strip', () => {
    expect(overlapScore(0, 4)).toBe(0)
    expect(overlapScore(2, 4)).toBe(50)
    expect(overlapScore(4, 4)).toBe(100)
    expect(overlapScore(5, 4)).toBe(100)
    expect(overlapScore(1, 0)).toBe(0)
  })

  it('says it in words without a straight zero-divide', () => {
    expect(describeOverlap(0, 0)).toBe('nothing to compare')
    expect(describeOverlap(2, 2)).toBe('everyone is at work')
    expect(describeOverlap(0, 3)).toBe('nobody is at work')
    expect(describeOverlap(1, 3)).toBe('one person is at work')
    expect(describeOverlap(2, 3)).toBe('2 of 3 are at work')
  })
})
