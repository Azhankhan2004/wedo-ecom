/* ==========================================================================
   WeDo Ecom — Studio Data Store
   Merges repo defaults (config.js, packages.js, case-studies.js, gallery.js)
   with any updates saved through studio.html in localStorage.
   Allows live portfolio editing without a backend, plus 1-click JS export.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "wedo_studio_v1";
  var LEADS_KEY = "wedo_leads_v1";
  var W = (window.WEDO = window.WEDO || {});

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  var defaults = {
    config: clone(W.config || {}),
    services: clone(W.services || []),
    caseStudies: clone(W.caseStudies || []),
    gallery: clone(W.gallery || []),
    galleryCategories: clone(W.galleryCategories || {})
  };

  function readOverride() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function applyState() {
    var saved = readOverride();
    W.config = clone(defaults.config);
    W.services = clone(defaults.services);
    W.caseStudies = clone(defaults.caseStudies);
    W.gallery = clone(defaults.gallery);
    W.galleryCategories = clone(defaults.galleryCategories);

    if (!saved) return;
    if (saved.config) {
      W.config = Object.assign({}, W.config, saved.config);
      if (saved.config.googleForm) {
        W.config.googleForm = Object.assign({}, defaults.config.googleForm || {}, saved.config.googleForm);
      }
      if (saved.config.socials) {
        W.config.socials = Object.assign({}, defaults.config.socials || {}, saved.config.socials);
      }
    }
    if (Array.isArray(saved.services)) W.services = saved.services;
    if (Array.isArray(saved.caseStudies)) W.caseStudies = saved.caseStudies;
    if (Array.isArray(saved.gallery)) W.gallery = saved.gallery;
    if (saved.galleryCategories && typeof saved.galleryCategories === "object") {
      W.galleryCategories = saved.galleryCategories;
    }
  }

  function saveOverride(patch) {
    var current = readOverride() || {};
    var next = Object.assign({}, current, patch);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyState();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Browser storage is full. Use image paths instead of large uploaded files." };
    }
  }

  function resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    applyState();
  }

  function hasOverrides() {
    return !!readOverride();
  }

  function readLeads() {
    try {
      var raw = localStorage.getItem(LEADS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLead(entry) {
    var list = readLeads();
    list.unshift(Object.assign({ id: "lead_" + Date.now(), createdAt: new Date().toISOString() }, entry));
    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(list.slice(0, 100)));
    } catch (e) {}
    return list;
  }

  function clearLeads() {
    try {
      localStorage.removeItem(LEADS_KEY);
    } catch (e) {}
  }

  function isPlaceholder(val, kind) {
    var s = String(val || "").trim();
    if (!s) return true;
    if (kind === "whatsapp") {
      var digits = s.replace(/\D/g, "");
      return !digits || /^9230+$/.test(digits) || /^0+$/.test(digits);
    }
    if (kind === "discord") {
      return /your-invite|example\.com/i.test(s);
    }
    if (kind === "booking") {
      return /your-link|example\.com/i.test(s);
    }
    if (kind === "email") {
      return !s || s.toLowerCase() === "hello@wedoecom.com";
    }
    return false;
  }

  function formatJsExport(kind) {
    if (kind === "case-studies") {
      return (
        "/* Exported from WeDo Ecom Studio Manager */\n" +
        "window.WEDO = window.WEDO || {};\n\n" +
        "WEDO.caseStudies = " + JSON.stringify(W.caseStudies, null, 2) + ";\n"
      );
    }
    if (kind === "gallery") {
      return (
        "/* Exported from WeDo Ecom Studio Manager */\n" +
        "window.WEDO = window.WEDO || {};\n\n" +
        "WEDO.galleryCategories = " + JSON.stringify(W.galleryCategories, null, 2) + ";\n\n" +
        "WEDO.gallery = " + JSON.stringify(W.gallery, null, 2) + ";\n"
      );
    }
    if (kind === "packages") {
      return (
        "/* Exported from WeDo Ecom Studio Manager */\n" +
        "window.WEDO = window.WEDO || {};\n\n" +
        "WEDO.services = " + JSON.stringify(W.services, null, 2) + ";\n"
      );
    }
    if (kind === "config") {
      return (
        "/* Exported from WeDo Ecom Studio Manager */\n" +
        "window.WEDO = window.WEDO || {};\n\n" +
        "WEDO.config = " + JSON.stringify(W.config, null, 2) + ";\n"
      );
    }
    return "";
  }

  applyState();

  W.store = {
    defaults: defaults,
    save: saveOverride,
    reset: resetAll,
    hasOverrides: hasOverrides,
    isPlaceholder: isPlaceholder,
    readLeads: readLeads,
    saveLead: saveLead,
    clearLeads: clearLeads,
    exportJs: formatJsExport
  };
})();
