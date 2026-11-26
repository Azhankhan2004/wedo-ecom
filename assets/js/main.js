/* ==========================================================================
   WeDo Ecom — site script
   Renders the shared header/footer, wires contact links & smart modals,
   handles scroll reveals, Before/After slider, packages, case studies,
   gallery lightbox, and the AI-brief contact workflow.
   ========================================================================== */
(function () {
  "use strict";

  var W = window.WEDO || {};
  var cfg = W.config || {};
  var store = W.store || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var page = document.body.getAttribute("data-page") || "";

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function isPlaceholder(val, kind) {
    return store.isPlaceholder ? store.isPlaceholder(val, kind) : !val;
  }

  /* ---------- Icons ---------- */
  var icons = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.22 8.22 0 1 1 6.86 3.73Zm4.5-6.15c-.25-.12-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.17.25-.64.8-.78.96-.15.17-.29.19-.54.06a6.73 6.73 0 0 1-3.35-2.93c-.25-.44.25-.4.72-1.34.08-.17.04-.31-.02-.43l-.75-1.82c-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.66.31 2.77 2.77 0 0 0-.86 2.06 4.8 4.8 0 0 0 1 2.55 11 11 0 0 0 4.2 3.71c1.56.68 2.18.73 2.96.62.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 5.3A17.2 17.2 0 0 0 15.4 4l-.53 1.1a15.9 15.9 0 0 0-4.75 0L9.6 4a17.1 17.1 0 0 0-4.22 1.3C2.7 9.3 1.98 13.2 2.34 17.06A17.3 17.3 0 0 0 7.52 19.7l1.1-1.5a11 11 0 0 1-1.73-.84l.42-.33a12.3 12.3 0 0 0 10.5 0l.42.33c-.55.33-1.13.61-1.74.84l1.1 1.5a17.2 17.2 0 0 0 5.18-2.64c.43-4.47-.72-8.33-3.17-11.76ZM8.9 14.7c-1 0-1.84-.94-1.84-2.08 0-1.15.81-2.09 1.84-2.09 1.03 0 1.86.95 1.84 2.09 0 1.14-.81 2.08-1.84 2.08Zm6.2 0c-1 0-1.84-.94-1.84-2.08 0-1.15.81-2.09 1.84-2.09 1.03 0 1.86.95 1.84 2.09 0 1.14-.81 2.08-1.84 2.08Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
    play: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2 1.2v9.6L10.4 6z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };
  var logoMark = '<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#c4cf86"/><path d="M7 10.5l3.4 11 3.2-8.4 3.2 8.4 3.4-11" fill="none" stroke="#1a1d0e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24.5" cy="21" r="2" fill="#1a1d0e"/></svg>';

  /* ---------- Links from config ---------- */
  var links = {
    whatsapp: function (msg) {
      return "https://wa.me/" + String(cfg.whatsappNumber || "").replace(/\D/g, "") +
        "?text=" + encodeURIComponent(msg || cfg.whatsappMessage || "");
    },
    discord: cfg.discordInvite || "contact.html",
    booking: cfg.bookingUrl || "contact.html#inquiry",
    email: "mailto:" + (cfg.email || "")
  };

  /* ---------- Delivering requests to WeDo Ecom ----------
     Bookings and inquiries go to the first real channel set in config.js:
     WhatsApp, then email, then Instagram. Nothing is "sent" without one. */
  function deliveryChannel() {
    if (!isPlaceholder(cfg.whatsappNumber, "whatsapp")) return "whatsapp";
    if (!isPlaceholder(cfg.email, "email")) return "email";
    if ((cfg.socials || {}).instagram) return "instagram";
    return null;
  }
  function copyText(text) {
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}
  }
  function deliver(subject, text) {
    var ch = deliveryChannel(), href = null;
    if (ch === "whatsapp") href = links.whatsapp(text);
    if (ch === "email") href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    if (ch === "instagram") { href = cfg.socials.instagram; copyText(text); }
    if (href) {
      if (ch === "email") location.href = href;
      else window.open(href, "_blank", "noopener");
    }
    return { channel: ch, href: href, text: text };
  }
  function deliveryHtml(sent, copyId) {
    var again = sent.href ? ' If it didn\'t open, <a class="text-link" href="' + esc(sent.href) + '"' + (sent.channel === "email" ? "" : ' target="_blank" rel="noopener"') + ">open it again</a>." : "";
    var msg = {
      whatsapp: "<b>Almost done.</b> WhatsApp opened with your details filled in. Press send there, and we'll reply within one working day." + again,
      email: "<b>Almost done.</b> Your email app opened with your details filled in. Press send, and we'll reply within one working day." + again,
      instagram: "<b>Almost done.</b> We copied your details. Paste them in a message to us on Instagram, which just opened." + again
    }[sent.channel] || "<b>Not sent yet.</b> Our contact details are still being set up. Copy your details below and keep them handy, then send them to us once our contact links are live.";
    return msg + '<div class="btn-row" style="margin-top:.85rem"><button class="btn btn--ghost btn--sm" type="button" id="' + copyId + '">Copy my details</button></div>';
  }
  function bindCopy(root, copyId, text) {
    var b = root.querySelector("#" + copyId);
    if (b) b.addEventListener("click", function () { copyText(text); b.textContent = "Copied"; });
  }

  /* ---------- Smart Strategy Call & Connect Modals ---------- */
  var activeModal = null;
  var modalLastFocus = null;

  function ensureModalRoot() {
    var root = $("#wedo-modal");
    if (root) return root;
    root = document.createElement("div");
    root.id = "wedo-modal";
    root.className = "modal-backdrop";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.innerHTML = '<div class="modal-dialog"></div>';
    document.body.appendChild(root);
    root.addEventListener("click", function (e) {
      if (e.target === root) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && activeModal) closeModal();
    });
    return root;
  }

  function openModal(label, html) {
    var root = ensureModalRoot();
    root.setAttribute("aria-label", label);
    $(".modal-dialog", root).innerHTML = html;
    modalLastFocus = document.activeElement;
    root.classList.add("is-open");
    document.body.style.overflow = "hidden";
    activeModal = root;
    var closeBtn = $(".modal-close", root);
    if (closeBtn) closeBtn.focus();
    wireModalClose(root);
    return root;
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.classList.remove("is-open");
    document.body.style.overflow = "";
    activeModal = null;
    if (modalLastFocus && typeof modalLastFocus.focus === "function") modalLastFocus.focus();
  }

  function wireModalClose(root) {
    var closeBtn = $(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
  }

  function nextBusinessDays(count) {
    var days = [];
    var d = new Date();
    while (days.length < count) {
      d.setDate(d.getDate() + 1);
      var day = d.getDay();
      if (day === 0) continue; // skip Sunday
      days.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      });
    }
    return days;
  }

  function openBookingModal() {
    var days = nextBusinessDays(6);
    var times = [
      { value: "11:00", label: "11:00 AM" },
      { value: "14:00", label: "2:00 PM" },
      { value: "17:00", label: "5:00 PM" },
      { value: "20:00", label: "8:00 PM" }
    ];
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";

    var html =
      '<div class="modal-head">' +
        '<div><h2>Book your free strategy call</h2><p>30-minute store, ads &amp; creative review (' + esc(tz) + ').</p></div>' +
        '<button class="modal-close" type="button" aria-label="Close">' + icons.close + "</button>" +
      "</div>" +
      '<form id="booking-modal-form">' +
        '<span class="slot-label">1. Pick a day that suits you</span>' +
        '<div class="slot-grid" data-slot-group="date">' +
          days.map(function (d, i) {
            return '<button class="slot-btn" type="button" data-val="' + d.iso + '" data-label="' + esc(d.label) + '" aria-pressed="' + (i === 0) + '">' + esc(d.label) + "</button>";
          }).join("") +
        "</div>" +
        '<span class="slot-label">2. Pick a time that suits you</span>' +
        '<div class="slot-grid" data-slot-group="time">' +
          times.map(function (t, i) {
            return '<button class="slot-btn" type="button" data-val="' + t.value + '" data-label="' + esc(t.label) + '" aria-pressed="' + (i === 1) + '">' + esc(t.label) + "</button>";
          }).join("") +
        "</div>" +
        '<div class="form-grid">' +
          '<div class="field"><label for="bm-name">Your name</label><input id="bm-name" name="name" type="text" required placeholder="Full name"></div>' +
          '<div class="field"><label for="bm-email">Email</label><input id="bm-email" name="email" type="email" required placeholder="name@brand.com"></div>' +
          '<div class="field"><label for="bm-store">Store URL <span class="opt">(optional)</span></label><input id="bm-store" name="store" type="text" placeholder="yourstore.com"></div>' +
          '<div class="field"><label for="bm-focus">Main focus</label><select id="bm-focus" name="focus">' +
            "<option>Full growth stack (Store + Ads + AI UGC)</option>" +
            "<option>Shopify Store Design</option>" +
            "<option>Meta Ads Management</option>" +
            "<option>AI UGC Video Ads</option>" +
          "</select></div>" +
        "</div>" +
        '<div class="form-foot">' +
          "<small>Includes a free audit of your store and ad creatives.</small>" +
          '<button class="btn btn--primary" type="submit">Send call request</button>' +
        "</div>" +
        '<div class="form-status" id="bm-status" role="status"></div>' +
      "</form>";

    var root = openModal("Book a free strategy call", html);

    $$("[data-slot-group]", root).forEach(function (group) {
      group.addEventListener("click", function (e) {
        var btn = e.target.closest(".slot-btn");
        if (!btn) return;
        $$(".slot-btn", group).forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
      });
    });

    $("#booking-modal-form", root).addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.currentTarget;
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var storeUrl = form.elements.store.value.trim();
      var focus = form.elements.focus.value;
      var dateBtn = $('[data-slot-group="date"] .slot-btn[aria-pressed="true"]', root);
      var timeBtn = $('[data-slot-group="time"] .slot-btn[aria-pressed="true"]', root);
      var status = $("#bm-status", root);

      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        status.className = "form-status is-error";
        status.innerHTML = "Please enter your name and a valid email address.";
        return;
      }

      var dateIso = dateBtn.getAttribute("data-val");
      var dateLabel = dateBtn.getAttribute("data-label");
      var timeVal = timeBtn.getAttribute("data-val");
      var timeLabel = timeBtn.getAttribute("data-label");

      if (store.saveLead) {
        store.saveLead({
          type: "Strategy Call",
          name: name,
          email: email,
          website: storeUrl,
          services: focus,
          slot: dateLabel + " at " + timeLabel + " (" + tz + ")"
        });
      }

      var summary = "Hi WeDo Ecom, I'd like to book a free strategy call.\n" +
        "Preferred time: " + dateLabel + " at " + timeLabel + " (" + tz + ")\n" +
        "Name: " + name + "\nEmail: " + email +
        (storeUrl ? "\nStore: " + storeUrl : "") + "\nFocus: " + focus;

      var sent = deliver("Strategy call request: " + name, summary);
      status.className = "form-status is-success";
      status.innerHTML = deliveryHtml(sent, "bm-copy") + (sent.channel ? '<p style="margin:.75rem 0 0">We\'ll confirm the exact time when we reply.</p>' : "");
      bindCopy(status, "bm-copy", summary);
    });
  }

  function openConnectModal(kind, customMsg) {
    var isWa = kind === "whatsapp";
    var title = isWa ? "Chat with WeDo Ecom on WhatsApp" : "Discord Consultation";
    var note = isWa
      ? "Copy your pre-written intro below or send it through our inquiry form for a 1-day response."
      : "Join our client consultation channel or send your project brief below and we'll invite you directly.";
    var msg = customMsg || cfg.whatsappMessage || "Hi WeDo Ecom, I'd like to talk about growing my store.";
    var mailHref = "mailto:" + encodeURIComponent(cfg.email || "") +
      "?subject=" + encodeURIComponent("WeDo Ecom Inquiry") + "&body=" + encodeURIComponent(msg);

    var root = openModal(title,
      '<div class="modal-head">' +
        '<div><h2>' + title + "</h2><p>" + note + "</p></div>" +
        '<button class="modal-close" type="button" aria-label="Close">' + icons.close + "</button>" +
      "</div>" +
      '<div class="field"><label for="cm-msg">Your message</label>' +
        '<textarea id="cm-msg" rows="4">' + esc(msg) + "</textarea>" +
      "</div>" +
      '<div class="btn-row" style="margin-top:1rem">' +
        '<button class="btn btn--primary btn--sm" type="button" id="cm-copy">Copy message</button>' +
        '<a class="btn btn--ghost btn--sm" href="' + mailHref + '">Send by email</a>' +
        '<a class="btn btn--ghost btn--sm" href="contact.html#inquiry">Open full inquiry form</a>' +
      "</div>"
    );

    $("#cm-copy", root).addEventListener("click", function () {
      var val = $("#cm-msg", root).value;
      if (navigator.clipboard) navigator.clipboard.writeText(val);
      this.textContent = "Copied!";
    });
  }

  function wireLinks(root) {
    $$("[data-link]", root).forEach(function (a) {
      var type = a.getAttribute("data-link");
      var customMsg = a.getAttribute("data-msg");
      var href = type === "whatsapp" ? links.whatsapp(customMsg) : links[type];
      if (!href) return;

      if (type === "booking" && isPlaceholder(cfg.bookingUrl, "booking")) {
        a.setAttribute("href", "contact.html#inquiry");
        if (!a.dataset.modalBound) {
          a.dataset.modalBound = "1";
          a.addEventListener("click", function (e) {
            e.preventDefault();
            openBookingModal();
          });
        }
        return;
      }

      if (type === "discord" && isPlaceholder(cfg.discordInvite, "discord")) {
        a.setAttribute("href", "contact.html#inquiry");
        if (!a.dataset.modalBound) {
          a.dataset.modalBound = "1";
          a.addEventListener("click", function (e) {
            e.preventDefault();
            openConnectModal("discord", customMsg);
          });
        }
        return;
      }

      if (type === "whatsapp" && isPlaceholder(cfg.whatsappNumber, "whatsapp")) {
        a.setAttribute("href", "contact.html#inquiry");
        if (!a.dataset.modalBound) {
          a.dataset.modalBound = "1";
          a.addEventListener("click", function (e) {
            e.preventDefault();
            openConnectModal("whatsapp", customMsg);
          });
        }
        return;
      }

      a.setAttribute("href", href);
      if (/^https?:/.test(href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
    });
    $$("[data-email]", root).forEach(function (el) { el.textContent = cfg.email || ""; });
    $$("[data-icon]", root).forEach(function (el) { el.innerHTML = icons[el.getAttribute("data-icon")] || ""; });
  }

  /* ---------- Header & footer ---------- */
  var nav = [
    ["index.html", "Home", "home"],
    ["services.html", "Services", "services"],
    ["case-studies.html", "Case Studies", "cases"],
    ["gallery.html", "Creative Gallery", "gallery"],
    ["process.html", "Process", "process"],
    ["about.html", "About", "about"],
    ["contact.html", "Contact", "contact"]
  ];

  function renderHeader() {
    var slot = $("#site-header");
    if (!slot) return;
    var current = page === "case" ? "cases" : page;
    slot.className = "site-header";
    slot.innerHTML =
      '<div class="wrap">' +
        '<a class="logo" href="index.html" aria-label="WeDo Ecom home">' + logoMark + 'WeDo<span>Ecom</span></a>' +
        '<button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Open menu"><span></span></button>' +
        '<nav class="nav" id="primary-nav" aria-label="Main">' +
          '<ul class="nav-links">' + nav.map(function (n) {
            return '<li><a href="' + n[0] + '"' + (n[2] === current ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>";
          }).join("") + "</ul>" +
          (cfg.portalLogin ? '<a class="nav-login" href="' + esc(cfg.portalLogin) + '">Client login</a>' : "") +
          '<a class="btn btn--primary btn--sm" data-link="booking">Book a free strategy call</a>' +
        "</nav>" +
      "</div>" +
      '<div class="scroll-progress" aria-hidden="true"></div>';

    var toggle = $(".nav-toggle", slot);
    toggle.addEventListener("click", function () {
      var open = slot.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$(".nav a", slot).forEach(function (a) {
      a.addEventListener("click", function () {
        slot.classList.remove("is-open"); document.body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && slot.classList.contains("is-open")) toggle.click();
    });
    var onScroll = function () {
      slot.classList.toggle("is-scrolled", window.scrollY > 10);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      slot.style.setProperty("--scroll", ratio.toFixed(4));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function renderFooter() {
    var slot = $("#site-footer");
    if (!slot) return;
    var socials = cfg.socials || {};
    var socialLinks = Object.keys(socials).filter(function (k) { return socials[k]; }).map(function (k) {
      return '<li><a href="' + esc(socials[k]) + '" target="_blank" rel="noopener">' + k.charAt(0).toUpperCase() + k.slice(1) + "</a></li>";
    }).join("");
    slot.className = "site-footer";
    slot.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div class="footer-about"><a class="logo" href="index.html">' + logoMark + 'WeDo<span>Ecom</span></a>' +
            "<p>We build Shopify stores, run Meta ads and create AI UGC video ads for ecommerce brands that want to grow.</p></div>" +
          "<div><h4>Services</h4><ul>" +
            '<li><a href="services.html#shopify">Shopify store design</a></li>' +
            '<li><a href="services.html#meta-ads">Meta ads management</a></li>' +
            '<li><a href="services.html#ai-ugc">AI UGC video ads</a></li></ul></div>' +
          "<div><h4>Agency</h4><ul>" +
            '<li><a href="case-studies.html">Case studies</a></li>' +
            '<li><a href="gallery.html">Creative gallery</a></li>' +
            '<li><a href="process.html">Growth process</a></li>' +
            '<li><a href="about.html">About us</a></li>' +
            (cfg.portalLogin ? '<li><a href="' + esc(cfg.portalLogin) + '">Client login</a></li>' : "") + "</ul></div>" +
          "<div><h4>Talk to us</h4><ul>" +
            '<li><a data-link="whatsapp">WhatsApp</a></li>' +
            '<li><a data-link="discord">Discord</a></li>' +
            '<li><a data-link="booking">Book a call</a></li>' +
            '<li><a data-link="email">' + esc(cfg.email) + "</a></li>" + socialLinks + "</ul></div>" +
        "</div>" +
        '<div class="footer-base"><span>© ' + new Date().getFullYear() + " WeDo Ecom. All rights reserved. Designed &amp; Developed by " +
          '<a class="credit-link" href="https://www.linkedin.com/in/azhankhan0/" target="_blank" rel="noopener" aria-label="Azhan Khan on LinkedIn (opens in a new tab)">Azhan Khan</a>.</span>' +
          "<span>Built for ecommerce brands that want to grow.</span></div>" +
      "</div>";
  }

  function renderFloatingWhatsApp() {
    if (page === "contact" || page === "studio") return;
    var a = document.createElement("a");
    a.className = "float-wa";
    a.setAttribute("data-link", "whatsapp");
    a.setAttribute("aria-label", "Chat with us on WhatsApp");
    a.innerHTML = icons.whatsapp;
    document.body.appendChild(a);
  }

  /* ---------- Scroll Reveal ---------- */
  function initReveal() {
    var targets = $$("main .section, .pillars .pillar, .process-strip li, .step, .tier, .case-row, .g-item, .why-item, .mv-grid > div, .cta-band");
    if (!targets.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Placeholder artwork ---------- */
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }

  function placeholderArt(kind, seed, w, h) {
    w = w || 400; h = h || 500;
    var n = hash(seed || kind);
    var tone = ["#2b2e24", "#23251f", "#2f3128", "#1f2220"][n % 4];
    var lime = "#c4cf86", dim = "#8e9763", ink = "#0c0d0f";
    var cx = w / 2, cy = h / 2, s = Math.min(w, h);
    var bg = '<defs><radialGradient id="g' + n + '" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="' + tone + '"/><stop offset="1" stop-color="#0e0f0d"/></radialGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g' + n + ')"/>';
    var art = "";
    if (kind === "ugc") {
      art = '<circle cx="' + cx + '" cy="' + (h * 0.42) + '" r="' + s * 0.13 + '" fill="#3a3d33"/>' +
        '<path d="M' + (cx - s * 0.32) + " " + h + " Q " + cx + " " + (h * 0.5) + " " + (cx + s * 0.32) + " " + h + 'Z" fill="#33362d"/>' +
        '<rect x="' + (cx - s * 0.3) + '" y="' + (h * 0.68) + '" width="' + s * 0.6 + '" height="' + s * 0.09 + '" rx="6" fill="#f2f2ee"/>' +
        '<rect x="' + (cx - s * 0.22) + '" y="' + (h * 0.68 + s * 0.03) + '" width="' + s * 0.44 + '" height="' + s * 0.03 + '" rx="2" fill="#222"/>' +
        '<rect x="' + w * 0.06 + '" y="' + h * 0.03 + '" width="' + w * 0.88 + '" height="4" rx="2" fill="#ffffff33"/>' +
        '<rect x="' + w * 0.06 + '" y="' + h * 0.03 + '" width="' + w * (0.2 + (n % 50) / 100) + '" height="4" rx="2" fill="#fff"/>';
    } else if (kind === "shopify") {
      var bw = w * 0.82, bx = (w - bw) / 2, by = h * 0.12, bh = h * 0.76;
      art = '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="12" fill="' + ink + '" stroke="#2a2c31"/>' +
        '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh * 0.08 + '" rx="12" fill="#16171a"/>' +
        '<rect x="' + (bx + bw * 0.06) + '" y="' + (by + bh * 0.16) + '" width="' + bw * 0.46 + '" height="' + bh * 0.5 + '" rx="8" fill="' + tone + '"/>' +
        '<rect x="' + (bx + bw * 0.58) + '" y="' + (by + bh * 0.18) + '" width="' + bw * 0.3 + '" height="' + bh * 0.05 + '" rx="3" fill="#e9ebe4"/>' +
        '<rect x="' + (bx + bw * 0.58) + '" y="' + (by + bh * 0.28) + '" width="' + bw * 0.16 + '" height="' + bh * 0.04 + '" rx="3" fill="' + lime + '"/>' +
        '<rect x="' + (bx + bw * 0.58) + '" y="' + (by + bh * 0.38) + '" width="' + bw * 0.34 + '" height="' + bh * 0.025 + '" rx="2" fill="#26282c"/>' +
        '<rect x="' + (bx + bw * 0.58) + '" y="' + (by + bh * 0.44) + '" width="' + bw * 0.28 + '" height="' + bh * 0.025 + '" rx="2" fill="#26282c"/>' +
        '<rect x="' + (bx + bw * 0.58) + '" y="' + (by + bh * 0.56) + '" width="' + bw * 0.34 + '" height="' + bh * 0.08 + '" rx="' + bh * 0.04 + '" fill="' + lime + '"/>' +
        '<rect x="' + (bx + bw * 0.06) + '" y="' + (by + bh * 0.74) + '" width="' + bw * 0.27 + '" height="' + bh * 0.18 + '" rx="6" fill="#1d1f23"/>' +
        '<rect x="' + (bx + bw * 0.365) + '" y="' + (by + bh * 0.74) + '" width="' + bw * 0.27 + '" height="' + bh * 0.18 + '" rx="6" fill="#1d1f23"/>' +
        '<rect x="' + (bx + bw * 0.67) + '" y="' + (by + bh * 0.74) + '" width="' + bw * 0.27 + '" height="' + bh * 0.18 + '" rx="6" fill="#1d1f23"/>';
    } else if (kind === "product") {
      var pw = s * 0.26, ph = s * 0.46;
      art = '<ellipse cx="' + cx + '" cy="' + (cy + ph * 0.55) + '" rx="' + pw * 1.1 + '" ry="' + s * 0.03 + '" fill="#00000066"/>' +
        '<rect x="' + (cx - pw / 2) + '" y="' + (cy - ph / 2) + '" width="' + pw + '" height="' + ph + '" rx="' + pw * 0.2 + '" fill="#d9dccf"/>' +
        '<rect x="' + (cx - pw * 0.22) + '" y="' + (cy - ph / 2 - s * 0.07) + '" width="' + pw * 0.44 + '" height="' + s * 0.08 + '" rx="4" fill="' + dim + '"/>' +
        '<rect x="' + (cx - pw * 0.34) + '" y="' + (cy - ph * 0.05) + '" width="' + pw * 0.68 + '" height="' + ph * 0.28 + '" rx="4" fill="' + lime + '"/>' +
        '<circle cx="' + (cx + s * 0.28) + '" cy="' + (cy - s * 0.25) + '" r="' + s * 0.05 + '" fill="' + lime + '" opacity=".5"/>';
    } else if (kind === "ad-creative") {
      art = '<rect x="' + w * 0.08 + '" y="' + h * 0.1 + '" width="' + w * 0.6 + '" height="' + h * 0.07 + '" rx="4" fill="#e9ebe4"/>' +
        '<rect x="' + w * 0.08 + '" y="' + h * 0.2 + '" width="' + w * 0.45 + '" height="' + h * 0.07 + '" rx="4" fill="#e9ebe4"/>' +
        '<rect x="' + w * 0.08 + '" y="' + h * 0.31 + '" width="' + w * 0.3 + '" height="' + h * 0.035 + '" rx="3" fill="#6b6e67"/>' +
        '<circle cx="' + w * 0.66 + '" cy="' + h * 0.66 + '" r="' + s * 0.24 + '" fill="' + tone + '" stroke="' + dim + '"/>' +
        '<rect x="' + (w * 0.66 - s * 0.08) + '" y="' + (h * 0.66 - s * 0.15) + '" width="' + s * 0.16 + '" height="' + s * 0.3 + '" rx="8" fill="#d9dccf"/>' +
        '<rect x="' + w * 0.08 + '" y="' + h * 0.82 + '" width="' + w * 0.32 + '" height="' + h * 0.08 + '" rx="' + h * 0.04 + '" fill="' + lime + '"/>';
    } else {
      art = '<circle cx="' + w * 0.3 + '" cy="' + h * 0.4 + '" r="' + s * 0.22 + '" fill="none" stroke="' + lime + '" stroke-width="2"/>' +
        '<circle cx="' + w * 0.55 + '" cy="' + h * 0.5 + '" r="' + s * 0.3 + '" fill="' + dim + '" opacity=".35"/>' +
        '<rect x="' + w * 0.1 + '" y="' + h * 0.8 + '" width="' + w * 0.5 + '" height="' + h * 0.05 + '" rx="3" fill="#e9ebe4"/>' +
        '<rect x="' + w * 0.1 + '" y="' + h * 0.88 + '" width="' + w * 0.3 + '" height="' + h * 0.03 + '" rx="2" fill="#6b6e67"/>';
    }
    return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + bg + art + "</svg>";
  }

  var ratioClass = { "9:16": "r-916", "4:5": "r-45", "1:1": "r-11", "16:9": "r-169", "4:3": "r-43" };
  var ratioSize = { "9:16": [360, 640], "4:5": [400, 500], "1:1": [400, 400], "16:9": [640, 360], "4:3": [480, 360] };

  /* ---------- Hero stage (home) ---------- */
  function initStage() {
    var stage = $(".stage");
    if (!stage) return;
    var tabs = $$(".stage-tab", stage), panels = $$(".stage-panel", stage);
    var lines = $$(".hero h1 .line"), caption = $(".stage-caption", stage);
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var CYCLE = 5200, idx = 0, timer = null, paused = false;
    stage.style.setProperty("--cycle", CYCLE + "ms");

    function show(i) {
      idx = i;
      tabs.forEach(function (t, k) {
        t.setAttribute("aria-selected", k === i);
        t.tabIndex = k === i ? 0 : -1;
        var bar = $(".bar", t); if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      });
      panels.forEach(function (p, k) {
        p.classList.toggle("is-active", k === i);
        p.hidden = false;
        p.setAttribute("aria-hidden", k !== i);
        $$(".ugc-progress i, .mock-chart .line", p).forEach(function (el) { el.style.animation = "none"; void el.getBoundingClientRect(); el.style.animation = ""; });
      });
      lines.forEach(function (l, k) { l.classList.toggle("is-dim", k !== i); });
      if (caption) caption.textContent = tabs[i].getAttribute("data-caption") || "";
    }
    function schedule() {
      clearTimeout(timer);
      if (reduce || paused) return;
      timer = setTimeout(function () { show((idx + 1) % tabs.length); schedule(); }, CYCLE);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { paused = true; stage.classList.add("is-paused"); show(k); clearTimeout(timer); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (idx + d + tabs.length) % tabs.length;
        tabs[n].focus(); tabs[n].click();
      });
    });
    stage.addEventListener("mouseenter", function () { if (!paused) { clearTimeout(timer); stage.classList.add("is-paused"); } });
    stage.addEventListener("mouseleave", function () { if (!paused) { stage.classList.remove("is-paused"); schedule(); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else schedule(); });

    lines.forEach(function (l, k) { l.addEventListener("mouseenter", function () { if (!paused) { show(k); schedule(); } }); });

    show(0); schedule();
  }

  /* ---------- Packages (services page) ---------- */
  function priceHtml(p) {
    if (p.price == null || p.price === "") return 'Custom quote<small class="note">Priced after a short call</small>';
    return esc(cfg.currency || "$") + esc(p.price) + (p.period ? " <small>" + esc(p.period) + "</small>" : "");
  }

  function renderPackages() {
    $$("[data-packages]").forEach(function (slot) {
      var svc = (W.services || []).filter(function (s) { return s.id === slot.getAttribute("data-packages"); })[0];
      if (!svc || !svc.packages || !svc.packages.length) { slot.remove(); return; }
      slot.innerHTML =
        '<div class="packages-head"><h3>' + esc(svc.name) + " packages</h3>" + (svc.packagesNote ? "<p>" + esc(svc.packagesNote) + "</p>" : "") + "</div>" +
        '<div class="tiers">' + svc.packages.map(function (p) {
          var msg = "Hi WeDo Ecom, I'm interested in the " + p.name + " package for " + svc.name + ".";
          return '<div class="tier' + (p.featured ? " is-featured" : "") + '">' +
            '<div class="tier-top"><span class="tier-name">' + esc(p.name) + "</span>" + (p.featured ? '<span class="tier-badge">Most chosen</span>' : "") + "</div>" +
            '<p class="tier-for">' + esc(p.for) + "</p>" +
            '<div class="tier-price">' + priceHtml(p) + "</div>" +
            "<ul>" + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
            '<a class="btn ' + (p.featured ? "btn--primary" : "btn--ghost") + '" href="contact.html?service=' + esc(svc.id) + "&package=" + encodeURIComponent(p.name) + '#inquiry">Choose ' + esc(p.name) + "</a>" +
            '<a class="text-link" style="align-self:center" data-link="whatsapp" data-msg="' + esc(msg) + '">Ask on WhatsApp</a>' +
          "</div>";
        }).join("") + "</div>";
      wireLinks(slot);
    });
  }

  /* ---------- Case studies ---------- */
  var serviceNames = { "shopify": "Shopify store", "meta-ads": "Meta ads", "ai-ugc": "AI UGC" };

  function coverHtml(cs, size) {
    if (cs.cover) return '<img src="' + esc(cs.cover) + '" alt="' + esc(cs.client) + ' project" loading="lazy">';
    var kind = cs.services.indexOf("shopify") === 0 ? "shopify" : cs.services.indexOf("ai-ugc") > -1 ? "product" : "ad-creative";
    return '<div class="ph-art">' + placeholderArt(kind, cs.slug, size[0], size[1]) + "</div>";
  }

  function caseRow(cs) {
    return '<article class="case-row" data-services="' + esc(cs.services.join(" ")) + '">' +
      '<a class="case-cover" href="case-study.html?slug=' + esc(cs.slug) + '" tabindex="-1" aria-hidden="true">' + coverHtml(cs, [600, 480]) + "</a>" +
      '<div class="case-body">' +
        '<div class="case-meta">' + (cs.sample ? '<span class="tag tag--sample">Sample</span>' : "") +
          cs.services.map(function (s) { return '<span class="tag">' + esc(serviceNames[s] || s) + "</span>"; }).join("") + "</div>" +
        '<h3><a href="case-study.html?slug=' + esc(cs.slug) + '">' + esc(cs.title) + "</a></h3>" +
        "<p>" + esc(cs.summary) + "</p>" +
        '<div class="case-stats">' + (cs.stats || []).slice(0, 3).map(function (st) {
          return '<div class="case-stat"><b>' + esc(st.value) + "</b><span>" + esc(st.label) + "</span></div>";
        }).join("") + "</div>" +
        '<a class="text-link" style="align-self:flex-start" href="case-study.html?slug=' + esc(cs.slug) + '">Read the case study</a>' +
      "</div></article>";
  }

  function renderCaseList() {
    var list = $("[data-case-list]");
    if (!list) return;
    var all = W.caseStudies || [];
    var limit = parseInt(list.getAttribute("data-limit"), 10) || all.length;
    var draw = function (filter) {
      var items = all.filter(function (c) { return filter === "all" || c.services.indexOf(filter) > -1; }).slice(0, limit);
      list.innerHTML = items.length ? items.map(caseRow).join("") :
        '<p class="muted">No case studies for this service yet. <a class="text-link" href="contact.html">Be the first</a></p>';
    };
    var filters = $(".case-filters");
    if (filters) {
      var opts = [["all", "All work"]].concat(Object.keys(serviceNames).map(function (k) { return [k, serviceNames[k]]; }));
      filters.innerHTML = opts.map(function (o, i) {
        return '<button class="filter-btn" type="button" data-filter="' + o[0] + '" aria-pressed="' + (i === 0) + '">' + o[1] + "</button>";
      }).join("");
      filters.addEventListener("click", function (e) {
        var b = e.target.closest(".filter-btn"); if (!b) return;
        $$(".filter-btn", filters).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        draw(b.getAttribute("data-filter"));
      });
    }
    draw("all");
  }

  function renderCaseDetail() {
    var root = $("[data-case-detail]");
    if (!root) return;
    var slug = new URLSearchParams(location.search).get("slug");
    var all = W.caseStudies || [];
    var cs = all.filter(function (c) { return c.slug === slug; })[0];
    if (!cs) {
      root.innerHTML = '<section class="page-intro wrap"><p class="crumb"><a href="case-studies.html">Case studies</a></p>' +
        "<h1>We couldn't find that case study.</h1><p>It may have been renamed or removed.</p>" +
        '<div class="btn-row mt-2"><a class="btn btn--primary" href="case-studies.html">See all case studies</a></div></section>';
      document.title = "Case study not found | WeDo Ecom";
      return;
    }
    document.title = cs.title + " | WeDo Ecom case study";
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", cs.summary);

    var ba = "";
    if (cs.before && cs.after && (cs.before.caption || cs.before.image || cs.after.caption || cs.after.image)) {
      var mediaMarkup = function (obj, kind, label) {
        return obj.image
          ? '<img src="' + esc(obj.image) + '" alt="' + label + '" loading="lazy">'
          : '<div class="ph-art">' + placeholderArt(kind, cs.slug + label, 800, 450) + "</div>";
      };
      var fig = function (label, obj, kind) {
        return '<figure><div class="ba-media">' + (obj.image ? '<img src="' + esc(obj.image) + '" alt="' + label + '" loading="lazy">' :
          '<div class="ph-art">' + placeholderArt(kind, cs.slug + label, 480, 360) + "</div>") +
          "</div><figcaption><b>" + label + ".</b> " + esc(obj.caption) + "</figcaption></figure>";
      };
      ba = '<div class="case-section"><h2>Before and after</h2><div>' +
        '<div class="ba-compare" style="--pos:50%">' +
          '<div class="ba-layer">' + mediaMarkup(cs.before, "visuals", "Before") + "</div>" +
          '<div class="ba-layer ba-after-clip">' + mediaMarkup(cs.after, "shopify", "After") + "</div>" +
          '<span class="ba-pill ba-pill--before">Before</span>' +
          '<span class="ba-pill ba-pill--after">After</span>' +
          '<div class="ba-divider" aria-hidden="true"></div>' +
          '<div class="ba-handle" aria-hidden="true">⇄</div>' +
          '<input type="range" min="5" max="95" value="50" aria-label="Before and after comparison slider">' +
        "</div>" +
        '<div class="before-after">' + fig("Before", cs.before, "visuals") + fig("After", cs.after, "shopify") + "</div></div></div>";
    }

    var idx = all.indexOf(cs), next = all[(idx + 1) % all.length];
    root.innerHTML =
      '<section class="page-intro wrap">' +
        '<p class="crumb"><a href="case-studies.html">Case studies</a><span aria-hidden="true">/</span><span>' + esc(cs.client) + "</span></p>" +
        '<div class="case-meta" style="margin-bottom:1.5rem">' + (cs.sample ? '<span class="tag tag--sample">Sample</span>' : "") +
          cs.services.map(function (s) { return '<span class="tag">' + esc(serviceNames[s]) + "</span>"; }).join("") +
          '<span class="tag">' + esc(cs.industry) + '</span><span class="tag">' + esc(cs.duration) + "</span></div>" +
        '<h1 style="max-width:20ch">' + esc(cs.title) + "</h1>" +
        "<p>" + esc(cs.summary) + "</p>" +
        (cs.sample ? '<div class="sample-notice"><span><b>This is a sample case study</b> that shows how real projects will appear. The numbers are examples, not client results.</span></div>' : "") +
        '<div class="case-hero-stats">' + (cs.stats || []).map(function (st) {
          return "<div><b>" + esc(st.value) + "</b><span>" + esc(st.label) + "</span></div>";
        }).join("") + "</div>" +
      "</section>" +
      '<section class="section wrap" style="padding-top:0">' +
        '<div class="case-cover-lg">' + coverHtml(cs, [1200, 600]) + "</div>" +
        '<div class="mt-3">' +
          '<div class="case-section"><h2>The client</h2><div class="prose"><p>' + esc(cs.overview) + "</p></div></div>" +
          '<div class="case-section"><h2>The challenge</h2><ul class="checklist">' + (cs.challenges || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>" +
          '<div class="case-section"><h2>Our approach</h2><div class="prose"><p>' + esc(cs.strategy) + "</p></div></div>" +
          '<div class="case-section"><h2>What we did</h2><div class="case-meta">' + cs.services.map(function (s) {
            return '<a class="chip" href="services.html#' + esc(s) + '">' + esc(serviceNames[s]) + "</a>"; }).join("") + "</div></div>" +
          '<div class="case-section"><h2>The results</h2><div class="prose"><p>' + esc(cs.results) + "</p></div></div>" +
          ba +
        "</div>" +
      "</section>" +
      '<section class="section wrap" style="padding-top:0"><div class="cta-band"><div><h2>Want results like this for your store?</h2>' +
        "<p>Tell us about your brand and we'll show you where the quickest wins are.</p></div>" +
        '<div class="btn-row"><a class="btn btn--primary" data-link="booking">Book a free strategy call</a>' +
        (next && next !== cs ? '<a class="btn btn--ghost" href="case-study.html?slug=' + esc(next.slug) + '">Next case study</a>' : "") + "</div></div></section>";

    var slider = $(".ba-compare input[type=range]", root);
    if (slider) {
      slider.addEventListener("input", function () {
        slider.parentElement.style.setProperty("--pos", slider.value + "%");
      });
    }
    wireLinks(root);
  }

  /* ---------- Gallery + lightbox ---------- */
  function renderGallery() {
    var grid = $("[data-gallery]");
    if (!grid) return;
    var items = W.gallery || [], cats = W.galleryCategories || {};
    var limit = parseInt(grid.getAttribute("data-limit"), 10) || items.length;
    var visible = [];

    function mediaHtml(it, inLightbox) {
      var r = ratioSize[it.ratio] || [400, 500];
      if (it.src && it.type === "video") {
        return inLightbox ? '<video src="' + esc(it.src) + '" ' + (it.poster ? 'poster="' + esc(it.poster) + '" ' : "") + "controls autoplay playsinline></video>"
          : (it.poster ? '<img src="' + esc(it.poster) + '" alt="' + esc(it.title) + '" loading="lazy">' : '<video src="' + esc(it.src) + '#t=0.5" muted playsinline preload="metadata"></video>');
      }
      if (it.src) return '<img src="' + esc(it.src) + '" alt="' + esc(it.title) + '" loading="lazy">';
      return '<div class="ph-art">' + placeholderArt(it.category, it.title, r[0], r[1]) + "</div>";
    }

    function draw(filter) {
      visible = items.filter(function (it) { return filter === "all" || it.category === filter; }).slice(0, limit);
      grid.innerHTML = visible.length ? visible.map(function (it, i) {
        return '<button class="g-item" type="button" data-i="' + i + '" aria-label="Open ' + esc(it.title) + '">' +
          '<div class="g-media ' + (ratioClass[it.ratio] || "r-45") + '">' + mediaHtml(it, false) +
            (it.type === "video" ? '<span class="g-play">' + icons.play + "</span>" : "") + "</div>" +
          '<div class="g-cap"><b>' + esc(it.title) + "</b><span>" + esc(cats[it.category] || "") + (it.client ? ", " + esc(it.client) : "") + "</span></div>" +
        "</button>";
      }).join("") : '<p class="gallery-empty">New work in this category is coming soon.</p>';
    }

    var filters = $(".gallery-filters");
    if (filters) {
      var opts = [["all", "All work"]].concat(Object.keys(cats).map(function (k) { return [k, cats[k]]; }));
      filters.innerHTML = opts.map(function (o, i) {
        return '<button class="filter-btn" type="button" data-filter="' + o[0] + '" aria-pressed="' + (i === 0) + '">' + esc(o[1]) + "</button>";
      }).join("");
      filters.addEventListener("click", function (e) {
        var b = e.target.closest(".filter-btn"); if (!b) return;
        $$(".filter-btn", filters).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        draw(b.getAttribute("data-filter"));
      });
    }
    draw("all");

    var lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Creative preview");
    lb.innerHTML = '<button class="lb-btn lb-close" type="button" aria-label="Close">' + icons.close + "</button>" +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous">' + icons.prev + "</button>" +
      '<button class="lb-btn lb-next" type="button" aria-label="Next">' + icons.next + "</button>" +
      '<div class="lightbox-inner"><div class="lightbox-media"></div><div class="lightbox-cap"></div></div>';
    document.body.appendChild(lb);
    var cur = 0, lastFocus = null;
    function open(i) {
      cur = (i + visible.length) % visible.length;
      var it = visible[cur], r = ratioSize[it.ratio] || [400, 500];
      var media = $(".lightbox-media", lb);
      media.innerHTML = it.src ? mediaHtml(it, true) :
        '<div class="ph-wrap" style="aspect-ratio:' + r[0] + "/" + r[1] + ";max-height:72vh;width:auto;height:min(72vh," + Math.round(520 * r[1] / r[0]) + 'px)">' + mediaHtml(it, true) + "</div>";
      $(".lightbox-cap", lb).innerHTML = "<b>" + esc(it.title) + "</b><span>" + esc(cats[it.category] || "") + (it.client ? ", " + esc(it.client) : "") +
        (it.src ? "" : ". Placeholder artwork, real work coming soon.") + "</span>";
      if (!lb.classList.contains("is-open")) { lastFocus = document.activeElement; lb.classList.add("is-open"); document.body.style.overflow = "hidden"; $(".lb-close", lb).focus(); }
    }
    function close() {
      lb.classList.remove("is-open"); document.body.style.overflow = "";
      $(".lightbox-media", lb).innerHTML = "";
      if (lastFocus) lastFocus.focus();
    }
    grid.addEventListener("click", function (e) { var b = e.target.closest(".g-item"); if (b) open(+b.getAttribute("data-i")); });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { open(cur - 1); });
    $(".lb-next", lb).addEventListener("click", function () { open(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(cur - 1);
      if (e.key === "ArrowRight") open(cur + 1);
      if (e.key === "Tab") {
        var f = $$("button, video", lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Contact form + project summary ---------- */
  function buildGrowthBrief(d) {
    var tier = "Launch Plan";
    if (/\$5,000|\$10,000/i.test(d.budget)) tier = "Scale Plan";
    else if (/\$2,000/i.test(d.budget)) tier = "Growth Plan";

    var ch = d.challenges.toLowerCase();
    var focus = "Full-funnel store, creative & Meta ad audit";
    if (/convert|cart|checkout|slow|website|store/i.test(ch)) focus = "Product page conversion, trust signals & checkout flow";
    else if (/creative|video|hook|fatigue|ugc/i.test(ch)) focus = "Fresh AI UGC hooks & creative testing velocity";
    else if (/roas|cpa|cost|scale|ads|meta/i.test(ch)) focus = "Campaign consolidation & winning ad-set scaling";

    return {
      recommendedTier: tier,
      priorityFocus: focus,
      weekOneAction: d.website
        ? "Audit " + d.website + " + review ad account structure & top 3 competitor angles"
        : "Storefront blueprint + 3 AI UGC script hooks tailored to " + d.business
    };
  }

  function initForm() {
    var form = $("#inquiry-form");
    if (!form) return;
    var status = $(".form-status", form);
    var params = new URLSearchParams(location.search);

    var svc = params.get("service");
    if (svc) { var box = $('input[name="services"][value="' + svc + '"]', form); if (box) box.checked = true; }
    var pkg = params.get("package");
    if (pkg) { var goals = $("#f-goals", form); if (goals && !goals.value) goals.value = "Interested in the " + pkg + " package. "; }

    var rules = {
      name: function (v) { return v.trim().length >= 2 || "Enter your name."; },
      business: function (v) { return v.trim().length >= 2 || "Enter your business or brand name."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter a valid email, like name@brand.com."; },
      website: function (v) { return !v.trim() || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\S*$/i.test(v.trim()) || "Enter a valid link, like yourstore.com."; },
      budget: function (v) { return !!v || "Choose a monthly ad budget."; },
      challenges: function (v) { return v.trim().length >= 10 || "Tell us a little more (at least 10 characters)."; }
    };

    function setError(name, msg) {
      var field = form.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      var err = $(".field-error", field);
      field.classList.toggle("has-error", !!msg);
      if (err) err.textContent = msg || "";
      var input = field.querySelector("input:not([type=checkbox]), select, textarea");
      if (input) input.setAttribute("aria-invalid", !!msg);
    }
    function validate() {
      var ok = true, firstBad = null;
      Object.keys(rules).forEach(function (n) {
        var el = form.elements[n], res = rules[n](el.value);
        setError(n, res === true ? "" : res);
        if (res !== true) { ok = false; firstBad = firstBad || el; }
      });
      var picked = $$('input[name="services"]:checked', form).length;
      setError("services", picked ? "" : "Pick at least one service.");
      if (!picked) { ok = false; firstBad = firstBad || $('input[name="services"]', form); }
      if (firstBad) firstBad.focus();
      return ok;
    }
    Object.keys(rules).forEach(function (n) {
      form.elements[n].addEventListener("blur", function () {
        var field = form.querySelector('[data-field="' + n + '"]');
        if (field.classList.contains("has-error") || this.value) { var r = rules[n](this.value); setError(n, r === true ? "" : r); }
      });
    });
    $$('input[name="services"]', form).forEach(function (c) { c.addEventListener("change", function () { setError("services", ""); }); });

    function collect() {
      var d = {};
      ["name", "business", "email", "website", "budget", "challenges", "goals"].forEach(function (n) { d[n] = form.elements[n].value.trim(); });
      d.services = $$('input[name="services"]:checked', form).map(function (c) { return c.getAttribute("data-label"); }).join(", ");
      return d;
    }
    function briefText(d, brief) {
      return "Hi WeDo Ecom, here is my project inquiry.\n\n" +
        "Name: " + d.name + "\nBusiness: " + d.business + "\nEmail: " + d.email +
        (d.website ? "\nStore: " + d.website : "") +
        "\nServices: " + d.services +
        "\nMonthly ad budget: " + d.budget +
        
        "\n\nChallenges: " + d.challenges +
        (d.goals ? "\n\nGoals: " + d.goals : "");
    }
    function renderConfirmation(d, brief, sentToGoogle) {
      var fullBrief = briefText(d, brief);
      var head = sentToGoogle
        ? "<b>Inquiry sent.</b> Thanks, " + esc(d.name.split(" ")[0]) + ". We'll review your store and reply within one working day." +
          '<div class="btn-row" style="margin-top:.85rem"><button class="btn btn--ghost btn--sm" type="button" id="ai-copy-brief">Copy my details</button></div>'
        : deliveryHtml(deliver("Growth inquiry: " + d.business, fullBrief), "ai-copy-brief");

      status.className = "form-status is-success";
      status.innerHTML = head +
        '<div class="ai-brief" style="margin-top:1rem">' +
          '<p style="margin:0;color:var(--muted)">Your project summary</p>' +
          '<div class="ai-brief-grid">' +
            '<div class="ai-brief-box"><b>Suggested starting package</b><span>' + esc(brief.recommendedTier) + "</span></div>" +
            '<div class="ai-brief-box"><b>Where we\'d start</b><span>' + esc(brief.priorityFocus) + "</span></div>" +
          "</div>" +
          '<div class="ai-brief-box"><b>First week</b><p>' + esc(brief.weekOneAction) + "</p></div>" +
          '<p style="margin:0;color:var(--faint);font-size:var(--fs-xs)">A first suggestion based on your answers. We\'ll confirm the plan after looking at your store.</p>' +
        "</div>";
      bindCopy(status, "ai-copy-brief", fullBrief);
      status.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.company_site && form.elements.company_site.value) return;
      if (!validate()) return;
      var d = collect();
      var brief = buildGrowthBrief(d);
      var gf = cfg.googleForm || {}, btn = $("button[type=submit]", form);

      if (store.saveLead) {
        store.saveLead(Object.assign({ type: "Inquiry Form", recommendedTier: brief.recommendedTier }, d));
      }

      if (!gf.formId) {
        renderConfirmation(d, brief, false);
        return;
      }

      var body = new URLSearchParams();
      Object.keys(gf.fields || {}).forEach(function (k) { if (gf.fields[k] && d[k] != null) body.append(gf.fields[k], d[k]); });
      btn.disabled = true; btn.textContent = "Sending…";
      fetch("https://docs.google.com/forms/d/e/" + gf.formId + "/formResponse", { method: "POST", mode: "no-cors", body: body })
        .then(function () {
          form.reset();
          renderConfirmation(d, brief, true);
        })
        .catch(function () {
          // The Google Form didn't take it: fall back to WhatsApp/email.
          renderConfirmation(d, brief, false);
        })
        .then(function () { btn.disabled = false; btn.textContent = "Send inquiry"; });
    });
  }

  /* ---------- Run ---------- */
  renderHeader();
  renderFooter();
  renderFloatingWhatsApp();
  initStage();
  renderPackages();
  renderCaseList();
  renderCaseDetail();
  renderGallery();
  initForm();
  wireLinks(document);
  initReveal();
})();
