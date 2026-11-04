import { initI18n, t, getLanguage } from "./i18n.js";

document.documentElement.classList.add("js");
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const compact = matchMedia("(max-width: 700px), (max-height: 720px)");
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
// All descriptions stay open; the photograph and marker follow the same service.
const serviceCatalog = $("[data-service-catalog]");
const serviceShowcase = $(".service-showcase");
const serviceRows = $$("[data-service-row]");
const serviceScenes = $$("[data-service-scene]");
const serviceJumps = $$("[data-service-jump]");
const serviceCounter = $("[data-service-count]");
const serviceProgress = $(".service-gallery-progress i");
let activeService = -1;
function setServiceActive(index) {
  if (index === activeService) return;
  activeService = index;
  serviceRows.forEach((row, i) => row.classList.toggle("active", i === index));
  serviceScenes.forEach((scene, i) => {
    scene.classList.toggle("active", i === index);
    scene.setAttribute("aria-hidden", String(i !== index));
  });
  serviceJumps.forEach((link, i) => {
    if (i === index) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  serviceCounter.textContent = String(index + 1).padStart(2, "0");
  serviceProgress.style.transform = `scaleX(${(index + 1) / serviceRows.length})`;
}
serviceRows.forEach((row, index) => {
  row.addEventListener("focusin", () => setServiceActive(index));
});
function updateServiceScroll() {
  const rect = serviceCatalog.getBoundingClientRect();
  if (rect.top > innerHeight || rect.bottom < 0) return;
  const stageVisible = getComputedStyle(serviceShowcase).display !== "none";
  const readingLine =
    header.offsetHeight +
    (innerHeight - header.offsetHeight) * (stageVisible ? 0.5 : 0.25);
  let nearest = 0;
  let distance = Infinity;
  serviceRows.forEach((row, index) => {
    const bounds = row.getBoundingClientRect();
    const nextDistance = Math.abs(bounds.top + bounds.height / 2 - readingLine);
    if (nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
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
const counter = $("[data-step-count]");
const visualCounter = $("[data-visual-number]");
const materialLabel = $("[data-material-label]");
const storyProgress = $(".story-progress i");
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
  counter.textContent = `0${step + 1}`;
  visualCounter.textContent = `0${step + 1} — 03`;
  materialLabel.textContent = t(materials[step]);
}
storyButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const step = Number(button.dataset.storyGo);
    manualStep = step;
    if (motion.matches || compact.matches) {
      setStoryStep(step);
      storyProgress.style.transform = `scaleX(${(step + 1) / 3})`;
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
function updateScroll() {
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
    storyProgress.style.transform = `scaleX(${(manualStep + 1) / 3})`;
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
      storyProgress.style.transform = `scaleX(${value})`;
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
setStoryStep(0);
updateScroll();

const navLinks = $$(".desktop-nav a");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting)
        navLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
  },
  { rootMargin: "-20% 0px -55% 0px" },
);
navLinks.forEach((link) => {
  const section = document.getElementById(link.hash.slice(1));
  if (section) sectionObserver.observe(section);
});
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
const pillarRoot = $(".hero-pillars");
const pillars = $$("[data-pillar]");
function selectPillar(index) {
  pillarRoot.dataset.activePillar = String(index);
  pillars.forEach((button, i) => {
    button.classList.toggle("active", i === index);
    button.setAttribute("aria-pressed", String(i === index));
  });
}
pillars.forEach((button, index) => {
  button.addEventListener("click", () => selectPillar(index));
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") selectPillar(index);
  });
  button.addEventListener("focus", () => selectPillar(index));
});
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
  scheduleScroll();
});
initI18n();
$("#current-year").textContent = new Intl.DateTimeFormat("en", {
  year: "numeric",
  timeZone: "America/Sao_Paulo",
}).format(new Date());
