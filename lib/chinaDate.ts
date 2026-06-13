/**
 * UTC+8 (Asia/Shanghai) timezone utilities.
 *
 * The app targets Chinese users but may be deployed on servers in other
 * timezones.  All server-side date operations MUST use these helpers instead of
 * raw `new Date()`.
 *
 * ## Best-practice layering (strongest → fallback):
 * 1. Set `TZ=Asia/Shanghai` in deployment env vars — Node respects it globally,
 *    making `chinaNow()` a zero-cost pass-through.
 * 2. Auto-detect: `getTimezoneOffset()` tells us whether the host is already +8;
 *    if not we apply a manual +8 h shift so date-fns arithmetic & formatting
 *    produce UTC+8 results.
 * 3. `Intl.DateTimeFormat` with explicit `timeZone: 'Asia/Shanghai'` is used
 *    for pure date-string formatting as the canonical reference (no dependency
 *    on date-fns or system TZ).
 */

import { format as dfFormat } from "date-fns";
import type { FormatOptions } from "date-fns";

// ── Auto-detect ────────────────────────────────────────────────────────────
const SYSTEM_OFFSET_HOURS = -new Date().getTimezoneOffset() / 60;
const NEEDS_SHIFT = SYSTEM_OFFSET_HOURS !== 8;
const SHIFT_MS = NEEDS_SHIFT ? 8 * 60 * 60 * 1000 : 0;

if (NEEDS_SHIFT) {
  console.log(`[chinaDate] System TZ is UTC${SYSTEM_OFFSET_HOURS >= 0 ? '+' : ''}${SYSTEM_OFFSET_HOURS}, applying +8 h shift for Asia/Shanghai`);
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Return a Date representing "now" in UTC+8.
 *
 * On a UTC+8 machine (local dev, or when TZ=Asia/Shanghai is set) this is
 * equivalent to `new Date()`.  On other servers a +8 h shift is applied so
 * that downstream date-fns operations (`startOfMonth`, `addDays`, `format`,
 * etc.) behave as if the host timezone were Asia/Shanghai.
 */
export function chinaNow(): Date {
  return new Date(Date.now() + SHIFT_MS);
}

/**
 * Format a (possibly-shifted) date with date-fns.  Use together with
 * `chinaNow()` so that date-fns arithmetic and formatting produce UTC+8
 * results regardless of host timezone.
 */
export function formatChina(date: Date, fmt: string, options?: FormatOptions): string {
  return dfFormat(date, fmt, options);
}

/**
 * Today's date as "YYYY-MM-DD" in Asia/Shanghai.
 *
 * Uses `Intl.DateTimeFormat` with explicit `timeZone` — the most robust,
 * dependency-free approach — as the canonical reference.
 */
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
