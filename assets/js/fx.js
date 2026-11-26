/* ==========================================================================
   WeDo Ecom: motion & effects layer (fx.js)
   Loaded after main.js on every page. Adds the intro curtain, the hero's
   living dot field, cursor aura, 3D tilt, magnetic buttons, rolling link
   text, card glow, word-by-word headings and the custom cursor.
   Respects "reduce motion" and touch screens.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var page = document.body.getAttribute("data-page") || "";

  /* ---------- Intro curtain: once per browser session, home page only ---------- */
  function intro() {
    var seen = false;
    try { seen = sessionStorage.getItem("wedo_intro") === "1"; sessionStorage.setItem("wedo_intro", "1"); } catch (e) {}
    if (reduce || seen || page !== "home") { document.documentElement.classList.add("fx-intro-done"); return; }
    var el = document.createElement("div");
    el.className = "fx-intro";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="fx-intro__mark"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#c4cf86"/><path d="M7 10.5l3.4 11 3.2-8.4 3.2 8.4 3.4-11" fill="none" stroke="#1a1d0e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24.5" cy="21" r="2" fill="#1a1d0e"/></svg><span>WeDo <b>Ecom</b></span></div><div class="fx-intro__bar"></div>';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }

  /* ---------- Split text into masked words ---------- */
  function splitWords(el, startIndex) {
    var i = startIndex || 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement("span");
            w.className = "fx-word";
            w.innerHTML = "<i></i>";
            w.firstChild.textContent = p;
            w.firstChild.style.setProperty("--i", i++);
            frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains("fx-word")) {
          walk(child);
        }
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    $$(".fx-word", el).forEach(function (w) { w.setAttribute("aria-hidden", "true"); });
    return i;
  }

  /* ---------- Hero ---------- */
  function hero() {
    var heroEl = $(".hero");
    if (!heroEl) return;

    // headline words
    var h1 = $("h1", heroEl);
    if (h1 && !reduce) {
      var n = 0;
      $$(".line", h1).forEach(function (line) { n = splitWords(line, n); });
      h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
      $$(".line", h1).forEach(function (l) { l.removeAttribute("aria-label"); });
    }

    // cursor aura + stage tilt
    var stage = $(".stage", heroEl), screen = stage && $(".stage-screen", stage);
    if (finePointer && !reduce) {
      heroEl.addEventListener("pointermove", function (e) {
        var r = heroEl.getBoundingClientRect();
        heroEl.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        heroEl.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
      if (screen) {
        stage.addEventListener("pointermove", function (e) {
          var r = screen.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          stage.classList.add("is-tilting");
          screen.style.transform = "rotateY(" + (px * 10).toFixed(2) + "deg) rotateX(" + (-py * 8).toFixed(2) + "deg) translateZ(0)";
          screen.style.setProperty("--gx", ((px + 0.5) * 100).toFixed(1) + "%");
          screen.style.setProperty("--gy", ((py + 0.5) * 100).toFixed(1) + "%");
        });
        stage.addEventListener("pointerleave", function () {
          stage.classList.remove("is-tilting");
          screen.style.transform = "";
        });
      }
    }

    dotField(heroEl);
  }

  /* A field of lime dots on a 3D plane that rolls like a wave
     and ripples where the cursor is. Pauses when out of view. */
  function dotField(host) {
    var canvas = document.createElement("canvas");
    canvas.className = "fx-field";
    canvas.setAttribute("aria-hidden", "true");
    host.insertBefore(canvas, host.firstChild);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cols = 0, rows = 0, gap = 0;
    var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    var running = false, visible = true, t = 0, last = 0;

    function size() {
      var r = host.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var small = W < 760;
      gap = small ? 34 : 30;
      cols = Math.ceil((W * 1.6) / gap);
      rows = small ? 26 : 34;
    }

    function draw(now) {
      if (!running) return;
      var dt = Math.min(50, now - (last || now)); last = now;
      t += dt * 0.00055;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      ctx.clearRect(0, 0, W, H);

      var horizon = H * 0.42, cx = W * 0.62, fov = 320;
      for (var zr = 0; zr < rows; zr++) {
        var z = 40 + zr * 22;
        var scale = fov / (fov + z);
        var y0 = horizon + (H * 0.95 - horizon) * (1 - zr / rows) ;
        for (var c = 0; c < cols; c++) {
          var xw = (c - cols / 2) * gap;
          var wave = Math.sin(c * 0.22 + t * 2.2) * 10 + Math.cos(zr * 0.35 + t * 1.6) * 12;
          var sx = cx + xw * scale * 1.15;
          var sy = y0 - wave * scale * 1.6;
          var dx = sx - mouse.x, dy = sy - mouse.y, d2 = dx * dx + dy * dy;
          var lift = 0;
          if (d2 < 32000) { lift = (1 - d2 / 32000) * 26; sy -= lift; }
          if (sx < -10 || sx > W + 10 || sy < 0 || sy > H) continue;
          var a = (0.08 + scale * 0.5) * (1 - zr / rows * 0.6) + lift / 60;
          ctx.fillStyle = lift > 2 ? "rgba(213,223,156," + Math.min(0.95, a + 0.25) + ")" : "rgba(196,207,134," + Math.min(0.6, a) + ")";
          var rad = (lift > 2 ? 2.1 : 1.3) * scale + 0.35;
          ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 6.283); ctx.fill();
        }
      }
      if (!reduce) requestAnimationFrame(draw);
    }

    function start() { if (running || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(draw); }
    function stop() { running = false; }

    size();
    window.addEventListener("resize", function () { size(); if (reduce) { running = true; draw(performance.now()); running = false; } });
    if (finePointer) {
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
        if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      });
      host.addEventListener("pointerleave", function () { mouse.tx = -9999; mouse.ty = -9999; });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(host);
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });

    requestAnimationFrame(function () { canvas.classList.add("is-on"); });
    if (reduce) { running = true; draw(performance.now()); running = false; }
    else start();
  }

  /* ---------- Section headings rise word by word when they scroll in ---------- */
  function headings() {
    if (reduce || !("IntersectionObserver" in window)) return;
    var heads = $$(".section-head h2, .page-intro h1, .cta-band h2, .split > h2, .service-block h2");
    heads.forEach(function (h) { h.classList.add("fx-split"); splitWords(h, 0); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      });
    }, { threshold: 0.2 });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------- Magnetic buttons ---------- */
  function magnetic() {
    if (!finePointer || reduce) return;
    document.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (!b) return;
      var r = b.getBoundingClientRect();
      var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.transform = "translate(" + (x * 0.22).toFixed(1) + "px," + (y * 0.32).toFixed(1) + "px)";
    });
    document.addEventListener("pointerout", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
      if (b && !b.contains(e.relatedTarget)) b.style.transform = "";
    });
  }

  /* ---------- Rolling text on nav and footer links ---------- */
  function rollLinks(root) {
    $$(".nav-links a, .site-footer li > a", root || document).forEach(function (a) {
      if (a.querySelector(".fx-roll") || a.children.length) return;
      var text = a.textContent.trim();
      if (!text) return;
      a.innerHTML = '<span class="fx-roll"><span></span><span aria-hidden="true"></span></span>';
      a.firstChild.firstChild.textContent = text;
      a.firstChild.lastChild.textContent = text;
    });
  }

  /* ---------- Card glow follows the cursor ---------- */
  function glow() {
    if (!finePointer || reduce) return;
    var sel = ".pillar, .tier, .case-row, .why-item, .channel, .g-item, .service-visual, .form-card, .cta-band, .mv-grid > div, .trust-stat";
    var mark = function () { $$(sel).forEach(function (el) { el.classList.add("fx-glow"); }); };
    mark();
    // re-mark after dynamic sections render (filters, gallery)
    new MutationObserver(mark).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".fx-glow");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--x", (e.clientX - r.left) + "px");
      el.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  }

  /* ---------- Custom cursor ---------- */
  function cursor() {
    if (!finePointer || reduce) return;
    var dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "fx-cursor is-hidden"; ring.className = "fx-cursor-ring is-hidden";
    dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot); document.body.appendChild(ring);
    var x = 0, y = 0, rx = 0, ry = 0, shown = false;
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!shown) { rx = x; ry = y; shown = true; dot.classList.remove("is-hidden"); ring.classList.remove("is-hidden"); }
      dot.style.transform = "translate(" + x + "px," + y + "px)";
      var hot = e.target.closest && e.target.closest("a, button, .g-item, input, select, textarea, label, summary, [role=tab]");
      ring.classList.toggle("is-hover", !!hot);
    });
    document.addEventListener("pointerdown", function () { ring.classList.add("is-down"); });
    document.addEventListener("pointerup", function () { ring.classList.remove("is-down"); });
    document.documentElement.addEventListener("pointerleave", function () { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); shown = false; });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Run ---------- */
  intro();
  hero();
  headings();
  rollLinks();
  magnetic();
  glow();
  cursor();
})();
