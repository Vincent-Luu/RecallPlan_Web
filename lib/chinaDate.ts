/**
 * UTC+8 (Asia/Shanghai) timezone utilities.
 *
 * ## Deployment requirement
 * Set `TZ=Asia/Shanghai` in the deployment environment variables so Node.js
 * initializes its timezone to UTC+8 at process startup.  All `chinaNow()`
 * call-sites and date-fns operations then produce correct results without
 * any manual offset logic.
 *
 * `todayStr()` uses `Intl.DateTimeFormat` with an explicit timeZone parameter
 * and is therefore always correct regardless of host timezone — it serves as
 * the canonical reference for "what day is it in China."
 */

import { format as dfFormat } from "date-fns";
import type { FormatOptions } from "date-fns";

/**
 * Return a Date representing "now" in UTC+8.
 *
 * Requires `TZ=Asia/Shanghai` to be set at process startup.  On machines
 * already in the China timezone (local dev on Windows/macOS in China) this
 * is equivalent to `new Date()` without any extra configuration.
 */
export function chinaNow(): Date {
  return new Date();
}

/**
 * Today's date as "YYYY-MM-DD" in Asia/Shanghai.
 *
 * Uses `Intl.DateTimeFormat` with explicit `timeZone` — always correct,
 * regardless of host timezone or TZ env var.
 */
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
