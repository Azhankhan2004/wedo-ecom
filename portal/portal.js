/* ==========================================================================
   WeDo Ecom Client Portal: shared helpers (loaded on every portal page)
   ========================================================================== */
(function () {
  "use strict";
  var P = (window.Portal = {});

  /* ---------- API ---------- */
  P.api = function (path, opts) {
    opts = opts || {};
    var init = { method: opts.method || "GET", credentials: "same-origin", headers: {} };
    if (opts.body !== undefined) { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(opts.body); }
    return fetch("/api" + path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && !opts.allow401) { location.href = "/portal/login.html?next=" + encodeURIComponent(location.pathname); throw new Error("Please sign in."); }
        if (!res.ok) { var e = new Error(data.error || "Something went wrong."); e.status = res.status; throw e; }
        return data;
      });
    });
  };

  /* ---------- Text & formatting ---------- */
  P.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  P.date = function (iso, withYear) {
    if (!iso) return "No date";
    var d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso.replace(" ", "T") + "Z");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: withYear === false ? undefined : "numeric" });
  };
  P.ago = function (iso) {
    var d = new Date(iso.replace(" ", "T") + "Z"), s = (Date.now() - d) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    if (s < 86400 * 7) return Math.round(s / 86400) + " days ago";
    return P.date(iso);
  };
  P.money = function (amount, currency) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(amount); }
    catch (e) { return (currency || "") + " " + Number(amount).toFixed(2); }
  };
  P.moneyMap = function (map) {
    var keys = Object.keys(map || {});
    if (!keys.length) return P.money(0, "USD");
    return keys.map(function (c) { return P.money(map[c], c); }).join(" + ");
  };
  P.daysUntil = function (iso) {
    if (!iso) return null;
    var d = new Date(iso + "T00:00:00"), t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 864e5);
  };

  var STATUS = {
    planning: ["Planning", "blue"], in_progress: ["In progress", "lime"], review: ["In review", "amber"],
    completed: ["Completed", ""], on_hold: ["On hold", "red"],
    todo: ["To do", ""], done: ["Done", "lime"],
    draft: ["Draft", ""], sent: ["Due", "amber"], paid: ["Paid", "lime"], overdue: ["Overdue", "red"],
    active: ["Active", "lime"], paused: ["Paused", "amber"], archived: ["Archived", ""]
  };
  P.badge = function (key) {
    var s = STATUS[key] || [key, ""];
    return '<span class="badge' + (s[1] ? " badge--" + s[1] : "") + '">' + P.esc(s[0]) + "</span>";
  };
  P.statusLabel = function (key) { return (STATUS[key] || [key])[0]; };

  /* ---------- Icons ---------- */
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  P.icons = {
    home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
    projects: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h4M8 16h7"/>'),
    updates: I('<path d="M4 5h16v11H8l-4 4z"/>'),
    billing: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>'),
    store: I('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9v11h16V9"/><path d="M4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 2 3"/>'),
    clients: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.6 3 5.2"/>'),
    team: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    logout: I('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>'),
    close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    check: I('<path d="M5 12l5 5 9-10"/>')
  };
  P.logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#c4cf86"/><path d="M7 10.5l3.4 11 3.2-8.4 3.2 8.4 3.4-11" fill="none" stroke="#1a1d0e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24.5" cy="21" r="2" fill="#1a1d0e"/></svg>';

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  P.toast = function (msg, isError) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.toggle("is-error", !!isError);
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3200);
  };

  /* ---------- Dialog ---------- */
  P.dialog = function (title, bodyHtml, onReady) {
    var d = document.createElement("dialog");
    d.innerHTML = '<div class="dlg"><div class="dlg-head"><h2>' + P.esc(title) + '</h2><button class="btn btn--icon" type="button" data-close aria-label="Close">' + P.icons.close + "</button></div>" + bodyHtml + "</div>";
    document.body.appendChild(d);
    d.addEventListener("close", function () { d.remove(); });
    d.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { d.close(); }); });
    d.showModal();
    if (onReady) onReady(d);
    return d;
  };
  P.confirm = function (title, message, okLabel) {
    return new Promise(function (resolve) {
      var done = false;
      var d = P.dialog(title, "<p class=\"muted\">" + P.esc(message) + '</p><div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="button" data-ok>' + P.esc(okLabel || "Confirm") + "</button></div>");
      d.querySelector("[data-ok]").addEventListener("click", function () { done = true; d.close(); resolve(true); });
      d.addEventListener("close", function () { if (!done) resolve(false); });
    });
  };
  // Shows a one-time password and makes copying easy
  P.showSecret = function (title, intro, email, password) {
    var text = "Portal: " + location.origin + "/portal/login.html\nEmail: " + email + "\nTemporary password: " + password;
    P.dialog(title,
      "<p class=\"muted\">" + P.esc(intro) + "</p>" +
      '<div class="secret">' + P.esc(email) + "<br>" + P.esc(password) + "</div>" +
      '<p class="note">This password is shown only once. They\'ll be asked to choose their own password the first time they sign in.</p>' +
      '<div class="form-actions"><button class="btn" type="button" data-copy>Copy login details</button><button class="btn btn--primary" type="button" data-close>Done</button></div>',
      function (d) {
        d.querySelector("[data-copy]").addEventListener("click", function () {
          if (navigator.clipboard) navigator.clipboard.writeText(text);
          this.textContent = "Copied";
        });
      });
  };

  /* ---------- Forms ---------- */
  P.formData = function (form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "checkbox") out[el.name] = el.checked;
      else out[el.name] = el.value;
    });
    return out;
  };
  P.bindForm = function (form, handler) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]'), errBox = form.querySelector("[data-error]");
      if (errBox) errBox.hidden = true;
      if (btn) btn.disabled = true;
      Promise.resolve().then(function () { return handler(P.formData(form)); })
        .catch(function (err) {
          if (errBox) { errBox.textContent = err.message; errBox.hidden = false; } else P.toast(err.message, true);
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  };
  P.options = function (list, selected) {
    return list.map(function (o) {
      var val = typeof o === "object" ? o.value : o, label = typeof o === "object" ? o.label : o;
      return '<option value="' + P.esc(val) + '"' + (String(val) === String(selected) ? " selected" : "") + ">" + P.esc(label) + "</option>";
    }).join("");
  };

  /* ---------- App shell (sidebar + content) ---------- */
  P.shell = function (opts) {
    var root = document.getElementById("app");
    root.className = "app";
    root.innerHTML =
      '<aside class="side">' +
        '<a class="brand" href="/" aria-label="WeDo Ecom website">' + P.logo + "WeDo<span>Ecom</span></a>" +
        '<nav aria-label="Portal">' + opts.nav.map(function (n) {
          return '<button class="nav-btn" type="button" data-view="' + n.id + '">' + P.icons[n.icon] + "<span>" + P.esc(n.label) + "</span></button>";
        }).join("") + "</nav>" +
        '<div class="side-foot"><div class="who"><b>' + P.esc(opts.user.name) + '</b><span class="faint">' + P.esc(opts.subtitle) + "</span></div>" +
          '<button class="nav-btn" type="button" data-action="password">' + P.icons.key + "<span>Change password</span></button>" +
          '<button class="nav-btn" type="button" data-action="logout">' + P.icons.logout + "<span>Sign out</span></button></div>" +
      "</aside>" +
      '<main class="main" id="main" tabindex="-1">' +
        '<div class="mobile-head"><a class="brand" href="/">' + P.logo + "WeDo<span>Ecom</span></a>" +
          '<button class="btn btn--sm" type="button" data-action="menu">Account</button></div>' +
        '<div id="view"></div>' +
      "</main>";

    var views = opts.views, current = null;
    function go(id, push) {
      if (!views[id]) id = opts.nav[0].id;
      current = id;
      root.querySelectorAll(".nav-btn[data-view]").forEach(function (b) {
        if (b.getAttribute("data-view") === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      });
      var view = document.getElementById("view");
      view.innerHTML = '<div class="skeleton"></div>';
      if (push !== false) history.replaceState(null, "", "#" + id);
      Promise.resolve(views[id](view)).catch(function (e) {
        view.innerHTML = '<div class="alert alert--error">' + P.esc(e.message) + "</div>";
      });
      window.scrollTo(0, 0);
    }
    P.go = go;
    P.refresh = function () { go(current, false); };
    root.querySelectorAll(".nav-btn[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-view")); });
    });
    root.addEventListener("click", function (e) {
      var a = e.target.closest("[data-action]");
      if (!a) return;
      var act = a.getAttribute("data-action");
      if (act === "logout") P.logout();
      if (act === "password") P.changePasswordDialog();
      if (act === "menu") {
        P.dialog("Account", '<p class="muted">Signed in as <b>' + P.esc(opts.user.email) + '</b></p><div class="form-actions" style="justify-content:flex-start"><button class="btn" type="button" data-pw>Change password</button><button class="btn" type="button" data-out>Sign out</button></div>', function (d) {
          d.querySelector("[data-pw]").addEventListener("click", function () { d.close(); P.changePasswordDialog(); });
          d.querySelector("[data-out]").addEventListener("click", P.logout);
        });
      }
    });
    go((location.hash || "").slice(1) || opts.nav[0].id, false);
  };

  P.logout = function () {
    P.api("/auth/logout", { method: "POST", body: {}, allow401: true }).catch(function () {}).then(function () { location.href = "/portal/login.html"; });
  };

  P.changePasswordDialog = function () {
    P.dialog("Change password",
      '<form class="grid" novalidate>' +
        '<div class="field"><label for="pw-cur">Current password</label><input id="pw-cur" name="current" type="password" autocomplete="current-password" required></div>' +
        '<div class="field"><label for="pw-new">New password</label><input id="pw-new" name="next" type="password" autocomplete="new-password" minlength="10" required><span class="note">At least 10 characters.</span></div>' +
        '<div class="alert alert--error" data-error hidden></div>' +
        '<div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">Save new password</button></div>' +
      "</form>",
      function (d) {
        P.bindForm(d.querySelector("form"), function (data) {
          return P.api("/auth/password", { method: "POST", body: data }).then(function () { d.close(); P.toast("Password changed"); });
        });
      });
  };

  /* Load the signed-in user, or send them to the login page */
  P.requireUser = function (role) {
    return P.api("/auth/me").then(function (r) {
      var u = r.user;
      if (u.mustChangePassword) { location.href = "/portal/login.html#set-password"; throw new Error("redirect"); }
      if (role && u.role !== role) { location.href = u.role === "admin" ? "/portal/admin.html" : "/portal/"; throw new Error("redirect"); }
      return u;
    });
  };

  /* ---------- PWA ---------- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/portal/sw.js", { scope: "/portal/" }).catch(function () {}); });
  }
})();
