# SiddhiVinayak Exporters - static website

Five-page static site (plus policy pages) for an Indian agri export business:
spices, makhana, rice and fresh fruits & vegetables. Plain HTML, CSS and
vanilla JavaScript - no framework, no build step, no runtime dependencies.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: hero, ranges, why-us, process, quality summary |
| `products.html` | Catalogue with JS category filter and search |
| `quality.html` | Testing, documentation and compliance |
| `about.html` | Company, sourcing, how we work, business details |
| `contact.html` | DPDP-compliant export enquiry form |
| `privacy.html` | Privacy notice (DPDP Act 2023) |
| `terms.html` | Website terms and conditions |
| `cookies.html` | Cookie / storage policy |
| `accessibility.html` | WCAG 2.2 AA accessibility statement |

## Commands

```sh
npm run check        # HTML structure, internal links, contrast, config
npm run check:html
npm run check:links
npm run check:contrast
npm run check:config # add --strict to fail while owner fields are empty
npm run serve        # local preview at http://localhost:8080 (PORT to change)
npm run fonts        # re-fetch self-hosted Inter + Lora (needs network)
```

## Before going live (step 4 and the rest)

1. **Configure the business data** in `assets/js/site-config.js`: legal name,
   enquiries email, phone, address, DPO / grievance officer, and only the
   registration numbers actually held (IEC, GSTIN, FSSAI, Spices Board, APEDA).
   Run `node tools/check-config.mjs --strict` to confirm nothing is left.
2. **Set the form transport** in the same file (`form.endpoint`). If left
   empty, submissions compose an email in the visitor's mail client.
3. **Add `<link rel="canonical">` and a 1200x630 `og:image`** once the
   production domain and social image exist (see the comment in `index.html`).
4. Run `npm run check -- --strict` and fix anything it reports.

## Conventions

- Content is edited only in the HTML files; `assets/js/site-config.js` injects
  configured values (brand name, contact details, registrations, dates).
- Colour tokens live at the top of `assets/css/styles.css`; every text/UI pair
  is verified by `tools/check-contrast.mjs` (WCAG 2.2 AA).
- Fonts are self-hosted in `assets/fonts/` (SIL OFL) for privacy and offline
  use - no third-party font requests.
- No analytics, advertising or embeds load unless a visitor opts in and the
  owner configures a provider.
