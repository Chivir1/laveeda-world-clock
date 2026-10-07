/**
 * Data sanity check for the catalogue — run it with `npm run check`.
 *
 * Rules that actually matter:
 *  - the runtime must accept every zone id we ship
 *  - ids unique and url-safe, coordinates inside their legal ranges
 *  - every region key exists, every starter id resolves
 *  - the "interesting" zones (half- and quarter-hour offsets) really do have
 *    half- and quarter-hour offsets, so the notes we print are not lies
 */
const zones = new Set(Intl.supportedValuesOf('timeZone'))
const { CITIES, STARTER_CITIES, REGIONS } = await import('../src/data/cities.ts')

const problems = []
const ids = new Set()

const at = (iso) => new Date(iso)
const wallMinutes = (tz, iso) => {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at(iso))
  const h = +p.find((x) => x.type === 'hour').value
  const m = +p.find((x) => x.type === 'minute').value
  return (h - 12) * 60 + m
}

for (const c of CITIES) {
  if (ids.has(c.id)) problems.push(`duplicate id ${c.id}`)
  ids.add(c.id)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(c.id)) problems.push(`${c.id}: id must be url-safe`)
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: c.tz })
  } catch {
    problems.push(`${c.id}: the runtime rejects zone ${c.tz}`)
    continue
  }
  if (!(c.lat >= -90 && c.lat <= 90)) problems.push(`${c.id}: latitude ${c.lat} out of range`)
  if (!(c.lng >= -180 && c.lng <= 180)) problems.push(`${c.id}: longitude ${c.lng} out of range`)
  if (!REGIONS[c.region]) problems.push(`${c.id}: unknown region "${c.region}"`)
  if (!Number.isFinite(c.popM) || c.popM < 0) problems.push(`${c.id}: bad metro size`)
  if (!c.name || !c.country || !/^[A-Z]{2}$/.test(c.cc)) problems.push(`${c.id}: missing display fields`)
  for (const [key, value] of Object.entries(c)) {
    if (typeof value === 'string' && /\s{2,}|[«»]|duplicate|TODO/.test(value))
      problems.push(`${c.id}: suspicious text in ${key}: "${value}"`)
  }
}

for (const starter of STARTER_CITIES) {
  if (!ids.has(starter)) problems.push(`starter city "${starter}" is not in the catalogue`)
}

const distinctZones = [...new Set(CITIES.map((c) => c.tz))]
const fractional = distinctZones.filter((tz) => {
  const a = wallMinutes(tz, '2026-06-21T12:00:00Z')
  const b = wallMinutes(tz, '2026-12-21T12:00:00Z')
  return a % 60 !== 0 || b % 60 !== 0
})

const dstShiftable = distinctZones.filter(
  (tz) => wallMinutes(tz, '2026-06-21T12:00:00Z') !== wallMinutes(tz, '2026-12-21T12:00:00Z'),
)

console.log(`cities: ${CITIES.length}`)
console.log(`distinct zones covered: ${distinctZones.length} of ${zones.size} the runtime knows`)
console.log(`fractional-hour zones: ${fractional.length ? fractional.join(', ') : 'NONE — expected at least a few'}`)
if (fractional.length < 6) problems.push('expected the half/quarter-hour zones (Kathmandu, Eucla, Chatham, Nepal…) to be present')
console.log(`zones that shift their clocks: ${dstShiftable.length}`)
console.log(`regions: ${[...new Set(CITIES.map((c) => c.region))].join(', ')}`)

if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):\n` + problems.join('\n'))
  process.exit(1)
}
console.log('\ndata OK')
