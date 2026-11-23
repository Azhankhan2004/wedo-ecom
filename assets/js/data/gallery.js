/* ==========================================================================
   CREATIVE GALLERY
   How to add work:
   1. Put the file in assets/media/gallery/ (jpg, png, webp, or mp4 for video).
   2. Add an object to the list below.
      - type:     "image" or "video"
      - src:      path to the file, e.g. "assets/media/gallery/serum-ugc.mp4"
      - poster:   (videos only) a still image shown before playing
      - category: one of the keys in WEDO.galleryCategories
      - ratio:    "9:16", "4:5", "1:1", "4:3" or "16:9" (keeps the grid tidy)
   Items with an empty `src` show placeholder artwork — replace them with real work.
   ========================================================================== */
window.WEDO = window.WEDO || {};

WEDO.galleryCategories = {
  "ugc": "AI UGC videos",
  "ad-creative": "Ad creatives",
  "product": "Product ads",
  "shopify": "Shopify stores",
  "visuals": "Marketing visuals"
};

WEDO.gallery = [
  { title: "Serum morning routine", client: "Skincare", category: "ugc", type: "video", ratio: "9:16", src: "", poster: "" },
  { title: "Summer sale carousel", client: "Fashion", category: "ad-creative", type: "image", ratio: "4:5", src: "" },
  { title: "Storefront redesign", client: "Home & living", category: "shopify", type: "image", ratio: "4:3", src: "" },
  { title: "Kitchen gadget hook test", client: "Home gadgets", category: "ugc", type: "video", ratio: "9:16", src: "", poster: "" },
  { title: "Hero product shot", client: "Fragrance", category: "product", type: "image", ratio: "1:1", src: "" },
  { title: "Launch announcement", client: "Streetwear", category: "visuals", type: "image", ratio: "4:5", src: "" },
  { title: "Unboxing reaction", client: "Tech accessories", category: "ugc", type: "video", ratio: "9:16", src: "", poster: "" },
  { title: "Mobile product page", client: "Skincare", category: "shopify", type: "image", ratio: "9:16", src: "" },
  { title: "Benefit-led static ad", client: "Supplements", category: "ad-creative", type: "image", ratio: "1:1", src: "" },
  { title: "Before and after product ad", client: "Cleaning", category: "product", type: "image", ratio: "4:5", src: "" },
  { title: "Eid campaign banner", client: "Modest fashion", category: "visuals", type: "image", ratio: "16:9", src: "" },
  { title: "Problem-solution UGC", client: "Pet care", category: "ugc", type: "video", ratio: "9:16", src: "", poster: "" }
];
