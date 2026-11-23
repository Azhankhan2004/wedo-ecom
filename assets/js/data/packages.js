/* ==========================================================================
   SERVICE PACKAGES
   (Service descriptions live in services.html. This file only holds the
   package tiers so prices are easy to change in one place.)
   - To change a price: set `price` to a number (e.g. 299). Leave it null to
     show "Custom quote".
   - `period` is shown after the price (e.g. "/month", "one-time").
   - Set `featured: true` on the tier you want to highlight.
   ========================================================================== */
window.WEDO = window.WEDO || {};

WEDO.services = [
  {
    id: "shopify",
    name: "Shopify Store Design",
    packages: [] // Shopify is quoted per project. Add tiers here later if needed.
  },
  {
    id: "meta-ads",
    name: "Meta Ads Management",
    packagesNote: "Ad spend is paid directly to Meta and is not included.",
    packages: [
      {
        name: "Launch",
        for: "For brands running their first serious campaigns.",
        price: null, period: "/month", // TODO: set price
        features: [
          "1 ad account, up to 2 campaigns",
          "Pixel and tracking setup check",
          "Audience research and targeting",
          "Up to 6 ad variations tested per month",
          "Monthly performance report"
        ]
      },
      {
        name: "Growth",
        for: "For stores with steady sales that want to scale profitably.",
        price: null, period: "/month", // TODO
        featured: true,
        features: [
          "Up to 4 campaigns, including retargeting",
          "Weekly optimization and budget shifts",
          "Up to 15 ad variations tested per month",
          "Creative direction for new ads",
          "Bi-weekly reports and a monthly strategy call"
        ]
      },
      {
        name: "Scale",
        for: "For brands spending more and ready to grow fast.",
        price: null, period: "/month", // TODO
        features: [
          "Full-funnel campaign structure",
          "Unlimited ad variations and testing",
          "Daily monitoring and scaling",
          "Priority WhatsApp support",
          "Weekly reports and strategy calls"
        ]
      }
    ]
  },
  {
    id: "ai-ugc",
    name: "AI UGC Video Ads",
    packagesNote: "All videos are delivered in 9:16, with 1:1 and 4:5 versions on request.",
    packages: [
      {
        name: "Starter",
        for: "Test a new product with a few strong angles.",
        price: null, period: "one-time", // TODO
        features: [
          "3 AI UGC video ads",
          "3 different hooks",
          "Script writing included",
          "Captions and background music",
          "1 round of revisions"
        ]
      },
      {
        name: "Growth",
        for: "Feed your ad account with steady new creatives.",
        price: null, period: "one-time", // TODO
        featured: true,
        features: [
          "8 AI UGC video ads",
          "Hook variations for every video",
          "Script writing and creative strategy",
          "Captions, music and product shots",
          "2 rounds of revisions"
        ]
      },
      {
        name: "Scale",
        for: "A full creative library for brands that test a lot.",
        price: null, period: "/month", // TODO
        features: [
          "15 AI UGC video ads every month",
          "Multiple creators and styles",
          "Hook and angle testing plan",
          "All formats: 9:16, 1:1 and 4:5",
          "Priority delivery and unlimited revisions"
        ]
      }
    ]
  }
];
