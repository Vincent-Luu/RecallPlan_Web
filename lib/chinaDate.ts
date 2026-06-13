/**
 * UTC+8 (Asia/Shanghai) timezone utilities.
 *
 * Vercel reserves the `TZ` environment variable (AWS Lambda default = UTC),
 * so `chinaNow()` auto-detects the host offset at each call and adjusts to
 * UTC+8.  `todayStr()` uses `Intl.DateTimeFormat` with an explicit timeZone
 * and is the canonical reference for "what day is it in China."
 *
 * China observes no DST, making the target +8 h a constant.
 */

const CHINA_OFFSET_MINUTES = 8 * 60; // UTC+8

/**
 * Return a Date adjusted to behave as if the system timezone were UTC+8.
 *
 * On a machine already in China (UTC+8) this is a zero-cost pass-through;
 * on a UTC server (Vercel, Docker) it applies the needed +8 h shift so that
 * downstream date-fns operations (`format`, `subDays`, `startOfMonth`, etc.)
 * produce correct results.
 */
export function chinaNow(): Date {
  const offsetMinutes = new Date().getTimezoneOffset(); // e.g. 0 for UTC, -480 for UTC+8
  const adjustMs = (CHINA_OFFSET_MINUTES + offsetMinutes) * 60 * 1000;
  return new Date(Date.now() + adjustMs);
}

/**
 * Today's date as "YYYY-MM-DD" in Asia/Shanghai.
 * Uses Intl.DateTimeFormat with explicit timeZone — always correct.
 */
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
