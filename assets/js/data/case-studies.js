/* ==========================================================================
   CASE STUDIES
   How to add a new case study:
   1. Copy one object below and paste it at the TOP of the list (newest first).
   2. Give it a unique `slug` (lowercase, dashes) — it becomes the page link:
      case-study.html?slug=your-slug
   3. Put images in assets/media/case-studies/ and set `cover` (and optional
      `before` / `after`) to their paths. Leave them empty to show artwork.
   4. Set `sample: false` for real projects. Entries with `sample: true` show
      a "Sample" label — delete them once you add real work.
   `services` must use these ids: "shopify", "meta-ads", "ai-ugc".
   ========================================================================== */
window.WEDO = window.WEDO || {};

WEDO.caseStudies = [
  {
    slug: "sample-skincare-brand",
    sample: true,
    client: "Skincare brand (sample)",
    industry: "Beauty & skincare",
    title: "From a template store to a brand that sells on its own",
    summary: "A new skincare brand had good products but a basic store and no ad strategy. We rebuilt the store and launched Meta ads with AI UGC creatives.",
    services: ["shopify", "meta-ads", "ai-ugc"],
    duration: "12 weeks",
    cover: "",
    stats: [
      { value: "3.1x", label: "Return on ad spend" },
      { value: "+82%", label: "Conversion rate" },
      { value: "−34%", label: "Cost per purchase" }
    ],
    overview: "A direct-to-consumer skincare brand selling three hero products. The founder was running ads herself and wanted a team to handle the store, ads and creatives together.",
    challenges: [
      "Store looked like a free template and didn't build trust",
      "Most visitors left the product page without adding to cart",
      "Ads used the same two images for months, so results kept dropping"
    ],
    strategy: "We started with an audit of the store, the ad account and the top competitors. We rebuilt the product pages around reviews, ingredients and before-and-after proof, then produced eight AI UGC videos with different hooks. Ads launched with a simple test structure so we could find the winning angles fast and scale them.",
    results: "Within the first three months the store converted far better, and the new creatives gave the ad account room to scale without the cost per purchase climbing.",
    before: { image: "", caption: "Template product page with no reviews or trust signals" },
    after:  { image: "", caption: "Rebuilt product page with reviews, benefits and a sticky add-to-cart" }
  },
  {
    slug: "sample-home-gadgets",
    sample: true,
    client: "Home gadgets store (sample)",
    industry: "Home & lifestyle",
    title: "Fresh creatives that revived a tired ad account",
    summary: "A gadgets store saw costs rising every month. We replaced old ads with a steady flow of AI UGC videos and restructured the campaigns.",
    services: ["meta-ads", "ai-ugc"],
    duration: "8 weeks",
    cover: "",
    stats: [
      { value: "2.6x", label: "Return on ad spend" },
      { value: "24", label: "New video ads tested" },
      { value: "−41%", label: "Cost per click" }
    ],
    overview: "An established online store selling kitchen and home gadgets, spending on Meta ads every day but seeing weaker results each month.",
    challenges: [
      "Ad fatigue: the same creatives had been running for too long",
      "Too many small campaigns splitting the budget",
      "No clear way to tell which products were really profitable"
    ],
    strategy: "We merged campaigns into a cleaner structure, set up a weekly creative testing routine and produced AI UGC videos for the five best-selling products. Winners were moved into scaling campaigns while weak ads were switched off quickly.",
    results: "The account became stable again, with a lower cost per click and a clear list of winning products and hooks to build on.",
    before: { image: "", caption: "" },
    after:  { image: "", caption: "" }
  },
  {
    slug: "sample-fashion-launch",
    sample: true,
    client: "Modest fashion label (sample)",
    industry: "Fashion",
    title: "A premium Shopify launch, ready for paid traffic",
    summary: "A fashion label moving from Instagram DMs to its own store. We designed a premium Shopify store built for mobile shoppers.",
    services: ["shopify"],
    duration: "5 weeks",
    cover: "",
    stats: [
      { value: "5 weeks", label: "From brief to launch" },
      { value: "1.9s", label: "Mobile load time" },
      { value: "+57%", label: "Add-to-cart rate" }
    ],
    overview: "A growing fashion label that had been taking orders through Instagram messages and wanted a proper store before running ads.",
    challenges: [
      "Orders handled manually through DMs",
      "No size guide or clear return policy, which caused hesitation",
      "Most customers shop on mobile, so the store had to feel like an app"
    ],
    strategy: "We built a fast, mobile-first store with clear collections, a size guide on every product, easy returns information and a smooth checkout with local payment options.",
    results: "The brand launched on time with a store ready for paid traffic, and orders moved from DMs to checkout.",
    before: { image: "", caption: "" },
    after:  { image: "", caption: "" }
  }
];
