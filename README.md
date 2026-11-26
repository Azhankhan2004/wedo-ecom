# WeDo Ecom — Agency Website

The official website for **WeDo Ecom**, an ecommerce growth agency offering:

1. **Shopify Store Design**
2. **Meta Ads Management**
3. **AI UGC Video Ads**

Built as a fast, dependency-free static site (HTML, CSS and vanilla JavaScript). No build step, no frameworks, no monthly hosting cost. It runs on GitHub Pages, Netlify, Vercel or any normal web host.

## Pages

| Page | File | Purpose |
| --- | --- | --- |
| Home | `index.html` | Hero, services overview, featured case studies, gallery preview, process, CTA |
| Services | `services.html` | The three services, Meta Ads and AI UGC packages, FAQ |
| Case studies | `case-studies.html` | Filterable list of client results |
| Case study | `case-study.html?slug=...` | One template that renders any case study |
| Creative gallery | `gallery.html` | Filterable masonry gallery with lightbox (images and videos) |
| Growth process | `process.html` | The four-step workflow |
| About | `about.html` | Who we are, mission, vision, approach |
| Contact | `contact.html` | Inquiry form with project summary + WhatsApp, Discord, booking and email |
| Studio Manager | `studio.html` | Private editor (not in the menus) to preview case studies, gallery, prices and links in your browser, then export the files to upload to GitHub |
| 404 | `404.html` | Not-found page |

## Folder structure

```
wedo-ecom/
├── index.html, services.html, ...   ← pages (including studio.html)
├── assets/
│   ├── css/main.css                 ← all styles (theme colours at the top)
│   ├── img/                         ← favicon, social share image
│   ├── js/
│   │   ├── config.js                ← ✏️ contact links, WhatsApp, Google Form
│   │   ├── store.js                 ← browser persistence + JS export helpers
│   │   ├── main.js                  ← site logic (header, footer, modals, gallery, form…)
│   │   ├── studio.js                ← Studio Manager UI logic
│   │   └── data/
│   │       ├── packages.js          ← ✏️ package tiers and prices
│   │       ├── case-studies.js      ← ✏️ case studies
│   │       └── gallery.js           ← ✏️ gallery items
│   └── media/
│       ├── case-studies/            ← case study images
│       └── gallery/                 ← gallery images and videos
├── docs/CONTENT-GUIDE.md            ← how to update content (simple steps)
├── robots.txt, sitemap.xml, site.webmanifest
```

The ✏️ files are the only ones you need for day-to-day updates. See **[docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md)**.

## Before launch checklist

- [ ] `assets/js/config.js` — real WhatsApp number, Discord invite, booking link and email
- [ ] `assets/js/data/packages.js` — real prices (or leave `null` for "Custom quote")
- [ ] `assets/js/data/case-studies.js` — replace the 3 sample case studies with real ones
- [ ] `assets/js/data/gallery.js` — add real creatives to `assets/media/gallery/`
- [ ] Connect the Google Form (optional — without it, the form sends inquiries to WhatsApp)
- [x] Social share image `assets/img/og-image.png` (1200×630) is included; replace it any time
- [ ] If the Vercel URL changes or you add a custom domain, update the URLs in `sitemap.xml`, `robots.txt` and the `<link rel="canonical">` tags

## Run it locally

Any static server works. From this folder:

```bash
# Python (already on most computers)
python -m http.server 8000
# then open http://localhost:8000
```

Or in VS Code, install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.

You can also double-click `index.html` to open it directly; everything works without a server.

## Live site (Vercel)

The site is deployed on Vercel at **https://wedo-ecom.vercel.app** (Vercel project `wedo-ecom`).

To update it, either connect this folder's GitHub repo to the Vercel project (every push then deploys automatically), or install the Vercel CLI and run:

```bash
npm i -g vercel
vercel --prod
```

## Deploy on GitHub Pages (alternative, also free)

1. On GitHub, open the repo → **Settings** → **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Pick branch **main**, folder **/ (root)** → **Save**.
4. After a minute the site is live at `https://wedo-ecom.vercel.app/`.

To use your own domain (e.g. `wedoecom.com`), add it in the same Pages settings and point your domain's DNS to GitHub Pages.

## Design system

| Token | Value | Use |
| --- | --- | --- |
| Aura Black | `#050506` | Page background |
| Dark Grey | `#141518` / `#0d0e10` | Panels and cards |
| Greyish Lime | `#c4cf86` | CTAs, highlights, stats, active states only |
| Text | `#e9ebe4` | Main text |
| Muted | `#9a9d94` | Secondary text |

**Typography:** Archivo variable. Headlines use the expanded width (`wdth` 110–125) for a bold, futuristic look; body text uses the normal width.

**Accessibility and performance:** keyboard-friendly navigation, visible focus states, reduced-motion support, semantic HTML, lazy-loaded images, no tracking or third-party scripts.

## Licence

Site code © WeDo Ecom. Archivo font: SIL Open Font License 1.1.
