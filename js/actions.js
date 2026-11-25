// @ts-check
/**
 * "What can I do?": three actions behind a button under the answer (clock-core wireActions). One for everyday life,
 * one close to home, one to ask of leaders. Each has a source; its words are the act.<key>.t / act.<key>.x keys in
 * js/i18n/*.js (every language). Keep claims to what the source says.
 */
/** @type {import("clock-core").Action[]} */
export default [
  { icon: "🌡️", key: "tenth", source: "IPCC, Global Warming of 1.5°C (2018)", url: "https://www.ipcc.ch/sr15/chapter/spm/" },
  { icon: "🧓", key: "heat", source: "WHO, Climate change and heat and health", url: "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health" },
  { icon: "🗳️", key: "leaders", source: "UNEP, Emissions Gap Report 2024", url: "https://www.unep.org/resources/emissions-gap-report-2024" },
];
