import pt from "./locales/pt.js";
import ko from "./locales/ko.js";

export const dictionaries = { en: {}, pt, ko };
export const normalize = (text) => text.replace(/\s+/g, " ").trim();
let language = "en";
const textBindings = [];
const attributeBindings = [];

export function t(message, values = {}) {
  const translated = dictionaries[language][message] ?? message;
  return translated.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

export function getLanguage() { return language; }

export function setLanguage(next, persist = true) {
  language = Object.hasOwn(dictionaries, next) ? next : "en";
  document.documentElement.lang = language === "pt" ? "pt-BR" : language;
  textBindings.forEach(({ node, original, key }) => {
    // Keep inline elements, semantic structure and the original whitespace intact.
    node.nodeValue = original.replace(/\S[\s\S]*\S|\S/, () => t(key));
  });
  attributeBindings.forEach(({ element, attribute, key }) => {
    element.setAttribute(attribute, t(key));
  });
  document.querySelector("#site-language").value = language;
  document.querySelector('meta[property="og:locale"]')?.setAttribute(
    "content", { en: "en_US", pt: "pt_BR", ko: "ko_KR" }[language],
  );
  if (persist) {
    try { localStorage.setItem("kim-language", language); } catch { /* Storage can be disabled. */ }
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    history.replaceState(history.state, "", url);
  }
  document.dispatchEvent(new CustomEvent("languagechange", { detail: { language } }));
}

export function initI18n() {
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('script, style, svg, [translate="no"]')) continue;
    const key = normalize(node.nodeValue);
    if (!key || !(key in pt || key in ko)) continue;
    textBindings.push({ node, original: node.nodeValue, key });
  }
  document.querySelectorAll("[aria-label], [alt], [title], meta[name='description'], meta[property='og:title'], meta[property='og:description']").forEach((element) => {
    if (element.closest('svg, [translate="no"]') && element.id !== "site-language") return;
    for (const attribute of ["aria-label", "alt", "title", "content"]) {
      const key = normalize(element.getAttribute(attribute) ?? "");
      if (key && (key in pt || key in ko)) attributeBindings.push({ element, attribute, key });
    }
  });
  let preferred;
  try { preferred = localStorage.getItem("kim-language"); } catch { /* English remains the default. */ }
  const requested = new URL(location.href).searchParams.get("lang");
  setLanguage(requested ?? preferred ?? "en", false);
  document.querySelector("#site-language").addEventListener("change", (event) => setLanguage(event.target.value));
}
