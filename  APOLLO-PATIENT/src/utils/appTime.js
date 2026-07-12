/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     CENTRAL TIME AUTHORITY — appTime.js                 ║
 * ║                                                                          ║
 * ║  THIS IS THE ONLY FILE IN THE ENTIRE CODEBASE ALLOWED TO CALL           ║
 * ║  new Date() FOR CURRENT-TIME LOGIC.                                      ║
 * ║                                                                          ║
 * ║  All timezone math is anchored to Asia/Kolkata (IST, UTC+5:30).         ║
 * ║  This file is byte-identical in APOLLO-PATIENT and DEMO-DAY.            ║
 * ║  Any change here MUST be mirrored to the other project immediately.      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * DO NOT call new Date() anywhere else in the codebase for "current time".
 * new Date(someExistingValue) to PARSE a known date/timestamp is fine.
 */

const IST = 'Asia/Kolkata';

// ─── Core: returns the current moment anchored to IST ────────────────────────

/**
 * Returns the current date/time as a JS Date object.
 * Use this everywhere you previously wrote `new Date()`.
 */
export function now() {
  return new Date();
}

/**
 * Returns today's date in YYYY-MM-DD format using Asia/Kolkata timezone.
 * This is the ONLY correct way to get "today's date string" for Firestore queries.
 *
 * ⚠️  Do NOT use: new Date().toISOString().split('T')[0]
 *     That returns UTC date, which is yesterday before 5:30 AM IST.
 */
export function todayDateString() {
  const now = new Date();
  // Use Intl.DateTimeFormat which correctly handles DST and full IANA tz
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date as a long human-readable string in IST.
 * Example: "Thursday, 10 July 2026"
 */
export function todayDisplayLong() {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: IST,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns today's date as a short human-readable string in IST.
 * Example: "10 Jul 2026"
 */
export function todayDisplayShort() {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns the current IST hour (0–23).
 * Use this for greeting logic: "Good Morning / Afternoon / Evening".
 *
 * ⚠️  Do NOT use: new Date().getHours()
 *     That returns browser-local hour, which varies between laptops.
 */
export function nowHour() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  return parseInt(parts.find(p => p.type === 'hour').value, 10);
}

// ─── Display formatters for stored date/timestamp values ─────────────────────

/**
 * Formats a stored YYYY-MM-DD date string to a human-readable display.
 * Parses in a way that avoids UTC midnight off-by-one issues.
 *
 * Example: "2026-07-10" → "Fri, 10 Jul 2026"
 */
export function formatDateStringDisplay(dateStr, options = {}) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  // Parse YYYY-MM-DD as local noon to avoid midnight UTC boundary issues
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  // Create a date at local noon so no timezone can push it to a different day
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return date.toLocaleDateString('en-IN', {
    timeZone: IST,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Formats a Firestore Timestamp or JS Date to a human-readable string in IST.
 * Example: "10 Jul · 02:30 PM"
 */
export function formatTimestampDisplay(timestamp) {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const datePart = date.toLocaleDateString('en-IN', {
      timeZone: IST,
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-IN', {
      timeZone: IST,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  } catch {
    return '';
  }
}

// ─── Computation helpers ──────────────────────────────────────────────────────

/**
 * Returns the number of calendar days between a YYYY-MM-DD string and today (IST).
 * Positive = future, negative = past, 0 = today.
 * Use this instead of manually subtracting new Date() values.
 */
export function daysBetween(dateStr) {
  if (!dateStr) return 0;
  const today = todayDateString();
  const [ty, tm, td] = today.split('-').map(Number);
  const [fy, fm, fd] = dateStr.split('-').map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);
  const futureMs = Date.UTC(fy, fm - 1, fd);
  return Math.round((futureMs - todayMs) / (1000 * 60 * 60 * 24));
}

/**
 * Returns the next N days (default 7) as structured date objects, in IST.
 * Each object has:
 *   - dateString: "YYYY-MM-DD"
 *   - dayLabel: "Mon"
 *   - dateLabel: 10  (number)
 *   - monthLabel: "Jul"
 *   - fullDateString: "Mon, 10 Jul"
 *
 * Use this in DoctorProfile slot picker and anywhere a date range is needed.
 *
 * ⚠️  Do NOT generate date ranges with new Date() + setDate() — that uses
 *     browser-local timezone and produces wrong dates on UTC machines.
 */
export function getNext7DaysIST(count = 7) {
  const result = [];
  const todayStr = todayDateString(); // guaranteed IST
  const [sy, sm, sd] = todayStr.split('-').map(Number);

  for (let i = 0; i < count; i++) {
    // Build each date at local noon to avoid any midnight boundary issues
    const d = new Date(sy, sm - 1, sd + i, 12, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dayLabel = d.toLocaleDateString('en-IN', { timeZone: IST, weekday: 'short' });
    const dateLabel = d.getDate();
    const monthLabel = d.toLocaleDateString('en-IN', { timeZone: IST, month: 'short' });

    result.push({
      dateString,
      dayLabel,
      dateLabel,
      monthLabel,
      fullDateString: `${dayLabel}, ${dateLabel} ${monthLabel}`,
    });
  }
  return result;
}

/**
 * Returns whether a given YYYY-MM-DD string is today in IST.
 */
export function isToday(dateStr) {
  return dateStr === todayDateString();
}

/**
 * Returns whether a given YYYY-MM-DD string is yesterday in IST.
 */
export function isYesterday(dateStr) {
  const [ty, tm, td] = todayDateString().split('-').map(Number);
  const yesterday = new Date(ty, tm - 1, td - 1, 12, 0, 0);
  const yyy = yesterday.getFullYear();
  const yym = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yyd = String(yesterday.getDate()).padStart(2, '0');
  return dateStr === `${yyy}-${yym}-${yyd}`;
}
