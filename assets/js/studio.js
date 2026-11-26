/* ==========================================================================
   WeDo Ecom — Studio Manager UI (studio.html)
   Lets the agency owner manage Case Studies, Creative Gallery, Packages,
   Contact/Booking Config, and inspect Inquiries & Strategy Call requests.
   ========================================================================== */
(function () {
  "use strict";

  var W = window.WEDO || {};
  var store = W.store;
  if (!store) return;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function slugify(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || ("project-" + Date.now());
  }

  function compressImage(file, maxDim, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/webp", 0.82));
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  var workspace = $("#studio-workspace");
  var bannerMsg = $("#studio-storage-msg");
  var currentTab = (location.hash || "").replace("#", "");
  if (["cases", "gallery", "packages", "leads"].indexOf(currentTab) === -1) currentTab = "cases";

  var editingCaseIdx = null;
  var editingGalleryIdx = null;

  function updateBanner(notice) {
    if (notice) {
      bannerMsg.innerHTML = "<b>Updated:</b> " + esc(notice);
      return;
    }
    bannerMsg.innerHTML = store.hasOverrides()
      ? "<b>Preview mode.</b> Your edits are saved in this browser only. Visitors won't see them until you export the files below and upload them to GitHub."
      : "<b>Showing the live site's content.</b> Edits you make here are a private preview in this browser. To publish them, export the files below and upload them to GitHub.";
  }

  function setTab(tab) {
    currentTab = tab;
    if (history.replaceState) history.replaceState(null, "", "#" + tab);
    $$("[data-studio-tab]").forEach(function (btn) {
      btn.setAttribute("aria-selected", btn.getAttribute("data-studio-tab") === tab);
    });
    renderTab();
  }

  /* ---------- Tab 1: Case Studies ---------- */
  function renderCasesTab() {
    var list = W.caseStudies || [];
    var item = editingCaseIdx != null && list[editingCaseIdx] ? list[editingCaseIdx] : {
      slug: "",
      sample: false,
      client: "",
      industry: "",
      title: "",
      summary: "",
      services: ["shopify", "meta-ads"],
      duration: "8 weeks",
      cover: "",
      stats: [
        { value: "3.2x", label: "Return on ad spend" },
        { value: "+65%", label: "Conversion rate" },
        { value: "-28%", label: "Cost per purchase" }
      ],
      overview: "",
      challenges: ["Low product page conversion", "Ad fatigue on old creatives"],
      strategy: "",
      results: "",
      before: { image: "", caption: "" },
      after: { image: "", caption: "" }
    };

    var s0 = (item.stats && item.stats[0]) || { value: "", label: "" };
    var s1 = (item.stats && item.stats[1]) || { value: "", label: "" };
    var s2 = (item.stats && item.stats[2]) || { value: "", label: "" };

    workspace.innerHTML =
      '<div class="studio-split">' +
        '<div>' +
          '<div class="packages-head" style="margin-bottom:1rem"><h3>Existing Case Studies (' + list.length + ')</h3>' +
            '<button class="btn btn--ghost btn--sm" type="button" id="cs-new-btn">+ New case study</button></div>' +
          '<div class="studio-list">' +
            (list.length ? list.map(function (c, i) {
              return '<div class="studio-item">' +
                '<div class="studio-item-head">' +
                  '<div><h3>' + esc(c.client || c.title) + (c.sample ? ' <span class="tag tag--sample">Sample</span>' : "") + "</h3>" +
                  "<p>" + esc(c.title) + "</p></div>" +
                "</div>" +
                '<div class="studio-actions">' +
                  '<button class="btn-xs" type="button" data-cs-act="edit" data-i="' + i + '">Edit</button>' +
                  '<a class="btn-xs" href="case-study.html?slug=' + esc(c.slug) + '" target="_blank">Preview</a>' +
                  '<button class="btn-xs" type="button" data-cs-act="up" data-i="' + i + '">Move up</button>' +
                  '<button class="btn-xs" type="button" data-cs-act="down" data-i="' + i + '">Move down</button>' +
                  '<button class="btn-xs btn-xs--danger" type="button" data-cs-act="del" data-i="' + i + '">Delete</button>' +
                "</div>" +
              "</div>";
            }).join("") : '<p class="muted">No case studies yet. Add one using the form.</p>') +
          "</div>" +
        "</div>" +
        '<form class="studio-panel" id="cs-form">' +
          "<h2>" + (editingCaseIdx != null ? "Edit Case Study" : "Add Client Case Study") + "</h2>" +
          '<div class="form-grid">' +
            '<div class="field"><label for="cs-client">Client / Brand name</label><input id="cs-client" name="client" required value="' + esc(item.client) + '" placeholder="e.g. GlowCo Skincare"></div>' +
            '<div class="field"><label for="cs-industry">Industry</label><input id="cs-industry" name="industry" required value="' + esc(item.industry) + '" placeholder="e.g. Beauty &amp; skincare"></div>' +
            '<div class="field full"><label for="cs-title">Headline</label><input id="cs-title" name="title" required value="' + esc(item.title) + '" placeholder="e.g. How GlowCo scaled to 3.4x ROAS in 90 days"></div>' +
            '<div class="field"><label for="cs-slug">URL slug <span class="opt">(auto if empty)</span></label><input id="cs-slug" name="slug" value="' + esc(item.slug) + '" placeholder="glowco-skincare"></div>' +
            '<div class="field"><label for="cs-duration">Timeline</label><input id="cs-duration" name="duration" value="' + esc(item.duration) + '" placeholder="12 weeks"></div>' +
            '<fieldset class="field full"><legend>Services provided</legend><div class="check-group">' +
              ["shopify", "meta-ads", "ai-ugc"].map(function (svc) {
                var labels = { "shopify": "Shopify Store Design", "meta-ads": "Meta Ads Management", "ai-ugc": "AI UGC Video Ads" };
                var checked = (item.services || []).indexOf(svc) > -1 ? " checked" : "";
                return '<label class="check-pill"><input type="checkbox" name="services" value="' + svc + '"' + checked + "><span>" + labels[svc] + "</span></label>";
              }).join("") +
            "</div></fieldset>" +
            '<div class="field full"><label for="cs-summary">Short summary</label><textarea id="cs-summary" name="summary" rows="2" required>' + esc(item.summary) + "</textarea></div>" +
            '<div class="field full"><label>Top 3 performance stats</label>' +
              '<div class="studio-inline">' +
                '<input name="sv0" value="' + esc(s0.value) + '" placeholder="3.4x"> <input name="sl0" value="' + esc(s0.label) + '" placeholder="ROAS">' +
                '<input name="sv1" value="' + esc(s1.value) + '" placeholder="+82%"> <input name="sl1" value="' + esc(s1.label) + '" placeholder="Conversion rate">' +
                '<input name="sv2" value="' + esc(s2.value) + '" placeholder="-34%"> <input name="sl2" value="' + esc(s2.label) + '" placeholder="Cost per purchase">' +
              "</div></div>" +
            '<div class="field full"><label for="cs-overview">Client overview</label><textarea id="cs-overview" name="overview" rows="2">' + esc(item.overview) + "</textarea></div>" +
            '<div class="field full"><label for="cs-challenges">Initial challenges (one per line)</label><textarea id="cs-challenges" name="challenges" rows="3">' + esc((item.challenges || []).join("\n")) + "</textarea></div>" +
            '<div class="field full"><label for="cs-strategy">Strategy &amp; approach</label><textarea id="cs-strategy" name="strategy" rows="3">' + esc(item.strategy) + "</textarea></div>" +
            '<div class="field full"><label for="cs-results">Campaign performance &amp; results</label><textarea id="cs-results" name="results" rows="2">' + esc(item.results) + "</textarea></div>" +
            '<div class="field full"><label for="cs-cover">Cover image path or upload</label><input id="cs-cover" name="cover" value="' + esc(item.cover) + '" placeholder="assets/media/case-studies/cover.webp"><input type="file" accept="image/*" data-upload-target="cs-cover" style="margin-top:.35rem"></div>' +
            '<div class="field"><label for="cs-before-img">Before image <span class="opt">(optional)</span></label><input id="cs-before-img" name="beforeImg" value="' + esc((item.before && item.before.image) || "") + '" placeholder="Path or upload"><input type="file" accept="image/*" data-upload-target="cs-before-img" style="margin-top:.35rem"></div>' +
            '<div class="field"><label for="cs-after-img">After image <span class="opt">(optional)</span></label><input id="cs-after-img" name="afterImg" value="' + esc((item.after && item.after.image) || "") + '" placeholder="Path or upload"><input type="file" accept="image/*" data-upload-target="cs-after-img" style="margin-top:.35rem"></div>' +
            '<div class="field"><label for="cs-before-cap">Before caption</label><input id="cs-before-cap" name="beforeCap" value="' + esc((item.before && item.before.caption) || "") + '"></div>' +
            '<div class="field"><label for="cs-after-cap">After caption</label><input id="cs-after-cap" name="afterCap" value="' + esc((item.after && item.after.caption) || "") + '"></div>' +
            '<div class="field full"><label class="check-pill" style="width:fit-content"><input type="checkbox" name="sample"' + (item.sample ? " checked" : "") + "><span>Mark as Sample case study</span></label></div>" +
          "</div>" +
          '<div class="form-foot">' +
            (editingCaseIdx != null ? '<button class="btn btn--ghost btn--sm" type="button" id="cs-cancel">Cancel edit</button>' : "<small>Saved immediately to live portfolio.</small>") +
            '<button class="btn btn--primary" type="submit">' + (editingCaseIdx != null ? "Save Case Study" : "Add Case Study") + "</button>" +
          "</div>" +
        "</form>" +
      "</div>";

    wireUploads(workspace);

    $("#cs-new-btn", workspace).addEventListener("click", function () {
      editingCaseIdx = null;
      renderCasesTab();
    });
    if ($("#cs-cancel", workspace)) {
      $("#cs-cancel", workspace).addEventListener("click", function () {
        editingCaseIdx = null;
        renderCasesTab();
      });
    }

    workspace.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cs-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-cs-act");
      var idx = +btn.getAttribute("data-i");
      var next = list.slice();
      if (act === "edit") { editingCaseIdx = idx; renderCasesTab(); return; }
      if (act === "up" && idx > 0) { var t = next[idx - 1]; next[idx - 1] = next[idx]; next[idx] = t; }
      if (act === "down" && idx < next.length - 1) { var t2 = next[idx + 1]; next[idx + 1] = next[idx]; next[idx] = t2; }
      if (act === "del") { next.splice(idx, 1); if (editingCaseIdx === idx) editingCaseIdx = null; }
      var res = store.save({ caseStudies: next });
      updateBanner(res.ok ? "Case studies updated." : res.error);
      renderCasesTab();
    });

    $("#cs-form", workspace).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.currentTarget;
      var svcs = $$('input[name="services"]:checked', f).map(function (c) { return c.value; });
      if (!svcs.length) svcs = ["shopify"];
      var stats = [0, 1, 2].map(function (k) {
        return { value: f.elements["sv" + k].value.trim(), label: f.elements["sl" + k].value.trim() };
      }).filter(function (s) { return s.value && s.label; });

      var obj = {
        slug: slugify(f.elements.slug.value.trim() || f.elements.client.value.trim() || f.elements.title.value.trim()),
        sample: f.elements.sample.checked,
        client: f.elements.client.value.trim(),
        industry: f.elements.industry.value.trim(),
        title: f.elements.title.value.trim(),
        summary: f.elements.summary.value.trim(),
        services: svcs,
        duration: f.elements.duration.value.trim() || "8 weeks",
        cover: f.elements.cover.value.trim(),
        stats: stats,
        overview: f.elements.overview.value.trim(),
        challenges: f.elements.challenges.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean),
        strategy: f.elements.strategy.value.trim(),
        results: f.elements.results.value.trim(),
        before: { image: f.elements.beforeImg.value.trim(), caption: f.elements.beforeCap.value.trim() },
        after: { image: f.elements.afterImg.value.trim(), caption: f.elements.afterCap.value.trim() }
      };

      var next = list.slice();
      if (editingCaseIdx != null && next[editingCaseIdx]) next[editingCaseIdx] = obj;
      else next.unshift(obj);

      var res = store.save({ caseStudies: next });
      if (!res.ok) { updateBanner(res.error); return; }
      editingCaseIdx = null;
      updateBanner("Saved case study \"" + obj.client + "\".");
      renderCasesTab();
    });
  }

  /* ---------- Tab 2: Creative Gallery ---------- */
  function renderGalleryTab() {
    var list = W.gallery || [];
    var cats = W.galleryCategories || {};
    var item = editingGalleryIdx != null && list[editingGalleryIdx] ? list[editingGalleryIdx] : {
      title: "", client: "", category: "ugc", type: "image", ratio: "4:5", src: "", poster: ""
    };

    workspace.innerHTML =
      '<div class="studio-split">' +
        '<div>' +
          '<div class="packages-head" style="margin-bottom:1rem"><h3>Gallery Items (' + list.length + ')</h3>' +
            '<button class="btn btn--ghost btn--sm" type="button" id="gal-new-btn">+ New item</button></div>' +
          '<div class="studio-list">' +
            list.map(function (g, i) {
              return '<div class="studio-item">' +
                '<div class="studio-item-head"><div><h3>' + esc(g.title) + "</h3><p>" + esc(cats[g.category] || g.category) +
                  (g.client ? " · " + esc(g.client) : "") + " · " + esc(g.type) + " (" + esc(g.ratio) + ")</p></div></div>" +
                '<div class="studio-actions">' +
                  '<button class="btn-xs" type="button" data-gal-act="edit" data-i="' + i + '">Edit</button>' +
                  '<button class="btn-xs" type="button" data-gal-act="up" data-i="' + i + '">Move up</button>' +
                  '<button class="btn-xs" type="button" data-gal-act="down" data-i="' + i + '">Move down</button>' +
                  '<button class="btn-xs btn-xs--danger" type="button" data-gal-act="del" data-i="' + i + '">Delete</button>' +
                "</div>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</div>" +
        '<form class="studio-panel" id="gal-form">' +
          "<h2>" + (editingGalleryIdx != null ? "Edit Gallery Item" : "Add Creative Work") + "</h2>" +
          '<div class="form-grid">' +
            '<div class="field full"><label for="g-title">Project title</label><input id="g-title" name="title" required value="' + esc(item.title) + '" placeholder="e.g. Glow Serum UGC Hook #4"></div>' +
            '<div class="field"><label for="g-client">Brand / Niche</label><input id="g-client" name="client" value="' + esc(item.client) + '" placeholder="e.g. Skincare"></div>' +
            '<div class="field"><label for="g-cat">Category</label><select id="g-cat" name="category">' +
              Object.keys(cats).map(function (k) {
                return '<option value="' + esc(k) + '"' + (item.category === k ? " selected" : "") + ">" + esc(cats[k]) + "</option>";
              }).join("") +
            "</select></div>" +
            '<div class="field"><label for="g-type">Media type</label><select id="g-type" name="type">' +
              '<option value="image"' + (item.type === "image" ? " selected" : "") + ">Image</option>" +
              '<option value="video"' + (item.type === "video" ? " selected" : "") + ">Video (.mp4)</option>" +
            "</select></div>" +
            '<div class="field"><label for="g-ratio">Aspect ratio</label><select id="g-ratio" name="ratio">' +
              ["9:16", "4:5", "1:1", "4:3", "16:9"].map(function (r) {
                return '<option value="' + r + '"' + (item.ratio === r ? " selected" : "") + ">" + r + "</option>";
              }).join("") +
            "</select></div>" +
            '<div class="field full"><label for="g-src">Image/Video URL, path, or upload image</label>' +
              '<input id="g-src" name="src" value="' + esc(item.src) + '" placeholder="assets/media/gallery/sample.webp">' +
              '<input type="file" accept="image/*" data-upload-target="g-src" style="margin-top:.35rem"></div>' +
            '<div class="field full"><label for="g-poster">Video poster image <span class="opt">(optional, for videos)</span></label>' +
              '<input id="g-poster" name="poster" value="' + esc(item.poster || "") + '" placeholder="assets/media/gallery/poster.webp"></div>' +
          "</div>" +
          '<div class="form-foot">' +
            (editingGalleryIdx != null ? '<button class="btn btn--ghost btn--sm" type="button" id="gal-cancel">Cancel edit</button>' : "<small>First 6 items also appear on the Home page.</small>") +
            '<button class="btn btn--primary" type="submit">' + (editingGalleryIdx != null ? "Save Item" : "Add to Gallery") + "</button>" +
          "</div>" +
        "</form>" +
      "</div>";

    wireUploads(workspace);

    $("#gal-new-btn", workspace).addEventListener("click", function () { editingGalleryIdx = null; renderGalleryTab(); });
    if ($("#gal-cancel", workspace)) {
      $("#gal-cancel", workspace).addEventListener("click", function () { editingGalleryIdx = null; renderGalleryTab(); });
    }

    workspace.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-gal-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-gal-act");
      var idx = +btn.getAttribute("data-i");
      var next = list.slice();
      if (act === "edit") { editingGalleryIdx = idx; renderGalleryTab(); return; }
      if (act === "up" && idx > 0) { var t = next[idx - 1]; next[idx - 1] = next[idx]; next[idx] = t; }
      if (act === "down" && idx < next.length - 1) { var t2 = next[idx + 1]; next[idx + 1] = next[idx]; next[idx] = t2; }
      if (act === "del") { next.splice(idx, 1); if (editingGalleryIdx === idx) editingGalleryIdx = null; }
      var res = store.save({ gallery: next });
      updateBanner(res.ok ? "Gallery updated." : res.error);
      renderGalleryTab();
    });

    $("#gal-form", workspace).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.currentTarget;
      var obj = {
        title: f.elements.title.value.trim(),
        client: f.elements.client.value.trim(),
        category: f.elements.category.value,
        type: f.elements.type.value,
        ratio: f.elements.ratio.value,
        src: f.elements.src.value.trim(),
        poster: f.elements.poster.value.trim()
      };
      var next = list.slice();
      if (editingGalleryIdx != null && next[editingGalleryIdx]) next[editingGalleryIdx] = obj;
      else next.unshift(obj);

      var res = store.save({ gallery: next });
      if (!res.ok) { updateBanner(res.error); return; }
      editingGalleryIdx = null;
      updateBanner("Saved gallery item \"" + obj.title + "\".");
      renderGalleryTab();
    });
  }

  /* ---------- Tab 3: Packages & Links ---------- */
  function renderPackagesTab() {
    var cfg = W.config || {};
    var services = (W.services || []).filter(function (s) { return s.packages && s.packages.length; });

    workspace.innerHTML =
      '<div class="studio-split">' +
        '<form class="studio-panel" id="cfg-form">' +
          "<h2>Contact &amp; Integration Links</h2>" +
          '<div class="form-grid">' +
            '<div class="field"><label for="cf-email">Email</label><input id="cf-email" name="email" value="' + esc(cfg.email) + '"></div>' +
            '<div class="field"><label for="cf-currency">Currency symbol</label><input id="cf-currency" name="currency" value="' + esc(cfg.currency || "$") + '"></div>' +
            '<div class="field full"><label for="cf-wa">WhatsApp number (digits only)</label><input id="cf-wa" name="whatsappNumber" value="' + esc(cfg.whatsappNumber) + '"></div>' +
            '<div class="field full"><label for="cf-dc">Discord invite URL</label><input id="cf-dc" name="discordInvite" value="' + esc(cfg.discordInvite) + '"></div>' +
            '<div class="field full"><label for="cf-book">Strategy call booking URL (Calendly / Cal.com)</label><input id="cf-book" name="bookingUrl" value="' + esc(cfg.bookingUrl) + '"></div>' +
            '<div class="field full"><label for="cf-gf">Google Form ID <span class="opt">(optional)</span></label><input id="cf-gf" name="formId" value="' + esc((cfg.googleForm && cfg.googleForm.formId) || "") + '" placeholder="1FAIpQLSd..."></div>' +
          "</div>" +
          '<div class="form-foot"><small>Real links override built-in modals automatically.</small><button class="btn btn--primary" type="submit">Save Settings</button></div>' +
        "</form>" +
        '<form class="studio-panel" id="pkg-form">' +
          "<h2>Service Package Pricing</h2>" +
          '<p class="muted" style="font-size:var(--fs-sm)">Leave a price blank to display "Custom quote".</p>' +
          services.map(function (svc) {
            return '<div style="margin-bottom:1.5rem"><h3 style="margin-bottom:.75rem;color:var(--lime)">' + esc(svc.name) + '</h3><div class="form-grid">' +
              svc.packages.map(function (p, pi) {
                var key = svc.id + "__" + pi;
                return '<div class="field"><label for="pk-' + key + '">' + esc(p.name) + " (" + esc(p.period || "") + ")</label>" +
                  '<input id="pk-' + key + '" name="' + key + '" value="' + (p.price != null ? esc(p.price) : "") + '" placeholder="Custom quote"></div>';
              }).join("") +
            "</div></div>";
          }).join("") +
          '<div class="form-foot"><small>Updates pricing live on Services page.</small><button class="btn btn--primary" type="submit">Save Prices</button></div>' +
        "</form>" +
      "</div>";

    $("#cfg-form", workspace).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.currentTarget;
      var nextCfg = Object.assign({}, cfg, {
        email: f.elements.email.value.trim(),
        currency: f.elements.currency.value || "$",
        whatsappNumber: f.elements.whatsappNumber.value.trim(),
        discordInvite: f.elements.discordInvite.value.trim(),
        bookingUrl: f.elements.bookingUrl.value.trim(),
        googleForm: Object.assign({}, cfg.googleForm || {}, { formId: f.elements.formId.value.trim() })
      });
      store.save({ config: nextCfg });
      updateBanner("Contact & integration settings saved.");
    });

    $("#pkg-form", workspace).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.currentTarget;
      var nextSvcs = (W.services || []).map(function (svc) {
        if (!svc.packages || !svc.packages.length) return svc;
        return Object.assign({}, svc, {
          packages: svc.packages.map(function (p, pi) {
            var raw = f.elements[svc.id + "__" + pi].value.trim();
            return Object.assign({}, p, { price: raw === "" ? null : raw });
          })
        });
      });
      store.save({ services: nextSvcs });
      updateBanner("Package pricing updated.");
    });
  }

  /* ---------- Tab 4: Inquiries & Strategy Calls ---------- */
  function renderLeadsTab() {
    var leads = store.readLeads();
    workspace.innerHTML =
      '<div class="studio-panel">' +
        '<div class="packages-head" style="margin-bottom:1.25rem"><h2>Test requests from this browser (' + leads.length + ")</h2>" +
          '<div class="btn-row">' +
            '<button class="btn btn--ghost btn--sm" type="button" id="leads-export">Download JSON</button>' +
            '<button class="btn btn--ghost btn--sm" type="button" id="leads-clear">Clear history</button>' +
          "</div></div>" +
        '<p class="muted" style="margin:0 0 1.25rem">Only requests made from this browser show here, for testing. Real visitors\' requests reach you on WhatsApp, email or your Google Sheet, whichever you set in Packages &amp; Links.</p>' +
        (leads.length ? '<div class="studio-list">' + leads.map(function (l) {
          return '<div class="studio-item">' +
            '<div class="studio-item-head"><div><h3>' + esc(l.name) + (l.business ? " · " + esc(l.business) : "") +
              ' <span class="tag tag--sample">' + esc(l.type || "Inquiry") + "</span></h3>" +
              "<p>" + esc(l.email) + (l.website ? " · " + esc(l.website) : "") + (l.budget ? " · Budget: " + esc(l.budget) : "") +
              (l.slot ? " · Slot: " + esc(l.slot) : "") + "</p></div>" +
              '<span class="tag">' + esc((l.createdAt || "").slice(0, 10)) + "</span></div>" +
            (l.services ? "<p><b>Services:</b> " + esc(l.services) + "</p>" : "") +
            (l.challenges ? "<p><b>Challenges:</b> " + esc(l.challenges) + "</p>" : "") +
            (l.goals ? "<p><b>Goals:</b> " + esc(l.goals) + "</p>" : "") +
          "</div>";
        }).join("") + "</div>" : '<p class="muted">No requests made from this browser yet.</p>') +
      "</div>";

    $("#leads-export", workspace).addEventListener("click", function () {
      downloadFile("wedo-ecom-leads.json", JSON.stringify(leads, null, 2));
    });
    $("#leads-clear", workspace).addEventListener("click", function () {
      store.clearLeads();
      renderLeadsTab();
    });
  }

  function wireUploads(root) {
    $$("[data-upload-target]", root).forEach(function (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        compressImage(file, 1200, function (dataUrl) {
          var target = $("#" + input.getAttribute("data-upload-target"), root);
          if (target) target.value = dataUrl;
        });
      });
    });
  }

  function downloadFile(filename, text) {
    var blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderTab() {
    if (currentTab === "cases") renderCasesTab();
    else if (currentTab === "gallery") renderGalleryTab();
    else if (currentTab === "packages") renderPackagesTab();
    else renderLeadsTab();
  }

  $$("[data-studio-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTab(btn.getAttribute("data-studio-tab"));
    });
  });

  $("#studio-reset-all").addEventListener("click", function () {
    store.reset();
    editingCaseIdx = null;
    editingGalleryIdx = null;
    updateBanner("Restored repository defaults.");
    renderTab();
  });

  $$("[data-export]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kind = btn.getAttribute("data-export");
      downloadFile(kind + ".js", store.exportJs(kind));
      updateBanner("Downloaded " + kind + ".js.");
    });
  });

  updateBanner();
  setTab(currentTab);
})();
