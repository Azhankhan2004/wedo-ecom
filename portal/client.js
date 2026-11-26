/* ==========================================================================
   WeDo Ecom Client Portal: client dashboard
   Everything here comes from /api/me/dashboard, which only ever returns
   the signed-in client's own data.
   ========================================================================== */
(function () {
  "use strict";
  var P = Portal, esc = P.esc;
  var data = null;

  function load(force) {
    if (data && !force) return Promise.resolve(data);
    return P.api("/me/dashboard").then(function (d) { data = d; return d; });
  }

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }

  function progressRing(p) {
    return '<div class="ring" style="--p:' + p + '"><b>' + p + "%</b></div>";
  }

  function nextMilestone(projects) {
    var list = [];
    projects.forEach(function (p) { p.milestones.forEach(function (m) { if (!m.done) list.push({ m: m, p: p }); }); });
    list.sort(function (a, b) { return (a.m.due_date || "9999").localeCompare(b.m.due_date || "9999"); });
    return list[0] || null;
  }

  function updateItem(u) {
    return '<article class="feed-item">' +
      '<div class="feed-meta">' + (u.kind === "announcement" ? P.badge("Announcement").replace("badge", "badge badge--blue") : "") +
        (u.project_name ? '<span>' + esc(u.project_name) + "</span><span>·</span>" : "") +
        "<span>" + esc(P.ago(u.created_at)) + "</span>" + (u.author ? "<span>·</span><span>" + esc(u.author) + "</span>" : "") + "</div>" +
      "<h3>" + esc(u.title) + "</h3>" + (u.body ? "<p>" + esc(u.body) + "</p>" : "") + "</article>";
  }

  /* ---------- Overview ---------- */
  function overview(view) {
    return load().then(function (d) {
      var active = d.projects.filter(function (p) { return p.status !== "completed"; });
      var main = active[0] || d.projects[0];
      var nm = nextMilestone(d.projects);
      var due = d.billing.nextDue;
      var dueIn = due ? P.daysUntil(due.due_date) : null;
      var openTasks = d.projects.reduce(function (n, p) { return n + p.taskCounts.todo + p.taskCounts.in_progress; }, 0);
      var doneTasks = d.projects.reduce(function (n, p) { return n + p.taskCounts.done; }, 0);

      view.innerHTML =
        '<div class="topbar"><div><h1>' + greeting() + ", " + esc((data.client.contact_name || data.client.company).split(" ")[0]) + "</h1>" +
          "<p>Here's where things stand with " + esc(d.client.company) + ".</p></div></div>" +

        '<div class="grid grid-4">' +
          '<div class="card stat fade-in"><span>Active projects</span><b>' + active.length + '</b><span class="hint">' + d.projects.length + " in total</span></div>" +
          '<div class="card stat fade-in"><span>Tasks done</span><b>' + doneTasks + '</b><span class="hint">' + openTasks + " still open</span></div>" +
          '<div class="card stat fade-in"><span>Next milestone</span><b style="font-size:1.15rem">' + (nm ? esc(nm.m.title) : "None yet") + '</b><span class="hint">' + (nm ? esc(P.date(nm.m.due_date)) + " · " + esc(nm.p.name) : "We'll add milestones soon") + "</span></div>" +
          '<div class="card stat fade-in' + (due ? "" : " stat--lime") + '"><span>Amount due</span><b>' + esc(P.moneyMap(d.billing.pending)) + '</b><span class="hint">' +
            (due ? (dueIn < 0 ? "Overdue since " : "Next due ") + esc(P.date(due.due_date)) : "You're all paid up") + "</span></div>" +
        "</div>" +

        '<div class="grid grid-3" style="margin-top:1rem">' +
          '<div class="card span-2">' +
            (main ? '<div class="card-head"><div><h2>' + esc(main.name) + '</h2><span class="faint">' + esc(main.service || "") + "</span></div>" + P.badge(main.status) + "</div>" +
              '<div style="display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap">' + progressRing(main.progress) +
                '<div style="flex:1;min-width:200px"><p class="muted">' + esc(main.summary || "Your project is set up. Tasks and milestones will appear here as we work.") + "</p>" +
                '<p class="note" style="margin-top:.5rem">' + (main.due_date ? "Target delivery: " + esc(P.date(main.due_date)) : "") + "</p></div></div>" +
              '<div class="list" style="margin-top:1.2rem">' + main.tasks.filter(function (t) { return t.status !== "done"; }).slice(0, 4).map(taskRow).join("") + "</div>" +
              '<div style="margin-top:1rem"><button class="btn btn--sm" type="button" data-go="projects">See full project</button></div>'
            : '<div class="empty"><b>No projects yet</b>Once we start working together, your project will show up here.</div>') +
          "</div>" +
          '<div class="card"><div class="card-head"><h2>Latest updates</h2><button class="btn btn--sm" type="button" data-go="updates">All</button></div>' +
            '<div class="list">' + (d.updates.slice(0, 3).map(updateItem).join("") || '<div class="empty">No updates yet.</div>') + "</div></div>" +
        "</div>" +

        '<div class="card soon" style="margin-top:1rem"><div class="card-head"><h2>Store performance</h2><span class="badge badge--blue">Coming soon</span></div>' +
          '<p class="muted">Your Shopify sales, orders and best-selling products will appear here once your store is connected. We\'ll send you a short guide when it\'s ready.</p></div>';

      view.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { P.go(b.getAttribute("data-go")); }); });
    });
  }

  function taskRow(t) {
    var cls = t.status === "done" ? "is-done" : t.status === "in_progress" ? "is-progress" : "";
    return '<div class="task ' + cls + '"><span class="dot" aria-hidden="true"></span><div class="row-main"><span class="task-title">' + esc(t.title) + "</span>" +
      '<small style="display:block">' + esc(P.statusLabel(t.status)) + (t.due_date ? " · due " + esc(P.date(t.due_date, false)) : "") + (t.assignee ? " · " + esc(t.assignee) : "") + "</small></div></div>";
  }

  /* ---------- Projects ---------- */
  function projects(view) {
    return load().then(function (d) {
      if (!d.projects.length) {
        view.innerHTML = '<div class="topbar"><div><h1>Projects</h1></div></div><div class="empty"><b>No projects yet</b>Your projects will show up here as soon as we start.</div>';
        return;
      }
      view.innerHTML = '<div class="topbar"><div><h1>Projects</h1><p>Progress, tasks and milestones for everything we\'re doing for you.</p></div></div>' +
        d.projects.map(function (p) {
          var groups = [["in_progress", "Working on now"], ["todo", "Coming up"], ["done", "Completed"]];
          return '<section class="card fade-in" style="margin-bottom:1rem">' +
            '<div class="card-head"><div><h2>' + esc(p.name) + '</h2><span class="faint">' + esc(p.service || "") +
              (p.start_date ? " · started " + esc(P.date(p.start_date)) : "") + (p.due_date ? " · target " + esc(P.date(p.due_date)) : "") + "</span></div>" + P.badge(p.status) + "</div>" +
            '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem"><div class="bar" style="flex:1"><i style="width:' + p.progress + '%"></i></div><b>' + p.progress + "%</b></div>" +
            (p.summary ? '<p class="muted" style="margin-bottom:1.2rem">' + esc(p.summary) + "</p>" : "") +
            '<div class="grid grid-2">' +
              "<div>" + groups.map(function (g) {
                var list = p.tasks.filter(function (t) { return t.status === g[0]; });
                if (!list.length) return "";
                return '<h3 style="margin:.4rem 0 .6rem">' + g[1] + ' <span class="faint">(' + list.length + ")</span></h3><div class=\"list\" style=\"margin-bottom:1rem\">" + list.map(taskRow).join("") + "</div>";
              }).join("") + (p.tasks.length ? "" : '<div class="empty">Tasks will appear here as we plan the work.</div>') + "</div>" +
              "<div><h3 style=\"margin:.4rem 0 .8rem\">Milestones</h3>" + (p.milestones.length ? '<div class="timeline">' + p.milestones.map(function (m) {
                return '<div class="tl' + (m.done ? " is-done" : "") + '"><i aria-hidden="true"></i><div><b>' + esc(m.title) + '</b><br><small class="faint">' + (m.done ? "Done" : esc(P.date(m.due_date))) + "</small></div></div>";
              }).join("") + "</div>" : '<div class="empty">No milestones yet.</div>') + "</div>" +
            "</div></section>";
        }).join("");
    });
  }

  /* ---------- Updates ---------- */
  function updates(view) {
    return load().then(function (d) {
      view.innerHTML = '<div class="topbar"><div><h1>Updates</h1><p>News about your projects, and announcements from the WeDo Ecom team.</p></div></div>' +
        '<div class="card"><div class="list">' + (d.updates.map(updateItem).join("") || '<div class="empty"><b>Nothing yet</b>Updates from our team will show up here.</div>') + "</div></div>";
    });
  }

  /* ---------- Billing ---------- */
  function billing(view) {
    return load().then(function (d) {
      var due = d.billing.nextDue;
      view.innerHTML = '<div class="topbar"><div><h1>Billing</h1><p>Your invoices and payment history.</p></div></div>' +
        '<div class="grid grid-3">' +
          '<div class="card stat"><span>Amount due</span><b>' + esc(P.moneyMap(d.billing.pending)) + "</b></div>" +
          '<div class="card stat stat--lime"><span>Paid so far</span><b>' + esc(P.moneyMap(d.billing.paid)) + "</b></div>" +
          '<div class="card stat"><span>Next payment date</span><b style="font-size:1.3rem">' + (due ? esc(P.date(due.due_date)) : "Nothing due") + '</b><span class="hint">' + (due ? esc(due.number + " · " + due.title) : "") + "</span></div>" +
        "</div>" +
        '<div class="card" style="margin-top:1rem"><div class="card-head"><h2>Invoices</h2></div>' +
          (d.invoices.length ? '<div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Description</th><th>Issued</th><th>Due</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' +
            d.invoices.map(function (i) {
              return "<tr><td><b>" + esc(i.number) + "</b></td><td>" + esc(i.title) + "</td><td>" + esc(P.date(i.issue_date)) + "</td><td>" + esc(i.due_date ? P.date(i.due_date) : "-") +
                '</td><td class="num">' + esc(P.money(i.amount, i.currency)) + "</td><td>" + P.badge(i.displayStatus) +
                (i.status === "paid" && i.paid_date ? '<br><small class="faint">' + esc(P.date(i.paid_date)) + (i.payment_method ? " · " + esc(i.payment_method) : "") + "</small>" : "") + "</td></tr>";
            }).join("") + "</tbody></table></div>"
          : '<div class="empty"><b>No invoices yet</b>Invoices will show up here when we send them.</div>') +
          '<p class="note" style="margin-top:1rem">Payments are made by bank transfer or the method we agreed. Once we receive a payment, we mark the invoice as paid here.</p>' +
        "</div>";
    });
  }

  /* ---------- Store (Phase 2) ---------- */
  function store(view) {
    view.innerHTML = '<div class="topbar"><div><h1>Store performance</h1><p>Live numbers from your Shopify store.</p></div></div>' +
      '<div class="card soon"><div class="card-head"><h2>Connecting your store is coming soon</h2><span class="badge badge--blue">Phase 2</span></div>' +
      '<p class="muted">Soon you\'ll see your sales, orders, revenue and best-selling products here, updated automatically from Shopify. We\'ll send you a short, step-by-step guide to connect your store safely. It takes about 5 minutes.</p></div>';
  }

  P.requireUser("client").then(function (user) {
    return load().then(function () {
      P.shell({
        user: user,
        subtitle: data.client.company,
        nav: [
          { id: "overview", label: "Overview", icon: "home" },
          { id: "projects", label: "Projects", icon: "projects" },
          { id: "updates", label: "Updates", icon: "updates" },
          { id: "billing", label: "Billing", icon: "billing" },
          { id: "store", label: "Store", icon: "store" }
        ],
        views: { overview: overview, projects: projects, updates: updates, billing: billing, store: store }
      });
    });
  }).catch(function (e) {
    if (e.message === "redirect") return;
    document.getElementById("app").innerHTML = '<div style="padding:2rem"><div class="alert alert--error">' + esc(e.message) + '</div><p style="margin-top:1rem"><a class="btn" href="/portal/login.html">Back to sign in</a></p></div>';
  });
})();
