// @ts-check
/**
 * Warming Clock: loads the data, renders the page and runs the countdown.
 * Calculations live in model.js (pure, tested); settings in config.js; the picture behind the header in scene.js.
 *
 * Sections: Data · Page (render) · Boot.
 */
import * as C from "clock-core";
import CFG from "./config.js";
import actions from "./actions.js";
import { monthlySeries, last12, annualMeans, warmingTrend, crossingYear, hottestYears, countryEntry, splitTime } from "./model.js";
import { headline, limitStatus, hottestStatus, countryBadge, deg, limitText } from "./messages.js";
import { warmingScene } from "./scene.js";

const { YEAR, fmt, setText, escapeHtml, t } = C;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

// ---- Data ------------------------------------------------------------------------
/** An Our World in Data chart as CSV, for the given places (tab=chart gives every year, not just the latest). */
const csvUrl = (/** @type {string} */ chart, /** @type {string[]} */ codes) =>
  `${CFG.apiBase}${chart}.csv?v=1&csvType=filtered&useColumnShortNames=true&tab=chart&country=~${codes.join("~")}`;   // "~" must not be encoded

const loadData = C.once(async () => {
  const codes = [CFG.world, ...CFG.countries.map((c) => c.code)];
  const [monthly, annual] = await Promise.all([
    C.fetchCsv(csvUrl(CFG.monthly.chart, [CFG.world])),
    C.fetchCsv(csvUrl(CFG.annual.chart, codes)),
  ]);
  const months = monthlySeries(monthly, CFG.world);
  if (months.length < 24 * 12) throw new Error("World temperatures missing from response");
  const data = {
    months,
    countries: C.seriesByCode(annual, { code: "code", year: "year", value: CFG.annual.column, wanted: codes }),
    names: C.namesByCode(annual, { code: "code", name: "entity", wanted: codes }),
  };
  const missing = CFG.countries.filter((c) => !data.countries[c.code]).map((c) => c.code);
  if (missing.length) console.warn("No temperature data for:", missing.join(", "));
  return { data, fetchedAt: new Date() };
});

/** "October 2026" in the visitor's language. @param {{ y: number, m: number }} x */
const monthName = (x) => new Date(Date.UTC(x.y, x.m - 1, 15)).toLocaleDateString(C.locale(), { month: "long", year: "numeric", timeZone: "UTC" });

