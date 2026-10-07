/**
 * Scheduling arithmetic for the compare grid.
 *
 * Given, for each hour of a reference day, how many people are inside their own
 * working hours, find the runs worth proposing as a meeting. Kept separate from
 * the view so the rules can be tested on their own — and so the grid and any
 * future export agree on what "a good time" means.
 */

export type OverlapWindow = {
  /** Inclusive start hour in the reference zone, 0-23. */
  start: number
  /** Exclusive end hour. */
  end: number
  /** The smallest number of people working in any hour of the run. */
  shared: number
  /** Everyone is working in every hour of the run. */
  perfect: boolean
  quality: 'perfect' | 'good' | 'thin'
}

const RANK = { perfect: 0, good: 1, thin: 2 }

export function findWindows(
  perHour: readonly number[],
  rowCount: number,
  limit = 4,
): OverlapWindow[] {
  if (rowCount <= 0 || perHour.length === 0) return []
  const runs: OverlapWindow[] = []
  let start = -1

  const close = (endExclusive: number) => {
    const slice = perHour.slice(start, endExclusive)
    const shared = Math.min(...slice)
    const ratio = shared / rowCount
    runs.push({
      start,
      end: endExclusive,
      shared,
      perfect: shared === rowCount,
      quality: shared === rowCount ? 'perfect' : ratio >= 0.6 ? 'good' : 'thin',
    })
    start = -1
  }

  for (let hour = 0; hour <= perHour.length; hour++) {
    const active = hour < perHour.length && perHour[hour] > 0
    if (active && start < 0) start = hour
    if (!active && start >= 0) close(hour)
  }

  return runs
    .sort(
      (a, b) =>
        RANK[a.quality] - RANK[b.quality] ||
        b.shared - a.shared ||
        b.end - b.start - (a.end - a.start) ||
        a.start - b.start,
    )
    .slice(0, limit)
}

/** 0-100 — how usable a single hour is, for the heat strip under the grid. */
export function overlapScore(shared: number, rowCount: number): number {
  if (rowCount <= 0) return 0
  return Math.round((Math.min(shared, rowCount) / rowCount) * 100)
}

/** A plain-English verdict for the moment under the scan line. */
export function describeOverlap(shared: number, rowCount: number): string {
  if (rowCount === 0) return 'nothing to compare'
  if (shared === rowCount) return 'everyone is at work'
  if (shared === 0) return 'nobody is at work'
  if (shared === 1) return 'one person is at work'
  return `${shared} of ${rowCount} are at work`
}
