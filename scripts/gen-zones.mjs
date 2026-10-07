/**
 * Emits src/data/zones.ts — the IANA zone list baked from the build machine's
 * ICU data. It is only a fallback: at runtime we prefer the browser's own
 * `Intl.supportedValuesOf('timeZone')` so the app tracks the device's tzdata.
 *
 *   node scripts/gen-zones.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../src/data/zones.ts')

const zones = Intl.supportedValuesOf('timeZone').sort()
const icu = process.versions.icu

const body = `/**
 * GENERATED — do not edit by hand.  \`node scripts/gen-zones.mjs\`
 * Source: Node ${process.versions.node}, ICU ${icu}. Used only when the browser
 * cannot enumerate zones itself; every offset is still read from the runtime.
 */
export const IANA_ZONES: readonly string[] = [
${zones.map((z) => `  '${z}',`).join('\n')}
]

export const IANA_ZONE_COUNT = ${zones.length}
`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, body, 'utf8')
console.log(`wrote ${zones.length} zones -> ${out}`)
