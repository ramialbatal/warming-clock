// Translations are complete and safe: every language has every key, the same {placeholders}, and keeps the ids and
// data- attributes the code fills in (so a translated paragraph still shows its live numbers). Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import en from "../js/i18n/en.js";
import fr from "../js/i18n/fr.js";
import es from "../js/i18n/es.js";
import ar from "../js/i18n/ar.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
/** Keys the page marks with data-i18n / data-i18n-attr (clock-core translates its own "core." keys). */
const pageKeys = [...new Set([
  ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]),
  ...[...html.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap((m) => m[1].split(";").map((p) => p.split(":")[1].trim())),
])].filter((k) => !k.startsWith("core."));
/** Keys a language may leave in English (the formulas read left to right with Latin symbols). */
const optional = { ar: ["m.formula"] };

/** The English inner HTML of the element marked data-i18n="key". @param {string} key */
function englishOf(key) {
  const at = html.indexOf(`data-i18n="${key}"`);
  const open = html.lastIndexOf("<", at), tag = /^<([a-z0-9]+)/i.exec(html.slice(open))?.[1] ?? "";
  let i = html.indexOf(">", at) + 1, depth = 1;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  re.lastIndex = i;
  for (let m; (m = re.exec(html));) { depth += m[1] ? -1 : 1; if (!depth) return html.slice(i, m.index); }
  return "";
}
/** ids and data- attribute names inside some HTML; the gas's name may use data-gas-label or data-gas-text. */
const slots = (/** @type {string} */ s) => [...s.matchAll(/\b(id="[^"]+"|data-[a-z-]+)/g)]
  .map((m) => m[1].replace("data-gas-text", "data-gas-label")).sort().join(" ");
const holes = (/** @type {string} */ s) => (s.match(/\{\w+\}/g) ?? []).sort().join();

for (const [code, table] of Object.entries({ fr, es, ar })) {
  test(`${code}: has every key, with the same placeholders and slots as English`, () => {
    const skip = optional[/** @type {keyof typeof optional} */ (code)] ?? [];
    for (const k of [...Object.keys(en), ...pageKeys]) {
      if (skip.includes(k)) continue;
      assert.ok(Object.hasOwn(table, k), `${code} is missing ${k}`);
    }
    // An empty string means "this form doesn't exist in this language" (French has no "trillion"; see money() in app.js)
    for (const k of Object.keys(en)) if (table[k] !== "") assert.equal(holes(table[k]), holes(en[k]), `${code} ${k}: placeholders`);
    for (const k of pageKeys) {
      if (!Object.hasOwn(table, k) || !html.includes(`data-i18n="${k}"`)) continue;
      assert.equal(slots(table[k]), slots(englishOf(k)), `${code} ${k}: ids and data- attributes`);
    }
    const unknown = Object.keys(table).filter((k) => !Object.hasOwn(en, k) && !pageKeys.includes(k) && !k.startsWith("gas."));
    assert.deepEqual(unknown, [], `${code} has keys nothing uses`);
  });
}
