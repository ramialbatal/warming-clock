# Notes for AI assistants working in this repository

- This is the Warming Clock, one of five open clocks (Emissions, Renewables, Jobs, Peace, Warming) built on
  [clock-core](https://github.com/ramialbatal/clock-core). Read `CONTRIBUTING.md`, then the developer notes in
  clock-core's `docs/` (especially `lessons-learned.md` and `adding-a-clock.md`) before changing anything.
- Plain ES modules, no build step. Settings in `js/config.js`, pure calculations in `js/model.js` (add a test in
  `test/model.test.js` for every change), plain-language messages in `js/messages.js` (tested in
  `test/messages.test.js`), page code in `js/app.js`, the animated picture behind the header in `js/scene.js` (keep the
  title readable over it; check screenshots at laptop and phone width).
- Page design: answer first, in plain words with a colour (green, amber, red); one short sentence per point; every
  number, method or source behind "More" or "How we calculate this". No jargon in what a visitor sees first.
- Temperatures are shown above pre-industrial times (1850-1900) by adding Copernicus's 0.88°C to the 1991-2020
  differences, for 12-month and yearly averages only. The Paris limits refer to long-term warming (the 30-year trend),
  not a single hot year; keep that distinction wherever a limit is mentioned.
- Never copy clock-core helpers into this repo; change clock-core, release it, then bump the pin in three places:
  the two clock-core URLs in `index.html` and the `clock-core` dev dependency in `package.json`.
- Colour and verdict logic must compare values as displayed (`C.shown` / `C.shownSign`), never raw numbers.
- Escape any data text put into HTML with `escapeHtml`; update live numbers only with `setText` inside the ticker.
- Languages: English, French, Spanish, Arabic (right to left). Visible text in `index.html` carries `data-i18n` keys;
  words used by the code live in `js/i18n/en.js` and are read with `C.t()`. Any new or changed text needs all four
  languages (`test/i18n.test.js` fails otherwise). See clock-core's `docs/how-it-works.md`, "Languages".
- Writing style: no em dashes or en dashes anywhere (text, comments, images). Professional but approachable.
- Before finishing: `npm run check` and `npm run smoke` (use `CLOCK_CORE_DIR=../clock-core` to test against a local
  clock-core checkout).
