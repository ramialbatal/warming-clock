// @ts-check
/**
 * English words used by the code (messages.js and app.js). The page's own text is written in English in index.html;
 * fr.js, es.js and ar.js translate both: every key here, plus every data-i18n key in index.html.
 * Placeholders like {year} are filled by clock-core's t(); keep them, in any order, in every translation.
 */
export default {
  "u.deg": "°C",

  // The answer at the top (messages.js)
  "msg.head.passed.t": "We've passed the {limit} limit",
  "msg.head.passed.x": "The world's long-term warming is now {level} above pre-industrial times, past the Paris goal.",
  "msg.head.year.t": "The world has been {limit} hotter for a whole year",
  "msg.head.year.x": "The last 12 months averaged {recent} above pre-industrial times. At today's pace, the long-term average passes the Paris limit around {year}.",
  "msg.head.soon.t": "We're close to the {limit} limit",
  "msg.head.soon.x": "Long-term warming is {level}. At today's pace, it passes the Paris limit around {year}.",
  "msg.head.below.t": "Still below {limit}",
  "msg.head.below.x": "Long-term warming is {level}, and not rising for now.",

  // Where we stand (messages.js)
  "msg.limit.passed": "Passed",
  "msg.limit.almost": "Almost reached",
  "msg.limit.part": "{pct}% of the way",
  "msg.limit.when": "Long-term warming is {level}. At today's pace, this limit is passed around {year}.",
  "msg.limit.past": "Long-term warming is {level}. This limit was passed around {year}.",
  "msg.limit.flat": "Long-term warming is {level}, and not rising for now.",
  "msg.hot.t": "{n} of the {top} hottest years",
  "msg.hot.x": "were among the last {recent}. The hottest so far: {year}.",
  "msg.badge.hot": "▲ Hotter than normal",
  "msg.badge.cool": "▼ Cooler than normal",
  "msg.badge.normal": "● Normal",

  // Cards and counters (app.js)
  "a.card.safe": "Safer limit: {limit}",
  "a.card.upper": "Upper limit: {limit}",
  "a.card.hot": "Record heat",
  "a.recent": "average of the last 12 months ({from} to {to})",
  "a.count.label": "Time left before long-term warming passes {limit}, at today's pace",
  "a.count.passed": "Long-term warming passed {limit} around {year}",
  "a.count.y": "{n} years",
  "a.count.d": "{n} days",
  "a.vsNormal": "vs normal in {year}",
  "a.more": "More",
  "a.na": "n/a",
  "a.hottest": "Hottest year",
  "a.prevYear": "{year}",
  "a.spark": "{name}: temperature compared with normal, {first} to {last}",
  "a.normal": "Normal = the 1991-2020 average",

  // "What can I do?" (js/actions.js)
  "act.tenth.t": "Every tenth of a degree matters",
  "act.tenth.x": "Cut what you burn: travel, heating and electricity. At 1.5°C, about 14% of people face severe heatwaves at least every five years; at 2°C, about 37%.",
  "act.heat.t": "Look out for each other in heatwaves",
  "act.heat.x": "Check on older neighbours, babies and anyone living alone; keep cool and drink water. Heat is estimated to cause about 489,000 deaths a year.",
  "act.leaders.t": "Ask for plans that match the goal",
  "act.leaders.x": "Ask your representatives for climate plans that keep 1.5°C in reach. Today's policies put the world on course for about 3.1°C this century.",
};
