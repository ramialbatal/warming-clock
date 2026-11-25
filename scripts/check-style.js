// House style check: no em dashes or en dashes in any text file of the repository.
// Usage: node scripts/check-style.js   (exits 1 and lists offending lines if any are found)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const TEXT = new Set([".js", ".mjs", ".css", ".html", ".md", ".json", ".txt", ".yml", ".yaml", ".svg", ".xml"]);
const SKIP = new Set([".git", "node_modules"]);
const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");   // en dash, em dash

/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  if (SKIP.has(name)) return [];
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : TEXT.has(extname(name)) ? [p] : [];
});

const hits = [];
for (const file of walk(".")) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (DASHES.test(line)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
  });
}
if (hits.length) {
  console.error("Em or en dashes found (house style forbids them; use commas, colons, brackets or 'to'):\n" + hits.join("\n"));
  process.exit(1);
}
console.log("Style check passed: no em or en dashes.");
