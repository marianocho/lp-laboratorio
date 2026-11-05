import { initI18n, t, getLanguage } from "./i18n.js";

document.documentElement.classList.add("js");
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const compact = matchMedia("(max-width: 700px), (max-height: 720px)");
const immersive = matchMedia("(min-width: 901px) and (min-height: 741px) and (prefers-reduced-motion: no-preference)");
const header = $(".site-header");
const menuButton = $(".menu-toggle");
const mobileNav = $("#mobile-nav");
const heroTitle = $("#hero-title");
const heroTitleLead = $(".hero-title-lead", heroTitle);
const heroTitleSubject = $("span:last-child", heroTitle);
const heroTitleBreak = $("br", heroTitle);

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", t(open ? "Close menu" : "Open menu"));
  mobileNav.classList.toggle("open", open);
  mobileNav.inert = !open;
  document.body.classList.toggle("menu-open", open);
}
setMenu(false);
menuButton.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
$$("a", mobileNav).forEach((link) =>
  link.addEventListener("click", () => setMenu(false)),
);
document.addEventListener("keydown", (event) => {
  if (menuButton.getAttribute("aria-expanded") !== "true") return;
  if (event.key === "Escape") {
    setMenu(false);
    menuButton.focus();
  }
  if (event.key === "Tab") {
    const lastLink = $$("a", mobileNav).at(-1);
    if (!event.shiftKey && document.activeElement === lastLink) {
      event.preventDefault();
      menuButton.focus();
    }
    if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      lastLink.focus();
    }
  }
});
matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.05, rootMargin: "0px 0px -12px 0px" },
);
$$(".reveal").forEach((element) => revealObserver.observe(element));

// Roving focus keeps the case selector one keyboard stop away.
function setupTabs(buttonSelector, panelSelector, key, onSelect) {
  const tabs = $$(buttonSelector);
  const panels = $$(panelSelector);
  function select(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset[`${key}Panel`] !== tab.dataset[key];
    });
    if (focus) tab.focus();
    onSelect?.(tab.dataset[key]);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (["ArrowRight", "ArrowDown"].includes(event.key))
        next = (index + 1) % tabs.length;
      if (["ArrowLeft", "ArrowUp"].includes(event.key))
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        select(tabs[next], true);
      }
    });
  });
}
// The opening scroll moves the logo into the center of the full-width tree.
const heroStory = $("[data-hero-story]");
const heroStage = $(".hero-stage");
const heroCopy = $(".hero-copy");
const heroLogo = $(".hero-logo");
const heroTree = $(".hero-tree");
const treePaths = $$(".tree-branches path");
const treePillars = $$(".tree-pillar");
const heroFacts = $(".hero-facts");
const heroFactLines = $$("[data-hero-fact]");
const heroCoverage = $(".hero-coverage");
const brazilOutline = $("[data-brazil-outline]");
const coverageCaption = $("figcaption", heroCoverage);
const smooth = (value) => { const x = clamp(value); return x * x * (3 - 2 * x); };
function updateHeroStory() {
  if (!immersive.matches) {
    [heroCopy, heroLogo, heroTree, heroFacts, heroCoverage, brazilOutline, coverageCaption, ...heroFactLines, ...treePillars, ...treePaths].forEach((element) => element.removeAttribute("style"));
    heroCopy.inert = false;
    heroCopy.removeAttribute("aria-hidden");
    heroTree.removeAttribute("aria-hidden");
    [heroFacts, heroCoverage, ...heroFactLines].forEach((element) => element.removeAttribute("aria-hidden"));
    heroStory.dataset.scene = "flow";
    return;
  }
  const travel = Math.max(0, -heroStory.getBoundingClientRect().top / heroStage.offsetHeight);
  // Keep the original logo-to-tree timing; later travel reveals the laboratory facts.
  const value = clamp(travel / 1.5);
  const treeExit = smooth((travel - 1.55) / .35);
  const fade = smooth((value - .08) / .22);
  heroCopy.style.opacity = 1 - fade;
  heroCopy.style.transform = `translateY(${-24 * fade}px)`;
  heroCopy.inert = value > .32;
  heroCopy.setAttribute("aria-hidden", String(value > .32));
  const scale = value < .38
    ? 1 + 1.2 * smooth(value / .38)
    : 2.2 - 1.55 * smooth((value - .38) / .32);
  heroLogo.style.left = `${77 - 27 * smooth((value - .08) / .55)}%`;
  heroLogo.style.top = `${50 - 25 * smooth((value - .18) / .5)}%`;
  heroLogo.style.transform = `translate(-50%, -50%) scale(${scale})`;
  heroLogo.style.opacity = 1 - treeExit;
  heroTree.style.opacity = smooth((value - .5) / .18) * (1 - treeExit);
  heroTree.style.transform = `translateY(${-25 * treeExit}px)`;
  heroTree.style.visibility = value > .5 && treeExit < 1 ? "visible" : "hidden";
  heroTree.setAttribute("aria-hidden", String(value <= .5 || treeExit === 1));
  treePaths.forEach((path) => path.style.strokeDashoffset = 1 - smooth((value - .54) / .24));
  treePillars.forEach((pillar, index) => {
    const reveal = smooth((value - .6 - index * .045) / .16);
    pillar.style.opacity = reveal;
    pillar.style.transform = `translateY(${24 * (1 - reveal)}px)`;
  });
  const factsVisible = travel > 1.85;
  heroFacts.style.visibility = factsVisible ? "visible" : "hidden";
  heroFacts.setAttribute("aria-hidden", String(!factsVisible));
  heroFactLines.forEach((line, index) => {
    const reveal = smooth((travel - 1.85 - index * .5) / .3);
    line.style.opacity = reveal;
    line.style.transform = `translateY(${28 * (1 - reveal)}px)`;
    line.setAttribute("aria-hidden", String(reveal === 0));
  });
  const mapReveal = smooth((travel - 3.35) / .4);
  heroCoverage.style.opacity = mapReveal;
  heroCoverage.style.transform = `translateY(${18 * (1 - mapReveal)}px) scale(${.96 + mapReveal * .04})`;
  heroCoverage.setAttribute("aria-hidden", String(mapReveal === 0));
  brazilOutline.style.strokeDashoffset = 1 - smooth((travel - 3.35) / .45);
  coverageCaption.style.opacity = smooth((travel - 3.5) / .3);
  heroStory.dataset.scene = travel > 3.35 ? "coverage" : factsVisible ? "facts" : value > .78 ? "advantages" : value > .15 ? "zoom" : "intro";
}