// ---- Page ------------------------------------------------------------------------------
/** @param {Awaited<ReturnType<typeof loadData>>["data"]} data */
function render(data) {
  const [safe, upper] = CFG.limits;
  const recent = /** @type {NonNullable<ReturnType<typeof last12>>} */ (last12(data.months, CFG.offset));
  const annual = annualMeans(data.months, CFG.offset);
  const trend = warmingTrend(annual, CFG.trendYears);
  const now = C.tYears();
  const level = trend.at(now);
  const cross15 = crossingYear(trend, safe), cross20 = crossingYear(trend, upper);

  // The answer and the thermometer
  C.showAnswer(headline(level, recent.value, cross15, safe));
  C.fill("latest", monthName(recent.to));
  setText($("world-temp"), C.digits(deg(recent.value)), true);
  $("world-span").textContent = t("a.recent", { from: monthName(recent.from), to: monthName(recent.to) });
  const scale = (/** @type {number} */ c) => Math.min(Math.max(c / 2.5, 0), 1) * 100;   // the bar runs from 0 to 2.5°C
  $("thermo-fill").style.width = scale(recent.value) + "%";
  $("mark-15").style.insetInlineStart = scale(safe) + "%";
  $("mark-20").style.insetInlineStart = scale(upper) + "%";
  /** @type {HTMLElement} */ ($("mark-15").querySelector("b")).textContent = limitText(safe);
  /** @type {HTMLElement} */ ($("mark-20").querySelector("b")).textContent = limitText(upper, 0);
  $("d-recent").textContent = deg(recent.value);
  $("d-prev").textContent = recent.prev == null ? t("a.na") : deg(recent.prev);
  $("d-level").textContent = deg(level);
  $("d-rate").textContent = deg(trend.slope * 10);

  // The countdown: to the next Paris limit that long-term warming hasn't reached
  const next = cross15 != null && cross15 > now ? { limit: safe, at: cross15 } : cross20 != null && cross20 > now ? { limit: upper, at: cross20 } : null;
  const msAt = (/** @type {number} */ fy) => Date.UTC(Math.floor(fy), 0, 1) + (fy - Math.floor(fy)) * C.msPerYear(Math.floor(fy));
  $("count-label").textContent = next ? t("a.count.label", { limit: limitText(next.limit) })
    : t("a.count.passed", { limit: limitText(safe), year: Math.floor(/** @type {number} */ (cross15)) });

  // Where we stand
  const hot = hottestYears(annual);
  $("status-cards").innerHTML = [
    C.statusCard({ label: t("a.card.safe", { limit: limitText(safe) }), msg: limitStatus(level, safe, cross15, now), pct: (level / safe) * 100, barLabel: C.pct((level / safe) * 100, 0) }),
    C.statusCard({ label: t("a.card.upper", { limit: limitText(upper, 0) }), msg: limitStatus(level, upper, cross20, now), pct: (level / upper) * 100, barLabel: C.pct((level / upper) * 100, 0) }),
    C.statusCard({ label: t("a.card.hot"), msg: hottestStatus(hot) }),
  ].join("");
  document.querySelectorAll("[data-offset-source]").forEach((el) => { el.textContent = CFG.offsetSource; if (el instanceof HTMLAnchorElement) el.href = CFG.offsetUrl; });

  // Countries: the latest complete year against each country's own 1991-2020 normal
  const grid = $("grid");
  grid.innerHTML = "";
  const cards = CFG.countries.flatMap((c) => {
    const s = data.countries[c.code], e = s ? countryEntry(s, YEAR) : null;
    if (!e) return [];
    const name = C.regionName(C.flagRegion(c.flag), c.name || data.names[c.code] || c.code);
    const badge = countryBadge(e.value);
    const shownYears = e.years.filter((y) => y >= 1960);
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <header>
        <span class="flag" aria-hidden="true">${c.flag}</span>
        <h3>${escapeHtml(name)}</h3>
        ${C.badge(badge.tone, badge.label)}
      </header>
      <div class="ytd"><span class="num">${escapeHtml(deg(e.value, 1))}</span> <small>${t("a.vsNormal", { year: e.lastYear })}</small></div>
      <details class="more-info">
        <summary>${t("a.more")}</summary>
        ${C.sparkline(shownYears, shownYears.map((y) => e.series[y]), { caption: `${shownYears[0]}-${String(e.lastYear).slice(2)}`, good: "down",
          label: t("a.spark", { name, first: shownYears[0], last: e.lastYear }) })}
        <dl>
          <div><dt>${t("a.hottest")}</dt><dd>${e.hottest} (${escapeHtml(deg(e.series[e.hottest], 1))})</dd></div>
          ${e.prev == null ? "" : `<div><dt>${t("a.prevYear", { year: e.lastYear - 1 })}</dt><dd>${escapeHtml(deg(e.prev, 1))}</dd></div>`}
          <div class="wide"><dt>${t("a.normal")}</dt><dd></dd></div>
        </dl>
      </details>`;
    grid.appendChild(el);
    return [{ e: { ...e, name, rest: false }, el }];
  });
  const sortSel = /** @type {HTMLSelectElement} */ ($("sort"));
  /** @type {Record<string, (c: typeof cards[number]) => number | string>} */
  const keys = { hot: (c) => c.e.value, name: (c) => c.e.name };
  const sortCards = () => C.sortInto(grid, cards, keys[sortSel.value]);
  sortSel.onchange = sortCards;
  sortCards();
  C.wireShowAll(grid, $("show-all"), cards.length);

  // The live countdown, every second
  C.startTicker((ms) => {
    if (!next) { setText($("count"), ""); return; }
    const p = splitTime((msAt(next.at) - ms) / 1000);
    const two = (/** @type {number} */ n) => String(n).padStart(2, "0");
    // Each number stays left to right inside its words, so Arabic reads "2 سنة" and "20:15:18" the right way round
    const num = (/** @type {string} */ x) => `<bdi dir="ltr">${C.digits(x)}</bdi>`;
    const sep = C.isRtl() ? "، " : ", ";
    setText($("count"), [t("a.count.y", { n: num(String(p.y)) }), t("a.count.d", { n: num(String(p.d)) }), num(`${two(p.h)}:${two(p.m)}:${two(p.s)}`)]
      .map((x) => `<span class="seg">${x}</span>`).join(sep), true);
  }, 2);
}

// ---- Boot --------------------------------------------------------------------------------
async function show() {
  try {
    const { data, fetchedAt } = await loadData();
    render(data);
    $("fetched-at").textContent = fetchedAt.toLocaleString(C.locale());
    C.setState("ready");
  } catch (err) {
    console.error(err);
    C.stopTicker();
    C.setState("error", err instanceof Error ? err.message : String(err));
  }
}

// Language first (the inline script in index.html chose it), so everything below is drawn in it.
await C.startLanguage((code) => import(`./i18n/${code}.js`), document.querySelector("header.top .wrap"));
C.startStats();
C.wireEmbed(document.querySelector("footer.foot"));
C.wireActions(actions);
C.startScene(document.querySelector("canvas.scene"), warmingScene(), { groundAt: document.querySelector("header.top") });
C.wireHelp();
C.fill("year", YEAR);
show();
