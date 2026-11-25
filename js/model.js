// @ts-check
/**
 * Warming Clock calculations. Pure functions (no page, no network), unit tested in test/model.test.js.
 * Temperatures arrive as differences from the 1991-2020 average; adding Copernicus's offset (0.88°C) gives warming
 * above pre-industrial times (1850-1900), which is what the Paris limits are measured against. Only yearly and
 * 12-month averages get the offset (single months use slightly different ones).
 */

/** @typedef {{ y: number, m: number, v: number }} Month  one monthly value: year, month (1-12), °C vs 1991-2020 */

/**
 * Monthly rows from the CSV ("1940-01", "0.12"), cleaned and sorted.
 * @param {Record<string, string>[]} rows
 * @param {string} code
 * @returns {Month[]}
 */
export function monthlySeries(rows, code) {
  return rows
    .filter((r) => r.code === code && /^\d{4}-\d{2}$/.test(r.month ?? "") && r.temperature_anomaly !== "" && Number.isFinite(Number(r.temperature_anomaly)))
    .map((r) => ({ y: Number(r.month.slice(0, 4)), m: Number(r.month.slice(5)), v: Number(r.temperature_anomaly) }))
    .sort((a, b) => a.y - b.y || a.m - b.m);
}

/**
 * The average of the last 12 months, and the year before that, both above pre-industrial times.
 * @param {Month[]} months
 * @param {number} offset
 * @returns {{ value: number, prev: number | null, from: Month, to: Month } | null}
 */
export function last12(months, offset) {
  if (months.length < 12) return null;
  const avg = (/** @type {Month[]} */ ms) => ms.reduce((s, x) => s + x.v, 0) / ms.length + offset;
  const last = months.slice(-12), prev = months.length >= 24 ? months.slice(-24, -12) : null;
  return { value: avg(last), prev: prev ? avg(prev) : null, from: last[0], to: last[11] };
}

/**
 * Yearly averages above pre-industrial times, complete years only.
 * @param {Month[]} months
 * @param {number} offset
 * @returns {Record<number, number>}
 */
export function annualMeans(months, offset) {
  /** @type {Record<number, number[]>} */
  const byYear = {};
  for (const x of months) (byYear[x.y] ??= []).push(x.v);
  /** @type {Record<number, number>} */
  const out = {};
  for (const [y, vs] of Object.entries(byYear)) if (vs.length === 12) out[Number(y)] = vs.reduce((s, v) => s + v, 0) / 12 + offset;
  return out;
}

/**
 * Long-term warming: the straight line through the last `years` complete years (least squares). Its value today
 * smooths out El Niño years and the like, the way the Paris limits are meant (long-term averages, not single years).
 * @param {Record<number, number>} annual
 * @param {number} years
 * @returns {{ slope: number, at: (t: number) => number, from: number, to: number }}  slope in °C per year; `at` takes a
 *   fractional year (2026.9) and gives the warming level on the line
 */
export function warmingTrend(annual, years) {
  const all = Object.keys(annual).map(Number).sort((a, b) => a - b);
  const ys = all.slice(-years);
  const n = ys.length, mx = ys.reduce((s, y) => s + y, 0) / n, my = ys.reduce((s, y) => s + annual[y], 0) / n;
  const slope = ys.reduce((s, y) => s + (y - mx) * (annual[y] - my), 0) / ys.reduce((s, y) => s + (y - mx) ** 2, 0);
  // A year's average belongs to its middle (mid-year), so the line passes through (year + 0.5, value)
  return { slope, at: (t) => my + slope * (t - (mx + 0.5)), from: ys[0], to: ys[n - 1] };
}

/**
 * When the long-term line reaches a limit, as a fractional year (in the past if already reached); null if warming
 * isn't rising.
 * @param {{ slope: number, at: (t: number) => number }} trend
 * @param {number} limit  °C above pre-industrial
 */
export function crossingYear(trend, limit) {
  if (!(trend.slope > 0)) return null;
  return 2000 + (limit - trend.at(2000)) / trend.slope;
}

/**
 * How many of the hottest years on record fall in the most recent ones.
 * @param {Record<number, number>} annual
 * @param {number} [top]     how many hottest years to look at
 * @param {number} [recent]  how many recent years count
 * @returns {{ n: number, top: number, recent: number, hottest: number }}
 */
export function hottestYears(annual, top = 10, recent = 10) {
  const years = Object.keys(annual).map(Number);
  const latest = Math.max(...years);
  const ranked = years.slice().sort((a, b) => annual[b] - annual[a]);
  const n = ranked.slice(0, top).filter((y) => y > latest - recent).length;
  return { n, top, recent, hottest: ranked[0] };
}

/**
 * A country's latest complete year: how far above its 1991-2020 normal, and the year before.
 * @param {Record<number, number>} series  yearly °C vs 1991-2020
 * @param {number} year  the current year (left out: it isn't complete)
 */
export function countryEntry(series, year) {
  const years = Object.keys(series).map(Number).filter((y) => y < year).sort((a, b) => a - b);
  if (!years.length) return null;
  const last = years[years.length - 1];
  const hottest = years.reduce((h, y) => (series[y] > series[h] ? y : h), years[0]);
  return { lastYear: last, value: series[last], prev: series[last - 1] ?? null, hottest, years, series };
}

/**
 * Split a number of seconds into years (of 365.25 days), days, hours, minutes and seconds, for the countdown.
 * @param {number} sec
 */
export function splitTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const year = 365.25 * 86400;
  const y = Math.floor(s / year), rest = s - Math.floor(y * year);
  return { y, d: Math.floor(rest / 86400), h: Math.floor((rest % 86400) / 3600), m: Math.floor((rest % 3600) / 60), s: rest % 60 };
}
