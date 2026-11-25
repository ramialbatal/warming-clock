// @ts-check
/**
 * Warming Clock settings: data sources, the Paris limits and countries.
 * Change things here first; the code reads everything from this object.
 *
 * Data is fetched live in the browser from Our World in Data's grapher API (`Access-Control-Allow-Origin: *`):
 * Copernicus Climate Change Service (ERA5) surface air temperature, as differences ("anomalies") from the 1991-2020
 * average: monthly for the world, yearly for countries.
 *
 * To add a country, add { code, flag } to `countries` (ISO 3166-1 alpha-3 code), then add it to llms.txt.
 */

/**
 * @typedef {{ code: string, flag: string, name?: string }} Country
 * @typedef {{ apiBase: string, monthly: { chart: string, column: string }, annual: { chart: string, column: string },
 *   source: string, sourceUrl: string, offset: number, offsetSource: string, offsetUrl: string, limits: [number, number],
 *   trendYears: number, world: string, countries: Country[] }} Config
 */

/** @type {Config} */
export default {
  apiBase: "https://ourworldindata.org/grapher/",
  monthly: { chart: "monthly-temperature-anomalies", column: "temperature_anomaly" },
  annual: { chart: "annual-temperature-anomalies", column: "temperature_anomaly" },
  source: "Copernicus Climate Change Service (ERA5)",
  sourceUrl: "https://ourworldindata.org/grapher/monthly-temperature-anomalies",
  // Copernicus: the 1991-2020 average was 0.88°C warmer than 1850-1900 ("pre-industrial"); its standard offset for
  // annual and 12-month averages. Single months use offsets of 0.80 to 0.96°C, so the clock only shows 12-month and
  // yearly averages against pre-industrial times.
  offset: 0.88,
  offsetSource: "Copernicus, Climate Bulletin: about the data and analysis",
  offsetUrl: "https://climate.copernicus.eu/climate-bulletin-about-data-and-analysis",
  limits: [1.5, 2],     // the Paris Agreement's limits, °C above pre-industrial times
  trendYears: 30,       // long-term warming = the straight-line trend through the last 30 complete years
  world: "OWID_WRL",
  countries: [
    { code: "USA", flag: "🇺🇸" },
    { code: "CHN", flag: "🇨🇳" },
    { code: "IND", flag: "🇮🇳" },
    { code: "BRA", flag: "🇧🇷" },
    { code: "NGA", flag: "🇳🇬" },
    { code: "RUS", flag: "🇷🇺" },
    { code: "JPN", flag: "🇯🇵" },
    { code: "DEU", flag: "🇩🇪" },
    { code: "GBR", flag: "🇬🇧" },
    { code: "FRA", flag: "🇫🇷" },
    { code: "ITA", flag: "🇮🇹" },
    { code: "ESP", flag: "🇪🇸" },
    { code: "SAU", flag: "🇸🇦" },
    { code: "EGY", flag: "🇪🇬" },
    { code: "MAR", flag: "🇲🇦" },
    { code: "TUR", flag: "🇹🇷" },
    { code: "IRN", flag: "🇮🇷" },
    { code: "PAK", flag: "🇵🇰" },
    { code: "BGD", flag: "🇧🇩" },
    { code: "IDN", flag: "🇮🇩" },
    { code: "MEX", flag: "🇲🇽" },
    { code: "CAN", flag: "🇨🇦" },
    { code: "AUS", flag: "🇦🇺" },
    { code: "ZAF", flag: "🇿🇦" },
    { code: "ARG", flag: "🇦🇷" },
    { code: "KEN", flag: "🇰🇪" }
  ]
};
