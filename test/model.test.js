// Unit tests for the Warming Clock calculations. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { monthlySeries, last12, annualMeans, warmingTrend, crossingYear, hottestYears, countryEntry, splitTime } from "../js/model.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
/** Months from a list of [year, month, value] */
const ms = (/** @type {[number, number, number][]} */ list) => list.map(([y, m, v]) => ({ y, m, v }));

test("monthlySeries keeps one place's clean months, sorted", () => {
  const rows = [
    { code: "OWID_WRL", month: "2026-02", temperature_anomaly: "0.5" },
    { code: "OWID_WRL", month: "2026-01", temperature_anomaly: "0.4" },
    { code: "OWID_WRL", month: "2026-03", temperature_anomaly: "" },
    { code: "USA", month: "2026-01", temperature_anomaly: "9" },
  ];
  assert.deepEqual(monthlySeries(rows, "OWID_WRL"), [{ y: 2026, m: 1, v: 0.4 }, { y: 2026, m: 2, v: 0.5 }]);
});

test("last12 and annualMeans add the pre-industrial offset; partial years are left out", () => {
  const months = ms([...Array.from({ length: 12 }, (_, i) => /** @type {[number, number, number]} */ ([2025, i + 1, 0.5])),
    ...Array.from({ length: 10 }, (_, i) => /** @type {[number, number, number]} */ ([2026, i + 1, 0.7]))]);
  const r = last12(months, 0.88);
  close(/** @type {number} */ (r?.value), (2 * 0.5 + 10 * 0.7) / 12 + 0.88);
  assert.equal(r?.prev, null);
  assert.deepEqual([r?.from, r?.to], [{ y: 2025, m: 11, v: 0.5 }, { y: 2026, m: 10, v: 0.7 }]);
  assert.deepEqual(Object.keys(annualMeans(months, 0.88)), ["2025"]);
  close(annualMeans(months, 0.88)[2025], 1.38);
});

test("warmingTrend: a straight line through mid-year values; crossingYear finds when it reaches a limit", () => {
  /** @type {Record<number, number>} */
  const annual = {};
  for (let y = 1990; y <= 2025; y++) annual[y] = 1 + 0.03 * (y - 2000);   // 0.3°C a decade, 1°C in 2000
  const tr = warmingTrend(annual, 30);
  close(tr.slope, 0.03);
  close(tr.at(2000.5), 1);
  close(/** @type {number} */ (crossingYear(tr, 1.5)), 2000.5 + 0.5 / 0.03);
  assert.equal(crossingYear(warmingTrend({ 2000: 1, 2001: 1, 2002: 1 }, 30), 1.5), null);
});

test("hottestYears counts the record years among the recent ones", () => {
  /** @type {Record<number, number>} */
  const annual = {};
  for (let y = 1990; y <= 2025; y++) annual[y] = y === 2010 ? 2 : 0.5 + (y - 1990) * 0.02;   // a record in 2010, outside the last 10 years
  assert.deepEqual(hottestYears(annual, 10, 10), { n: 9, top: 10, recent: 10, hottest: 2010 });
});

test("countryEntry uses the latest complete year and finds the hottest", () => {
  const e = countryEntry({ 2023: 0.9, 2024: 1.4, 2025: 1.1, 2026: 2 }, 2026);
  assert.deepEqual([e?.lastYear, e?.value, e?.prev, e?.hottest], [2025, 1.1, 1.4, 2024]);
  assert.equal(countryEntry({ 2026: 1 }, 2026), null);
});

test("splitTime for the countdown", () => {
  assert.deepEqual(splitTime(365.25 * 86400 + 2 * 86400 + 3 * 3600 + 4 * 60 + 5), { y: 1, d: 2, h: 3, m: 4, s: 5 });
  assert.deepEqual(splitTime(-5), { y: 0, d: 0, h: 0, m: 0, s: 0 });
});
