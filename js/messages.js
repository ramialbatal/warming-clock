// @ts-check
/**
 * Warming Clock: the plain-language messages shown to visitors. Pure functions, unit tested.
 * Every message has a tone ("ok", "warn" or "bad": green, amber or red), a short title and, where useful, one
 * sentence. Keep them short, concrete and free of jargon; numbers and method details belong behind "More".
 * Temperatures are compared as displayed (two decimals for the world, one for countries).
 */
import { shown, shownSign, fmt, message, t, addStrings, isRtl } from "clock-core";
import en from "./i18n/en.js";

addStrings("en", en);   // the English words; app.js adds the visitor's language on top

/** @typedef {import("clock-core").Tone} Tone */
/** @typedef {import("clock-core").Message} Message */

/** Kept as one left-to-right piece inside right-to-left text, so the sign stays in front. @param {string} s */
const iso = (s) => (isRtl() ? `\u2066${s}\u2069` : s);

/** A limit or level without a sign: "1.5°C". @param {number} c @param {0|1|2} [d] */
export const limitText = (c, d = 1) => iso(`${fmt[d].format(c)}${t("u.deg")}`);

/** A measured warming with its sign: "+1.51°C", in the visitor's language. @param {number} c @param {0|1|2} [d] */
export const deg = (c, d = 2) => iso(`${c > 0 && shown(c, d) > 0 ? "+" : ""}${fmt[d].format(shown(c, d))}${t("u.deg")}`);

/**
 * The one-line answer at the top.
 * @param {number} level    long-term warming today (the trend line), °C above pre-industrial
 * @param {number} recent   the last 12 months' average, °C above pre-industrial
 * @param {number | null} cross  when the long-term line passes 1.5°C (fractional year), or null
 * @param {number} limit    the safer Paris limit (1.5)
 * @returns {Message}
 */
export function headline(level, recent, cross, limit) {
  const year = cross == null ? "" : String(Math.floor(cross));
  if (shown(level, 2) >= limit) return message("bad", t("msg.head.passed.t", { limit: limitText(limit) }), t("msg.head.passed.x", { level: deg(level) }));
  if (shown(recent, 2) >= limit) return message("bad", t("msg.head.year.t", { limit: limitText(limit) }), t("msg.head.year.x", { recent: deg(recent), year }));
  if (cross != null) return message("bad", t("msg.head.soon.t", { limit: limitText(limit) }), t("msg.head.soon.x", { level: deg(level), year }));
  return message("warn", t("msg.head.below.t", { limit: limitText(limit) }), t("msg.head.below.x", { level: deg(level) }));
}

/**
 * One of the Paris limits: how close long-term warming is, and when it passes at today's pace.
 * @param {number} level
 * @param {number} limit
 * @param {number | null} cross
 * @param {number} now  the current fractional year
 * @returns {Message}
 */
export function limitStatus(level, limit, cross, now) {
  const year = cross == null ? "" : String(Math.floor(cross));
  const text = cross == null ? t("msg.limit.flat", { level: deg(level) })
    : cross <= now ? t("msg.limit.past", { level: deg(level), year }) : t("msg.limit.when", { level: deg(level), year });
  const p = shown((level / limit) * 100, 0);
  if (shown(level, 2) >= limit) return message("bad", t("msg.limit.passed"), text);
  if (p >= 90) return message("bad", t("msg.limit.almost"), text);
  return message("warn", t("msg.limit.part", { pct: fmt[0].format(p) }), text);
}

/**
 * How many of the hottest years on record were among the most recent ones.
 * @param {{ n: number, top: number, recent: number, hottest: number }} h
 * @returns {Message}
 */
export function hottestStatus(h) {
  const tone = h.n * 10 >= h.top * 7 ? "bad" : h.n * 2 >= h.top ? "warn" : "ok";
  return message(tone, t("msg.hot.t", { n: h.n, top: h.top }), t("msg.hot.x", { recent: h.recent, year: h.hottest }));
}

/**
 * Badge for a country: hotter or cooler than its 1991-2020 normal, as displayed (one decimal).
 * @param {number} anomaly  °C vs 1991-2020
 * @returns {{ tone: Tone, label: string }}
 */
export function countryBadge(anomaly) {
  const s = shownSign(anomaly, 1);
  return s > 0 ? { tone: "bad", label: t("msg.badge.hot") } : s < 0 ? { tone: "ok", label: t("msg.badge.cool") } : { tone: "warn", label: t("msg.badge.normal") };
}
