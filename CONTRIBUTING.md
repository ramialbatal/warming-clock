# Contributing to the Warming Clock

Thanks for helping! Improvements of all sizes are welcome: a new country, a better data source, a clearer explanation,
a bug fix.

## Run it locally

No build step. Any static server works:

```sh
npm run serve          # same as: python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk won't work: browsers block ES modules and
cross-origin data requests on `file://` pages.

## Checks

```sh
npm install            # TypeScript checker, Playwright and clock-core (for types and tests)
npm run check          # house style + types + unit tests
npx playwright install chromium
npm run smoke          # real browser, real data, desktop and phone
```

The same checks run automatically on every pull request, and once a week to catch data sources that changed.

## Where things are

| File | What it holds |
|---|---|
| `js/config.js` | Settings: data sources, countries, the Paris limits. Start here. |
| `js/model.js` | Calculations as pure functions (no page, no network). Covered by `test/model.test.js`. |
| `js/i18n/` | The words in every language: `en.js` holds the words used by the code; `fr.js`, `es.js` and `ar.js` translate those plus every `data-i18n` key in `index.html`. Covered by `test/i18n.test.js`. |
| `js/messages.js` | Every plain-language message (the answer at the top, traffic lights, badges): tone plus short words. Covered by `test/messages.test.js`. |
| `js/app.js` | Loading data, building the page, the live ticker. |
| `js/actions.js` | "What can I do?": three sourced actions; their words are the `act.*` keys in `js/i18n/`. |
| `js/scene.js` | The animated picture behind the header (run by clock-core's `startScene`). |
| `css/theme.css` | Colours and styles specific to this clock. |
| `index.html` | Page text, method section, sources. |

Shared helpers and styles come from [clock-core](https://github.com/ramialbatal/clock-core), pinned to an exact commit in
`index.html` and `package.json`. Don't copy its helpers here: improve clock-core instead.

## Rules of thumb

- **Data:** official, comparable sources only; check a new source loads in the browser (no redirect, CORS header) and
  covers every country. Read the [lessons learned](https://github.com/ramialbatal/clock-core/tree/main/docs/lessons-learned.md) first.
- **Honesty:** the page must say what the numbers are (a model, not a measurement) and what they leave out.
- **Calculations** go in `js/model.js` with a test.
- **Style:** professional but approachable; **no em dashes or en dashes** anywhere (`npm run style` checks).
- **Phones:** check the page at 375 px wide.

More detail: [developer notes](https://github.com/ramialbatal/clock-core/tree/main/docs) and the [checklist for new features](https://github.com/ramialbatal/clock-core/tree/main/docs/adding-a-clock.md).

## Hand-entered figure

The 0.88°C offset from the 1991-2020 average to pre-industrial times (`offset` in `js/config.js`) comes from
Copernicus. If Copernicus changes it, update `offset`, `offsetSource` and `offsetUrl` together, quoting the source.

## Licence

By contributing, you agree that your contributions are licensed under the [MIT licence](LICENSE).
