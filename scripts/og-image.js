// Makes the link-preview picture (img/og-image.png, 1200x630): the clock as it stands right now, with its scene, the
// coloured answer and the live number. Serves this repository locally and photographs the widget in card mode
// (?embed=1&card=1) at 600x315, twice the pixel density. Run by .github/workflows/og-image.yml every week.
//
//   npm run og-image                             uses the pinned clock-core from jsDelivr
//   CLOCK_CORE_DIR=../clock-core npm run og-image   serves clock-core from a local checkout instead
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, resolve, sep } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = resolve(".");
const CORE_DIR = process.env.CLOCK_CORE_DIR ? resolve(process.env.CLOCK_CORE_DIR) : null;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  const file = join(ROOT, path.endsWith("/") ? path + "index.html" : path);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try {
    res.writeHead(200, { "content-type": TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] ?? "application/octet-stream" }).end(await readFile(file));
  } catch { res.writeHead(404).end("not found"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", () => r(undefined)));
const addr = server.address();
const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/`;

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: "127.0.0.1,localhost" } } : {});
const page = await browser.newPage({ viewport: { width: 600, height: 315 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true, locale: "en-US" });
if (CORE_DIR) {
  await page.route(/cdn\.jsdelivr\.net\/gh\/ramialbatal\/clock-core@[^/]+\/(.+)$/, async (route) => {
    const file = route.request().url().replace(/^.*clock-core@[^/]+\//, "");
    route.fulfill({ body: await readFile(join(CORE_DIR, file)), contentType: TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] });
  });
}
let ok = false;
try {
  await page.goto(base + "?embed=1&card=1&lang=en");
  await page.waitForFunction(() => document.body.dataset.state === "ready", null, { timeout: 60000 });
  await page.waitForTimeout(4000);   // smoke drifts, windows light up: let the scene settle
  await page.screenshot({ path: "img/og-image.png" });
  ok = true;
  console.log("img/og-image.png updated");
} catch (err) {
  console.error("Could not make the share picture:", err);
}
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
