document.documentElement.classList.add("js");

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const header = $(".site-header");
const menuButton = $(".menu-toggle");
const mobileNav = $("#mobile-nav");

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  mobileNav.classList.toggle("open", open);
  mobileNav.inert = !open;
  document.body.classList.toggle("menu-open", open);
}
menuButton.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
$$("a", mobileNav).forEach((link) =>
  link.addEventListener("click", () => setMenu(false)),
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menuButton.focus();
  }
  if (
    event.key === "Tab" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
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
window.matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
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
  { threshold: 0.08, rootMargin: "0px 0px -25px 0px" },
);
$$(".reveal").forEach((element) => revealObserver.observe(element));

const manifesto = $("[data-word-reveal]");
const manifestoText = manifesto.textContent;
manifesto.setAttribute("aria-label", manifestoText);
manifesto.replaceChildren(
  ...manifestoText.split(" ").flatMap((word, index) => {
    const span = document.createElement("span");
    span.className = "word";
    span.setAttribute("aria-hidden", "true");
    span.textContent = word;
    return index ? [document.createTextNode(" "), span] : [span];
  }),
);
const words = $$(".word", manifesto);

const story = $("[data-scroll-story]");
const frames = $$("[data-frame]");
const copies = $$("[data-story-step]");
const storyButtons = $$("[data-story-go]");
const materials = [
  "Ti / TITÂNIO MONOBLOCO",
  "CERÂMICA / FORMA E EXPRESSÃO",
  "ACABAMENTO / ATENÇÃO AO DETALHE",
];
const counter = $("[data-step-count]");
const visualCounter = $("[data-visual-number]");
const materialLabel = $("[data-material-label]");
const storyProgress = $(".story-progress i");
const scan = $(".image-scan");
const heroArt = $(".hero-art");
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
  materialLabel.textContent = materials[step];
}

storyButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const step = Number(button.dataset.storyGo);
    if (motion.matches) {
      manualStep = step;
      setStoryStep(step);
      storyProgress.style.transform = `scaleX(${(step + 1) / 3})`;
    } else {
      const headerHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header"),
      );
      const stickyHeight = $(".story-sticky").getBoundingClientRect().height;
      const range = Math.max(1, story.offsetHeight - stickyHeight);
      const top =
        window.scrollY + story.getBoundingClientRect().top - headerHeight;
      window.scrollTo({
        top: top + range * ((step + 0.35) / 3),
        behavior: "smooth",
      });
    }
  }),
);

function updateScroll() {
  const scrollY = window.scrollY;
  header.classList.toggle("scrolled", scrollY > 90);
  progress.style.transform = `scaleX(${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight))})`;

  if (motion.matches) {
    words.forEach((word) => word.classList.add("lit"));
    setStoryStep(manualStep);
    heroArt.style.removeProperty("translate");
  } else {
    const manifestoRect = manifesto.getBoundingClientRect();
    const wordProgress = clamp(
      (window.innerHeight * 0.84 - manifestoRect.top) /
        (window.innerHeight * 0.5),
    );
    words.forEach((word, index) =>
      word.classList.toggle("lit", index / words.length < wordProgress),
    );
    if (scrollY < window.innerHeight * 1.4)
      heroArt.style.translate = `0 ${scrollY * 0.12}px`;
    const rect = story.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const sticky = $(".story-sticky");
      const top = parseFloat(getComputedStyle(sticky).top);
      const range = Math.max(
        1,
        rect.height - sticky.getBoundingClientRect().height,
      );
      const storyValue = clamp((top - rect.top) / range);
      const step = Math.min(2, Math.floor(storyValue * 3));
      const localProgress = clamp(storyValue * 3 - step);
      setStoryStep(step);
      storyProgress.style.transform = `scaleX(${storyValue})`;
      $("img", frames[step]).style.transform =
        `scale(${1.13 - localProgress * 0.1}) translateY(${(localProgress - 0.5) * 7}px)`;
      scan.style.top = `${localProgress * 100}%`;
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
motion.addEventListener("change", scheduleScroll);
setStoryStep(0);
updateScroll();

const navLinks = $$(".desktop-nav a");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting)
        navLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
    }
  },
  { rootMargin: "-20% 0px -55% 0px" },
);
navLinks.forEach((link) => {
  const section = document.getElementById(link.hash.slice(1));
  if (section) sectionObserver.observe(section);
});

const tabs = $$("[data-category]");
function selectCategory(tab, focus = false) {
  const category = tab.dataset.category;
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  $$("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== category;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCategory(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectCategory(tabs[next], true);
    }
  });
});

$$("[data-service-contact]").forEach((link) =>
  link.addEventListener("click", () => {
    const message = `Olá, sou dentista e gostaria de conversar sobre ${link.dataset.serviceContact.toLowerCase()}.`;
    $("#contact-digital").href =
      `https://wa.me/551159048888?text=${encodeURIComponent(message)}`;
  }),
);
$("#current-year").textContent = new Intl.DateTimeFormat("pt-BR", {
  year: "numeric",
  timeZone: "America/Sao_Paulo",
}).format(new Date());
