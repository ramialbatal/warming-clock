// Unit tests for the plain-language messages. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { headline, limitStatus, hottestStatus, countryBadge, deg } from "../js/messages.js";

test("deg shows a sign and the unit", () => {
  assert.equal(deg(1.512), "+1.51°C");
  assert.equal(deg(-0.04, 1), "0.0°C");   // shows as zero: no sign
  assert.equal(deg(1.5, 1), "+1.5°C");
});

test("headline: passed, a whole year above, close, or below", () => {
  const year = headline(1.45, 1.512, 2028.9, 1.5);
  assert.deepEqual([year.tone, year.title], ["bad", "The world has been 1.5°C hotter for a whole year"]);
  assert.equal(year.text, "The last 12 months averaged +1.51°C above pre-industrial times. At today's pace, the long-term average passes the Paris limit around 2028.");
  assert.equal(headline(1.5, 1.6, 2026.1, 1.5).title, "We've passed the 1.5°C limit");
  assert.equal(headline(1.45, 1.4, 2028.9, 1.5).title, "We're close to the 1.5°C limit");
  assert.equal(headline(1.2, 1.1, null, 1.5).tone, "warn");
  assert.equal(headline(1.4996, 1.4, 2026, 1.5).title, "We've passed the 1.5°C limit");   // shows as 1.50
});

test("limitStatus: how close, and when", () => {
  const near = limitStatus(1.45, 1.5, 2028.9, 2026.9);
  assert.deepEqual([near.tone, near.title], ["bad", "Almost reached"]);
  assert.equal(near.text, "Long-term warming is +1.45°C. At today's pace, this limit is passed around 2028.");
  const far = limitStatus(1.45, 2, 2047.4, 2026.9);
  assert.deepEqual([far.tone, far.title], ["warn", "73% of the way"]);
  assert.equal(limitStatus(1.6, 1.5, 2025.2, 2026.9).text, "Long-term warming is +1.60°C. This limit was passed around 2025.");
});

test("hottestStatus and countryBadge", () => {
  const h = hottestStatus({ n: 10, top: 10, recent: 10, hottest: 2024 });
  assert.deepEqual([h.tone, h.title, h.text], ["bad", "10 of the 10 hottest years", "were among the last 10. The hottest so far: 2024."]);
  assert.deepEqual(countryBadge(1.2), { tone: "bad", label: "▲ Hotter than normal" });
  assert.deepEqual(countryBadge(-0.3), { tone: "ok", label: "▼ Cooler than normal" });
  assert.deepEqual(countryBadge(0.04), { tone: "warn", label: "● Normal" });
});
