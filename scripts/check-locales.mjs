import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pt from "../src/locales/pt.js";
import ko from "../src/locales/ko.js";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const content = html.replace(/<(script|style|svg|select)\b[^>]*>[\s\S]*?<\/\1>/g, "");
const messages = new Set();
const add = (message) => { const key = decode(message); if (/[a-zA-Z]/.test(key)) messages.add(key); };
for (const match of content.matchAll(/>([^<]+)</g)) add(match[1]);
for (const match of content.matchAll(/(?:aria-label|alt|title)="([^"]+)"/g)) add(match[1]);
for (const match of content.matchAll(/<meta\b[^>]*(?:name="description"|property="og:(?:title|description)")[^>]*content="([^"]+)"/g)) add(match[1]);
for (const message of ["Language", "Open menu", "Close menu", "Play reveal", "Pause reveal", "{before}% before, {after}% after", "Hello, I'm a dentist and I'd like to discuss a case.", "Hello, I'd like to discuss a digital order.", "Hello, I'd like to discuss an analog order.", "Hello, I'm a dentist and I'd like to discuss {service}.", "Your selected service: {service}", "Ti / TITANIUM MONOBLOCK", "CERAMIC / FORM AND EXPRESSION", "FINISHING / ATTENTION TO DETAIL"]) add(message);
const placeholders = (text) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
for (const [locale, dictionary] of Object.entries({pt, ko})) {
  const missing = [...messages].filter((message) => !Object.hasOwn(dictionary, message));
  assert.deepEqual(missing, [], `${locale}: untranslated website text`);
  for (const [key, value] of Object.entries(dictionary)) {
    assert.equal(typeof value, "string");
    assert.ok(value.trim(), `${locale}: empty translation for ${key}`);
    assert.deepEqual(placeholders(value), placeholders(key), `${locale}: changed interpolation fields`);
  }
}
assert.equal((html.match(/property="og:locale"/g) || []).length, 1);
assert.equal((html.match(/data-service-row=/g) || []).length, 8);
assert.equal((html.match(/data-case-panel=/g) || []).length, 3);
assert.equal((html.match(/class="team-member /g) || []).length, 4);
assert.equal((html.match(/data-whatsapp="service"/g) || []).length, 8);
assert.ok(!html.includes("Conceptual visualization"));
assert.ok(!html.includes("Discover the difference"));
assert.ok(!html.includes('class="hero-art"'));
console.log(`Localization checks passed: ${messages.size} messages in Portuguese and Korean; 8 services, 3 cases, 4 people preserved.`);
