/* ==========================================================================
   SITE SETTINGS — edit this file to update contact links and form settings.
   Anything marked TODO is a placeholder that should be replaced before launch.
   ========================================================================== */
window.WEDO = window.WEDO || {};

WEDO.config = {
  brand: "WeDo Ecom",
  tagline: "Ecommerce growth agency",
  email: "hello@wedoecom.com", // TODO: replace with your real email

  // WhatsApp number in international format, digits only (no +, spaces or dashes).
  // Example for Pakistan: 923001234567
  whatsappNumber: "923000000000", // TODO
  whatsappMessage: "Hi WeDo Ecom, I'd like to talk about growing my store.",

  discordInvite: "https://discord.gg/your-invite", // TODO
  bookingUrl: "https://calendly.com/your-link/strategy-call", // TODO: Calendly, Cal.com or Google Calendar booking link

  /* Contact form → Google Form
     1. Create a Google Form with the same questions as the contact page.
     2. Open the form, click ⋮ → "Get pre-filled link", fill every answer, copy the link.
     3. Paste the form ID and each "entry.XXXXXXX" number below.
     While formId is empty, the form sends the inquiry to WhatsApp instead, so it always works. */
  googleForm: {
    formId: "", // e.g. "1FAIpQLSd...." (the part between /d/e/ and /viewform)
    fields: {
      name: "",          // e.g. "entry.123456789"
      business: "",
      email: "",
      website: "",
      services: "",
      budget: "",
      challenges: "",
      goals: ""
    }
  },

  socials: {
    instagram: "", // TODO: e.g. "https://instagram.com/wedoecom" — empty links are hidden
    facebook: "",
    linkedin: "",
    tiktok: ""
  },

  // Client portal sign-in page. Leave empty to hide the "Client login" links
  // (the portal only works once the site runs on Cloudflare).
  portalLogin: "",

  // Currency shown next to package prices
  currency: "$"
};
