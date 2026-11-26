# Content guide — how to update the WeDo Ecom website

You can update content in **two ways**:
1. **Directly in the website** via **[Studio Manager (`studio.html`)](../studio.html)** — open `your-site/studio.html`, add or edit case studies, gallery items, prices and contact links, and preview them in your browser. Edits stay in your browser only until you click **Export**, then upload the exported files to the same place on GitHub (`assets/js/` or `assets/js/data/`).
2. **Directly in code** by editing the small JavaScript files listed below. Open them in VS Code, change the text between the quotes, save, and refresh the page.

> **Tip:** keep the commas and quotes exactly as they are. If a page suddenly looks empty after an edit, a comma or quote is usually missing. Press `F12` in the browser and check the **Console** tab; it shows the line with the problem.

---

## 1. Contact links (WhatsApp, Discord, booking, email)

File: `assets/js/config.js`

```js
email: "hello@wedoecom.com",
whatsappNumber: "923001234567",        // digits only, country code first, no + or spaces
discordInvite: "https://discord.gg/abc123",
bookingUrl: "https://calendly.com/wedoecom/strategy-call",
```

Every WhatsApp, Discord and "Book a free strategy call" button on the site updates automatically.

Social links go in `socials`. Empty ones are hidden.

---

## 2. Package prices

File: `assets/js/data/packages.js`

Each package looks like this:

```js
{
  name: "Growth",
  for: "For stores with steady sales that want to scale profitably.",
  price: 499, period: "/month",
  featured: true,
  features: [
    "Up to 4 campaigns, including retargeting",
    "Weekly optimization and budget shifts"
  ]
}
```

- `price: 499` shows **$499 /month**. `price: null` shows **Custom quote**.
- The currency symbol is set once in `config.js` (`currency: "$"`). Use `"Rs "` for PKR.
- `featured: true` highlights the tier with a lime top bar and a "Most chosen" badge. Use it on one tier only.
- To add a feature, add a new line in quotes with a comma after the line before it.

---

## 3. Add a case study

File: `assets/js/data/case-studies.js`

1. Put the images in `assets/media/case-studies/` (for example `glowco-cover.webp`, `glowco-before.webp`, `glowco-after.webp`). Recommended size: 1600×900, under 400 KB.
2. Copy a whole `{ ... },` block and paste it at the **top** of the list.
3. Change the details:

```js
{
  slug: "glowco-skincare",          // used in the link, lowercase with dashes, must be unique
  sample: false,                    // false = real project (no "Sample" label)
  client: "GlowCo",
  industry: "Beauty & skincare",
  title: "How GlowCo tripled its ad returns in 90 days",
  summary: "One or two sentences for the list page.",
  services: ["shopify", "meta-ads", "ai-ugc"],   // any of these three ids
  duration: "12 weeks",
  cover: "assets/media/case-studies/glowco-cover.webp",
  stats: [
    { value: "3.1x", label: "Return on ad spend" },
    { value: "+82%", label: "Conversion rate" },
    { value: "−34%", label: "Cost per purchase" }
  ],
  overview: "Who the client is.",
  challenges: ["Problem one", "Problem two"],
  strategy: "What we did and why.",
  results: "What changed.",
  before: { image: "assets/media/case-studies/glowco-before.webp", caption: "Old product page" },
  after:  { image: "assets/media/case-studies/glowco-after.webp",  caption: "New product page" }
},
```

The case study gets its own page automatically at `case-study.html?slug=glowco-skincare`. The two newest case studies also appear on the home page.

4. **Delete the sample case studies** (the ones with `sample: true`) once you have real ones. Only publish numbers you can prove; ask the client's permission before naming them.

---

## 4. Add work to the creative gallery

File: `assets/js/data/gallery.js`

1. Put the file in `assets/media/gallery/`.
   - Images: `.webp` or `.jpg`, under 400 KB.
   - Videos: `.mp4`, under 8 MB, plus a still image (`poster`) so the grid loads fast.
2. Add a line to the list:

```js
{ title: "Serum morning routine", client: "GlowCo", category: "ugc", type: "video",
  ratio: "9:16", src: "assets/media/gallery/glowco-ugc-1.mp4", poster: "assets/media/gallery/glowco-ugc-1.jpg" },

{ title: "Summer sale carousel", client: "Fashion brand", category: "ad-creative", type: "image",
  ratio: "4:5", src: "assets/media/gallery/summer-sale.webp" },
```

- `category` must be one of: `ugc`, `ad-creative`, `product`, `shopify`, `visuals`. You can add new categories at the top of the file in `galleryCategories`.
- `ratio` keeps the grid tidy: `"9:16"` (Reels/TikTok), `"4:5"` (feed), `"1:1"`, `"4:3"`, `"16:9"`.
- The first 6 items also show on the home page, so put your best work first.
- Delete the placeholder items (the ones with `src: ""`) as you add real work.

---

## 5. Connect the contact form to Google Forms (optional)

Without this step, the form still works: it opens WhatsApp with all the visitor's answers filled in.

To receive inquiries in a Google Sheet instead:

1. Create a Google Form with these questions (all **Short answer** or **Paragraph**): Name, Business name, Email, Website, Services, Monthly ad budget, Challenges, Goals.
2. In the form's **Responses** tab, click **Link to Sheets** so every inquiry lands in a spreadsheet.
3. Click ⋮ → **Get pre-filled link**, type a test answer in every field, click **Get link** and copy it.
4. The link looks like `https://docs.google.com/forms/d/e/1FAIpQLSd.../viewform?entry.111=Name&entry.222=...`
5. In `assets/js/config.js`:

```js
googleForm: {
  formId: "1FAIpQLSd...",          // the part between /d/e/ and /viewform
  fields: {
    name: "entry.111",
    business: "entry.222",
    email: "entry.333",
    website: "entry.444",
    services: "entry.555",
    budget: "entry.666",
    challenges: "entry.777",
    goals: "entry.888"
  }
}
```

6. Send a test inquiry from the live site and check that it appears in the Sheet.

**Making it "AI-powered":** in the linked Google Sheet, go to **Extensions → Apps Script** and add a script (or use a Zapier/Make automation) that sends each new row to an AI model to summarise the lead, score it, and email or WhatsApp you a short brief. Ask Claude to write that script when you're ready.

---

## 6. Change page text

Page text (headlines, descriptions, FAQ) lives directly in each `.html` file. Search for the sentence in VS Code (`Ctrl + Shift + F`), change it, and save.

## 7. Change colours

Open `assets/css/main.css`. The theme colours are at the top under **1. Tokens**. Changing `--lime` changes the accent everywhere.

## 8. Save your changes to GitHub

```bash
git add .
git commit -m "Add GlowCo case study"
git push
```

If GitHub Pages is turned on, the live site updates in about a minute.
