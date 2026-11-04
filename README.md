# Kim Dental Laboratory

Website for dentists and clinics in English, Brazilian Portuguese and Korean. Native HTML, CSS and JavaScript, local fonts and images, static deployment, no runtime dependencies.

## Run

Requires Node.js 20 or later.

```sh
npm run dev
# http://localhost:4173
npm run check
npm run build
```

The build produces `dist/`. The development server listens on localhost; hosting is independent of the local process.

## Experience

- Original laboratory headline and official logo. Scrolling enlarges and centers the logo, then draws a full-width tree of the three original advantages.
- All eight original services. A full-width black stage presents one photograph and description at a time on desktop, with native scrolling, direct shortcuts and previous/next controls. Compact layouts show every service in normal flow.
- Three original transformation cases with a scroll-driven reveal, draggable comparison, keyboard control, before/split/after views and a single optional replay.
- Three technology chapters with direct controls and desktop scrollytelling.
- All four original team members and visible roles, with biographies over the portraits on hover, keyboard focus or touch.
- Floating WhatsApp and direct service-specific WhatsApp links, plus digital/analog channels, email, map and official social links.
- Language selector with saved preference and shareable `?lang=en`, `?lang=pt` or `?lang=ko` links; translated content, metadata, accessible labels and messages.
- Responsive layouts, native scrolling, visible focus, keyboard tabs, mobile menu with Escape and focus containment, and `prefers-reduced-motion` support.
- Small/short screens use flowing content instead of pinned stories. Without JavaScript, all services and cases remain available.

## Files

- `index.html`: semantic structure and English content.
- `src/styles.css`: visual system and responsive layouts.
- `src/main.js`: logo-to-tree animation, synchronized service scenes, portrait biographies, case tabs, comparisons and navigation.
- `src/i18n.js` and `src/locales/`: locale switching and Portuguese/Korean dictionaries.
- `scripts/check-locales.mjs`: translation coverage, placeholder and content-inventory checks.
- `public/images/`: original laboratory photographs; the previous generated hero is retained as an unused source asset.
- `docs/estrategia-e-fontes.md`: source inventory, priorities, interaction decisions, self-review and verification limits.
- `docs/direcao-de-imagem.md`: official logo provenance and archived hero image provenance.
- `.openai/hosting.json`: existing private Sites preview configuration.

No invented testimonials, turnaround guarantees, disconnected forms or automatic clinical-file submission. Clinical comparison photographs are unaltered originals.