// One shared stage keeps the current photograph and copy together.
const serviceCatalog = $("[data-service-catalog]");
const serviceStage = $(".service-stage");
const serviceShowcase = $(".service-showcase");
const serviceRows = $$("[data-service-row]");
const serviceScenes = $$("[data-service-scene]");
const serviceJumps = $$("[data-service-jump]");
const servicePrev = $("[data-service-prev]");
const serviceNext = $("[data-service-next]");
let activeService = -1;
function setServiceActive(index, force = false) {
  if (index === activeService && !force) return;
  activeService = index;
  serviceRows.forEach((row, i) => {
    row.classList.toggle("active", i === index);
    row.inert = immersive.matches && i !== index;
    if (immersive.matches) row.setAttribute("aria-hidden", String(i !== index));
    else row.removeAttribute("aria-hidden");
  });
  serviceScenes.forEach((scene, i) => {
    scene.classList.toggle("active", i === index);
    scene.setAttribute("aria-hidden", String(i !== index));
  });
  serviceJumps.forEach((link) => {
    if (Number(link.dataset.serviceJump) === index) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  servicePrev.disabled = index === 0;
  serviceNext.disabled = index === serviceRows.length - 1;
}
function jumpToService(index, historyMethod = "replaceState", behavior = "smooth") {
  if (!immersive.matches) return;
  index = clamp(index, 0, serviceRows.length - 1);
  if (historyMethod) {
    const url = new URL(location.href);
    url.hash = serviceRows[index].id;
    history[historyMethod](history.state, "", url);
  }
  const segment = (serviceCatalog.offsetHeight - serviceStage.offsetHeight) / serviceRows.length;
  const top = scrollY + serviceCatalog.getBoundingClientRect().top - header.offsetHeight + segment * (index + .35);
  window.scrollTo({ top, behavior });
}
serviceJumps.forEach((link) => link.addEventListener("click", (event) => {
  if (!immersive.matches) return;
  event.preventDefault();
  jumpToService(Number(link.dataset.serviceJump), "pushState");
}));
servicePrev.addEventListener("click", () => jumpToService(activeService - 1));
serviceNext.addEventListener("click", () => jumpToService(activeService + 1));
function routeServiceHash() {
  const index = serviceRows.findIndex((row) => `#${row.id}` === location.hash);
  if (index >= 0) jumpToService(index, null, "instant");
}
window.addEventListener("hashchange", routeServiceHash);
function updateServiceScroll() {
  const rect = serviceCatalog.getBoundingClientRect();
  if (rect.top > innerHeight || rect.bottom < 0) return;
  if (immersive.matches) {
    const value = clamp((header.offsetHeight - rect.top) / Math.max(1, rect.height - serviceStage.offsetHeight));
    setServiceActive(Math.min(serviceRows.length - 1, Math.floor(value * serviceRows.length)));
    return;
  }
  const readingLine = header.offsetHeight + (innerHeight - header.offsetHeight) * .25;
  let nearest = 0;
  let distance = Infinity;
  serviceRows.forEach((row, index) => {
    const bounds = row.getBoundingClientRect();
    const nextDistance = Math.abs(bounds.top + bounds.height / 2 - readingLine);
    if (nextDistance < distance) { nearest = index; distance = nextDistance; }
  });
  setServiceActive(nearest);
}
setServiceActive(0);

const comparisons = $$(".case-panel").map((panel) => ({
  panel,
  frame: $(".comparison", panel),
  range: $(".comparison-range", panel),
  presets: $$("[data-compare-value]", panel),
  replay: $("[data-replay]", panel),
}));
let selectedCase = comparisons[0];
let comparisonManual = false;
let playbackFrame = 0;
let playingComparison = null;
function setComparison(item, value) {
  value = Math.round(clamp(value, 0, 100));
  item.frame.style.setProperty("--comparison", `${value}%`);
  item.range.value = value;
  $(".before-badge", item.frame).hidden = value < 8;
  $(".after-badge", item.frame).hidden = value > 92;
  item.range.setAttribute(
    "aria-valuetext",
    t("{before}% before, {after}% after", { before: value, after: 100 - value }),
  );
  item.presets.forEach((button) => {
    const selected = Number(button.dataset.compareValue) === value;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
function stopPlayback() {
  cancelAnimationFrame(playbackFrame);
  if (playingComparison)
    playingComparison.replay.innerHTML =
      `<span aria-hidden="true">↻</span> ${t('Play reveal')}`;
  playingComparison = null;
}
function takeComparisonControl() {
  comparisonManual = true;
  stopPlayback();
}
comparisons.forEach((item) => {
  setComparison(item, 50);
  item.range.addEventListener("pointerdown", takeComparisonControl);
  item.range.addEventListener("keydown", takeComparisonControl);
  item.range.addEventListener("input", () => {
    takeComparisonControl();
    setComparison(item, Number(item.range.value));
  });
  item.presets.forEach((button) =>
    button.addEventListener("click", () => {
      takeComparisonControl();
      setComparison(item, Number(button.dataset.compareValue));
    }),
  );
  item.replay.addEventListener("click", () => {
    if (playingComparison === item) {
      takeComparisonControl();
      return;
    }
    takeComparisonControl();
    if (motion.matches) {
      setComparison(item, Number(item.range.value) > 0 ? 0 : 100);
      return;
    }
    playingComparison = item;
    item.replay.innerHTML = `<span aria-hidden="true">Ⅱ</span> ${t('Pause reveal')}`;
    const start = performance.now();
    function play(now) {
      const elapsed = (now - start) / 2600;
      const t = clamp(elapsed);
      // A single before-to-after reveal; no loop or automatic case change.
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setComparison(item, 100 * (1 - eased));
      if (elapsed < 1) playbackFrame = requestAnimationFrame(play);
      else stopPlayback();
    }
    playbackFrame = requestAnimationFrame(play);
  });
});
setupTabs("[data-case]", "[data-case-panel]", "case", (id) => {
  takeComparisonControl();
  selectedCase = comparisons.find(
    (item) => item.panel.dataset.casePanel === id,
  );
});
const results = $("[data-results-scroll]");
const resultsSticky = $(".results-sticky");
const resultsObserver = new IntersectionObserver((entries) => {
  if (!entries[0].isIntersecting) stopPlayback();
});
resultsObserver.observe(results);

const manifesto = $("[data-word-reveal]");
const manifestoText = manifesto.textContent.trim();
let words = [];
function renderManifesto() {
  const text = t(manifestoText.replace(/\s+/g, " "));
  manifesto.setAttribute("aria-label", text);
  manifesto.replaceChildren(
    ...text.split(/\s+/).flatMap((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.setAttribute("aria-hidden", "true");
      span.textContent = word;
      return index ? [document.createTextNode(" "), span] : [span];
    }),
  );
  words = $$(".word", manifesto);
}
renderManifesto();
const story = $("[data-scroll-story]");
const sticky = $(".story-sticky");
const frames = $$("[data-frame]");
const copies = $$("[data-story-step]");
const storyButtons = $$("[data-story-go]");
const materials = [
  "Ti / TITANIUM MONOBLOCK",
  "CERAMIC / FORM AND EXPRESSION",
  "FINISHING / ATTENTION TO DETAIL",
];
const materialLabel = $("[data-material-label]");
const scan = $(".image-scan");
const progress = $(".page-progress span");
let activeStep = -1;
let manualStep = 0;
let ticking = false;
function setStoryStep(step) {
  if (step === activeStep) return;
  activeStep = step;
  frames.forEach((frame, index) => {
    frame.classList.toggle("active", index === step);
    frame.setAttribute("aria-hidden", String(index !== step));
  });
  copies.forEach((copy, index) => {
    copy.classList.toggle("active", index === step);
    copy.inert = index !== step;
  });
  storyButtons.forEach((button, index) => {
    button.classList.toggle("active", index === step);
    if (index === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  materialLabel.textContent = t(materials[step]);
}
storyButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const step = Number(button.dataset.storyGo);
    manualStep = step;
    if (motion.matches || compact.matches) {
      setStoryStep(step);

    } else {
      const top = parseFloat(getComputedStyle(sticky).top);
      const range = Math.max(
        1,
        story.offsetHeight - sticky.getBoundingClientRect().height,
      );
      window.scrollTo({
        top:
          window.scrollY +
          story.getBoundingClientRect().top -
          top +
          range * ((step + 0.4) / 3),
        behavior: "smooth",
      });
    }
  }),
);
// A short native-scroll pause folds the chapter title into its introduction.
const chapterMotion = matchMedia("(min-height: 741px) and (prefers-reduced-motion: no-preference)");
const chapterSequences = $$("[data-chapter-sequence]").map((section) => ({
  section,
  scene: $(".chapter-scene", section),
  title: $(".chapter-title h2", section),
  copy: $(".section-heading", section),
}));
function updateChapterSequences() {
  chapterSequences.forEach(({ section, scene, title, copy }) => {
    if (!chapterMotion.matches) {
      title.style.removeProperty("transform");
      copy.style.removeProperty("opacity");
      copy.style.removeProperty("--copy-y");
      copy.removeAttribute("aria-hidden");
      return;
    }
    const rect = section.getBoundingClientRect();
    if (rect.top > innerHeight || rect.bottom < 0) return;
    const progress = clamp(-rect.top / Math.max(1, rect.height - scene.offsetHeight));
    const move = smooth((progress - .12) / .7);
    const reveal = smooth((progress - .35) / .5);
    const scale = parseFloat(getComputedStyle($("h2", copy)).fontSize) / parseFloat(getComputedStyle(title).fontSize);
    const finalTop = copy.offsetTop - copy.offsetHeight / 2 - title.offsetHeight * scale - 24;
    title.style.transform = `translate(${-title.offsetLeft * move}px, ${(finalTop - title.offsetTop) * move}px) scale(${1 + (scale - 1) * move})`;
    copy.style.opacity = reveal;
    copy.style.setProperty("--copy-y", `${24 * (1 - reveal)}px`);
    copy.setAttribute("aria-hidden", String(reveal === 0));
  });
}
chapterMotion.addEventListener("change", scheduleScroll);
document.fonts.ready.then(scheduleScroll);

// Hide reading chrome on downward scroll; a small deliberate upward movement restores it.
let chromeAnchor = window.scrollY;
let chromeDirection = 0;
let lastChromeY = window.scrollY;
function showReadingChrome() { document.body.classList.remove("chrome-hidden"); }
function updateReadingChrome() {
  const y = clamp(window.scrollY, 0, document.documentElement.scrollHeight - innerHeight);
  const delta = y - lastChromeY;
  const direction = Math.sign(delta);
  if (direction && direction !== chromeDirection) {
    chromeAnchor = lastChromeY;
    chromeDirection = direction;
  }
  const keyboardFocus = header.querySelector(":focus-visible") || $(".whatsapp-float").matches(":focus-visible");
  if (y < 120 || document.body.classList.contains("menu-open") || keyboardFocus) {
    showReadingChrome();
    chromeAnchor = y;
  } else if (Math.abs(y - chromeAnchor) >= 12) {
    document.body.classList.toggle("chrome-hidden", direction > 0);
    chromeAnchor = y;
  }
  lastChromeY = y;
}
header.addEventListener("focusin", showReadingChrome);
$(".whatsapp-float").addEventListener("focusin", showReadingChrome);
menuButton.addEventListener("click", showReadingChrome);

// A compact, persistent route through the page while the reading header is hidden.
const sectionIndex = $(".section-index");
const indexToggle = $(".section-index-toggle");
const indexLinks = $$(".section-index a");
const navigationLinks = $$(".desktop-nav a, .section-index a");
const indexedSections = indexLinks.map((link) => document.getElementById(link.hash.slice(1)));
let currentSection = "";
function setIndexOpen(open) {
  sectionIndex.classList.toggle("is-open", open);
  indexToggle.setAttribute("aria-expanded", String(open));
}
indexToggle.addEventListener("click", () => setIndexOpen(!sectionIndex.classList.contains("is-open")));
sectionIndex.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse" && innerWidth > 700) setIndexOpen(true);
});
sectionIndex.addEventListener("pointerleave", () => {
  if (!sectionIndex.querySelector(":focus-visible")) setIndexOpen(false);
});
sectionIndex.addEventListener("focusin", (event) => {
  if (event.target.matches(":focus-visible")) setIndexOpen(true);
});
sectionIndex.addEventListener("focusout", () => requestAnimationFrame(() => {
  if (!sectionIndex.contains(document.activeElement) && !sectionIndex.matches(":hover")) setIndexOpen(false);
}));
sectionIndex.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    indexToggle.focus({ preventScroll: true });
    setIndexOpen(false);
  }
});
indexLinks.forEach((link) => link.addEventListener("click", () => setIndexOpen(false)));
document.addEventListener("pointerdown", (event) => {
  if (!sectionIndex.contains(event.target)) setIndexOpen(false);
});
function updateSectionNavigation() {
  const visible = !document.body.classList.contains("menu-open") &&
    (window.scrollY > 120 || sectionIndex.contains(document.activeElement));
  sectionIndex.classList.toggle("is-visible", visible);
  sectionIndex.inert = !visible;
  if (!visible) setIndexOpen(false);
  const readingLine = innerHeight * .3;
  let active = indexedSections[0].id;
  for (const section of indexedSections) {
    if (section.getBoundingClientRect().top <= readingLine) active = section.id;
  }
  if (active === currentSection) return;
  currentSection = active;
  navigationLinks.forEach((link) => {
    if (link.hash === `#${active}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
menuButton.addEventListener("click", scheduleScroll);

function updateScroll() {
  updateChapterSequences();
  updateReadingChrome();
  updateSectionNavigation();
  updateHeroStory();
  updateServiceScroll();
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 90);
  progress.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
  if (motion.matches) {
    words.forEach((word) => word.classList.add("lit"));
  } else {
    const rect = manifesto.getBoundingClientRect();
    const amount = clamp(
      (innerHeight * 0.88 - rect.top) / (innerHeight * 0.48),
    );
    words.forEach((word, index) =>
      word.classList.toggle("lit", index / words.length < amount),
    );
  }
  if (motion.matches || compact.matches) {
    setStoryStep(manualStep);

  } else {
    const rect = story.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) {
      const value = clamp(
        (parseFloat(getComputedStyle(sticky).top) - rect.top) /
          Math.max(1, rect.height - sticky.getBoundingClientRect().height),
      );
      const step = Math.min(2, Math.floor(value * 3));
      const local = clamp(value * 3 - step);
      setStoryStep(step);

      $("img", frames[step]).style.transform = `scale(${1.1 - local * 0.07})`;
      scan.style.top = `${local * 100}%`;
    }
  }
  if (!motion.matches && !comparisonManual) {
    const rect = results.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) {
      const amount = compact.matches
        ? clamp((innerHeight * 0.7 - rect.top) / (innerHeight * 0.6))
        : clamp(
            (parseFloat(getComputedStyle(resultsSticky).top) - rect.top) /
              Math.max(
                1,
                rect.height - resultsSticky.getBoundingClientRect().height,
              ),
          );
      setComparison(selectedCase, 90 - amount * 80);
    }
  }
  ticking = false;
}
function scheduleScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateScroll);
  }
}
window.addEventListener("scroll", scheduleScroll, { passive: true });
window.addEventListener("resize", scheduleScroll, { passive: true });
motion.addEventListener("change", () => {
  stopPlayback();
  if (motion.matches) setComparison(selectedCase, 50);
  scheduleScroll();
});
compact.addEventListener("change", scheduleScroll);
immersive.addEventListener("change", () => {
  setServiceActive(Math.max(0, activeService), true);
  scheduleScroll();
});
setStoryStep(0);
updateScroll();

let selectedService = null;
function updateContactLinks() {
  const service = selectedService ? t(selectedService) : null;
  const general = service
    ? t("Hello, I'm a dentist and I'd like to discuss {service}.", { service })
    : t("Hello, I'm a dentist and I'd like to discuss a case.");
  const messages = {
    general,
    digital: t("Hello, I'd like to discuss a digital order."),
    analog: t("Hello, I'd like to discuss an analog order."),
  };
  $$("[data-whatsapp]").forEach((link) => {
    const type = link.dataset.whatsapp;
    const number = type === "analog" ? "5511968417556" : "551159048888";
    const message = type === "service"
      ? t("Hello, I'm a dentist and I'd like to discuss {service}.", { service: t(link.dataset.serviceContact) })
      : messages[type];
    link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  });
  const context = $("#contact-context");
  context.hidden = !service;
  context.textContent = service ? t("Your selected service: {service}", { service }) : "";
}
$$("[data-service-contact]").forEach((link) =>
  link.addEventListener("click", () => {
    selectedService = link.dataset.serviceContact;
    updateContactLinks();
  }),
);
const portraits = $$(".team-photo");
function setBiography(portrait, open) {
  portrait.setAttribute("aria-expanded", String(open));
  $(".team-bio", portrait).setAttribute("aria-hidden", String(!open));
}
portraits.forEach((portrait) => {
  setBiography(portrait, false);
  portrait.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") setBiography(portrait, true);
  });
  portrait.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !portrait.matches(":focus-visible")) setBiography(portrait, false);
  });
  portrait.addEventListener("focus", () => {
    if (portrait.matches(":focus-visible")) setBiography(portrait, true);
  });
  portrait.addEventListener("blur", () => setBiography(portrait, false));
  portrait.addEventListener("click", (event) => {
    const open = event.pointerType === "mouse" || portrait.getAttribute("aria-expanded") !== "true";
    portraits.forEach((item) => setBiography(item, item === portrait && open));
  });
  portrait.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setBiography(portrait, false);
  });
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".team-photo")) portraits.forEach((portrait) => setBiography(portrait, false));
});
// Cross-origin videos stay provider-owned; reset a departing embed to stop playback.
const reelCarousel = $("[data-reel-carousel]");
const reelCards = $$("[data-reel]");
const reelDots = $$("[data-reel-go]");
let activeReel = 0;
let reelsLoaded = false;
function updateReelLabels(announce = false) {
  reelCards.forEach((card, index) => {
    $("iframe", card).title = t("Instagram publication {number}", { number: index + 1 });
    $("[data-reel-select]", card).setAttribute("aria-label", t("View publication {number}", { number: index + 1 }));
    reelDots[index].setAttribute("aria-label", t("View publication {number}", { number: index + 1 }));
  });
  if (announce) $("[data-reel-status]").textContent = t("Publication {number} of {total}", { number: activeReel + 1, total: reelCards.length });
}
function setReel(index, announce = true) {
  const next = (index + reelCards.length) % reelCards.length;
  if (reelsLoaded && activeReel !== next) {
    const previousFrame = $("iframe", reelCards[activeReel]);
    previousFrame.src = previousFrame.dataset.src;
  }
  activeReel = next;
  reelCards.forEach((card, i) => {
    let offset = (i - next + reelCards.length) % reelCards.length;
    if (offset > reelCards.length / 2) offset -= reelCards.length;
    const distance = Math.abs(offset);
    card.style.setProperty("--reel-offset", distance === 2 ? 0 : offset);
    card.style.setProperty("--reel-depth", `${-distance * 200}px`);
    card.style.setProperty("--reel-angle", `${distance === 2 ? 0 : offset * -15}deg`);
    card.style.setProperty("--reel-dim", distance ? distance === 1 ? .36 : .6 : 0);
    card.style.setProperty("--reel-layer", 4 - distance);
    card.classList.toggle("active", i === next);
    card.setAttribute("aria-hidden", String(i !== next));
    $(".reel-embed", card).inert = i !== next;
    $("iframe", card).tabIndex = i === next ? 0 : -1;
    $(".reel-open", card).tabIndex = i === next ? 0 : -1;
    reelDots[i].setAttribute("aria-current", String(i === next));
  });
  updateReelLabels(announce);
}
$("[data-reel-prev]").addEventListener("click", () => setReel(activeReel - 1));
$("[data-reel-next]").addEventListener("click", () => setReel(activeReel + 1));
reelDots.forEach((button, index) => button.addEventListener("click", () => setReel(index)));
$$("[data-reel-select]").forEach((button, index) => button.addEventListener("click", () => {
  setReel(index);
  reelCarousel.focus({ preventScroll: true });
}));
reelCarousel.addEventListener("keydown", (event) => {
  const directions = { ArrowLeft: -1, ArrowRight: 1 };
  if (event.key in directions) {
    event.preventDefault();
    setReel(activeReel + directions[event.key]);
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    setReel(event.key === "Home" ? 0 : reelCards.length - 1);
  }
});
let reelSwipe = null;
reelCarousel.addEventListener("pointerdown", (event) => {
  if (event.target.closest("a, button")) return;
  reelSwipe = { x: event.clientX, y: event.clientY };
});
reelCarousel.addEventListener("pointerup", (event) => {
  if (!reelSwipe) return;
  const dx = event.clientX - reelSwipe.x;
  const dy = event.clientY - reelSwipe.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) setReel(activeReel + (dx < 0 ? 1 : -1));
  reelSwipe = null;
});
reelCarousel.addEventListener("pointercancel", () => { reelSwipe = null; });
const reelObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting === reelsLoaded) return;
  reelsLoaded = entry.isIntersecting;
  reelCards.forEach((card) => {
    const frame = $("iframe", card);
    frame.src = reelsLoaded ? frame.dataset.src : "about:blank";
  });
}, { rootMargin: "300px 0px" });
reelObserver.observe(reelCarousel);
setReel(0, false);

// Update dynamic labels too, retaining case, service and comparison positions.
document.addEventListener("languagechange", () => {
  // Preserve the original words while using natural Korean subject order.
  heroTitle.replaceChildren(...(getLanguage() === "ko"
    ? [heroTitleSubject, heroTitleBreak, heroTitleLead]
    : [heroTitleLead, heroTitleBreak, heroTitleSubject]));
  stopPlayback();
  comparisons.forEach((item) => {
    setComparison(item, Number(item.range.value));
    item.replay.innerHTML = `<span aria-hidden="true">↻</span> ${t("Play reveal")}`;
  });
  menuButton.setAttribute("aria-label", t(menuButton.getAttribute("aria-expanded") === "true" ? "Close menu" : "Open menu"));
  materialLabel.textContent = t(materials[Math.max(0, activeStep)]);
  renderManifesto();
  updateContactLinks();
  updateReelLabels();
  scheduleScroll();
});
initI18n();
requestAnimationFrame(routeServiceHash);
$("#current-year").textContent = new Intl.DateTimeFormat("en", {
  year: "numeric",
  timeZone: "America/Sao_Paulo",
}).format(new Date());
