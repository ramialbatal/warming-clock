// End-to-end smoke test: serves this repository locally, opens the page in headless Chromium at desktop
// and phone width, and checks that real data loads, counters tick, verdicts show, the header picture paints,
// nothing scrolls sideways, no em or en dashes reach the page, and no errors or warnings appear in the console.
// Settings come from the "smoke" field in package.json.
//
//   npm run smoke                        uses the pinned clock-core release from jsDelivr
//   CLOCK_CORE_DIR=../clock-core npm run smoke   serves clock-core from a local checkout instead
//
// Needs Playwright with Chromium (CI installs it; see .github/workflows/ci.yml).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, resolve, sep } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const pkg = JSON.parse(await readFile("package.json", "utf8"));
/** @type {{ ready?: string, ticking: string[], verdicts?: string[], hashes?: string[] }} */
const cfg = pkg.smoke;
const ROOT = resolve(".");
const CORE_DIR = process.env.CLOCK_CORE_DIR ? resolve(process.env.CLOCK_CORE_DIR) : null;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  const file = join(ROOT, path.endsWith("/") ? path + "index.html" : path);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] ?? "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end("not found"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", () => r(undefined)));
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/`;

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: "127.0.0.1,localhost" } } : {});
const failures = [];
const DASH = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");

// Every view in English, then each other language, then the embeddable widget (in a small frame).
const runs = [
  ...["", ...(cfg.hashes ?? [])].map((hash) => ({ query: "", hash, lang: "en" })),
  ...["fr", "es", "ar"].map((lang) => ({ query: `?lang=${lang}`, hash: "", lang })),
];
/** @type {string | null} ids on the English page, to compare the translations against */
let englishIds = null;
for (const { query, hash, lang } of runs) {
  for (const [w, h, label] of [[1280, 900, "desktop"], [375, 800, "phone"]]) {
    const name = `${label}${query}${hash}`;
    const ctx = await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // Errors and warnings both fail the test: the clocks warn when a configured country has no data.
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
    if (CORE_DIR) {
      await page.route(/cdn\.jsdelivr\.net\/gh\/ramialbatal\/clock-core@[^/]+\/(.+)$/, async (route) => {
        const file = route.request().url().replace(/^.*clock-core@[^/]+\//, "");
        route.fulfill({ body: await readFile(join(CORE_DIR, file)), contentType: TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] });
      });
    }
    await page.goto(base + query + hash);
    try {
      await page.waitForFunction(() => document.body.dataset.state === "ready", null, { timeout: 45000 });
    } catch {
      failures.push(`${name}: page never reached "ready" (state: ${await page.evaluate(() => document.body.dataset.state)}; ${await page.evaluate(() => document.getElementById("error-msg")?.textContent)})`);
      await ctx.close();
      continue;
    }
    await page.waitForTimeout(1500);
    const read = () => page.evaluate((sels) => sels.map((s) => document.querySelector(s)?.textContent ?? ""), cfg.ticking);
    const a = await read();
    await page.waitForTimeout(2500);
    const b = await read();
    cfg.ticking.forEach((s, i) => { if (a[i] === b[i]) failures.push(`${name}: ${s} did not tick (${a[i]})`); });
    for (const s of cfg.verdicts ?? []) {
      const v = await page.evaluate((sel) => document.querySelector(sel)?.textContent?.trim(), s);
      if (!v || v === "…") failures.push(`${name}: verdict ${s} is empty`);
    }
    // The shared stylesheet really applied (a CSS syntax error fails silently): the answer banner has its colour stripe.
    const styled = await page.evaluate(() => { const a = document.getElementById("answer"); return !a || parseFloat(getComputedStyle(a).borderTopWidth) > 0; });
    if (!styled) failures.push(`${name}: clock-core.css did not apply (answer banner has no colour stripe)`);
    // The picture behind the header painted (an error in the scene hides its canvas).
    const painted = await page.evaluate(() => {
      const c = document.querySelector("canvas.scene");
      if (!(c instanceof HTMLCanvasElement)) return true;
      const px = !c.hidden && c.width ? c.getContext("2d")?.getImageData(c.width >> 1, 4, 1, 1).data : null;
      return !!px && px[3] > 0;
    });
    if (!painted) failures.push(`${name}: the header picture (canvas.scene) did not paint`);
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollW > Number(w)) failures.push(`${name}: page is ${scrollW}px wide (horizontal scroll)`);
    const text = await page.evaluate(() => document.title + "\n" + document.body.innerText);
    if (DASH.test(text)) failures.push(`${name}: em or en dash in page text`);
    // Languages: the right one is on, right to left for Arabic, nothing left hidden or unfilled, same live slots.
    const lg = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir,
      pending: document.documentElement.hasAttribute("data-i18n"), ids: [...document.querySelectorAll("[id]")].map((e) => e.id).sort().join(" "),
      picker: !!document.querySelector(".lang-pick select"), embedBtn: !!document.querySelector(".embed-open"),
      act: !!document.querySelector(".act-open") }));
    if (lg.lang !== lang) failures.push(`${name}: page language is "${lg.lang}", expected "${lang}"`);
    if (lg.dir !== (lang === "ar" ? "rtl" : "ltr")) failures.push(`${name}: text direction is "${lg.dir}"`);
    if (lg.pending) failures.push(`${name}: page still hidden waiting for its translation`);
    if (!lg.picker) failures.push(`${name}: no language picker`);
    if (!lg.embedBtn) failures.push(`${name}: no "Put this clock on your website" button`);
    if (!lg.act) failures.push(`${name}: no "What can I do?" button`);
    if (/\{\w+\}/.test(text)) failures.push(`${name}: an unfilled {placeholder} shows on the page`);
    if (!hash && label === "desktop") {
      if (lang === "en") englishIds = lg.ids;
      else if (englishIds && lg.ids !== englishIds) failures.push(`${name}: the translated page lost or added elements with ids`);
    }
    errors.forEach((e) => failures.push(`${name}: console ${e}`));
    console.log(`ok   ${name}`);
    await ctx.close();
  }
}
// The widget other sites embed: answer and live number only, fits a small frame, links back to the full clock.
for (const lang of ["en", "ar"]) {
  const name = `embed ${lang}`;
  const ctx = await browser.newContext({ viewport: { width: 360, height: 300 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  if (CORE_DIR) {
    await page.route(/cdn\.jsdelivr\.net\/gh\/ramialbatal\/clock-core@[^/]+\/(.+)$/, async (route) => {
      const file = route.request().url().replace(/^.*clock-core@[^/]+\//, "");
      route.fulfill({ body: await readFile(join(CORE_DIR, file)), contentType: TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] });
    });
  }
  await page.goto(base + `?embed=1${lang === "en" ? "" : "&lang=" + lang}`);
  try {
    await page.waitForFunction(() => document.body.dataset.state === "ready", null, { timeout: 45000 });
    await page.waitForTimeout(1500);
    const e = await page.evaluate(() => ({
      title: document.getElementById("answer-title")?.textContent?.trim(),
      credit: /** @type {HTMLAnchorElement | null} */ (document.querySelector(".embed-credit"))?.href ?? "",
      gridShown: !!document.getElementById("grid")?.offsetParent,
      wide: document.documentElement.scrollWidth > innerWidth,
      bottom: Math.ceil(/** @type {HTMLElement} */ (document.querySelector(".embed-credit"))?.getBoundingClientRect().bottom ?? 9999),
    }));
    if (!e.title) failures.push(`${name}: no answer`);
    if (!e.credit || e.credit.includes("embed=")) failures.push(`${name}: no link back to the full clock (${e.credit})`);
    if (e.gridShown) failures.push(`${name}: the country list shows in the widget`);
    if (e.wide) failures.push(`${name}: the widget scrolls sideways`);
    if (e.bottom > 300) failures.push(`${name}: the widget is taller than its 300px frame (${e.bottom}px)`);
  } catch { failures.push(`${name}: never reached "ready"`); }
  errors.forEach((x) => failures.push(`${name}: console ${x}`));
  console.log(`ok   ${name}`);
  await ctx.close();
}
await browser.close();
server.close();
if (failures.length) {
  console.error("\nSmoke test failed:\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log("Smoke test passed.");
