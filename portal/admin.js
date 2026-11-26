/* ==========================================================================
   WeDo Ecom Client Portal: admin dashboard (WeDo Ecom team only)
   ========================================================================== */
(function () {
  "use strict";
  var P = Portal, esc = P.esc;
  var SERVICES = ["Shopify Store Design", "Meta Ads Management", "AI UGC Video Ads", "Full Growth Package", "Other"];
  var PSTATUS = [{ value: "planning", label: "Planning" }, { value: "in_progress", label: "In progress" }, { value: "review", label: "In review" }, { value: "on_hold", label: "On hold" }, { value: "completed", label: "Completed" }];
  var TSTATUS = [{ value: "todo", label: "To do" }, { value: "in_progress", label: "In progress" }, { value: "done", label: "Done" }];
  var CURRENCIES = ["USD", "PKR", "GBP", "EUR", "AED"];
  var me = null;

  function today() { return new Date().toISOString().slice(0, 10); }
  function clientsList() { return P.api("/admin/clients").then(function (r) { return r.clients; }); }
  function topbar(title, sub, actions) {
    return '<div class="topbar"><div><h1>' + esc(title) + "</h1>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>" + (actions || "") + "</div>";
  }
  function on(root, sel, ev, fn) { root.querySelectorAll(sel).forEach(function (el) { el.addEventListener(ev, function (e) { fn(el, e); }); }); }

  /* ---------- Overview ---------- */
  function overview(view) {
    return P.api("/admin/overview").then(function (d) {
      view.innerHTML = topbar("Hi " + me.name.split(" ")[0], "Everything across your clients at a glance.") +
        '<div class="grid grid-4">' +
          '<div class="card stat fade-in"><span>Active clients</span><b>' + d.activeClients + "</b></div>" +
          '<div class="card stat fade-in"><span>Active projects</span><b>' + d.activeProjects + "</b></div>" +
          '<div class="card stat fade-in"><span>Waiting for payment</span><b>' + esc(d.pending.length ? d.pending.map(function (x) { return P.money(x.amount, x.currency); }).join(" + ") : P.money(0, "USD")) + "</b></div>" +
          '<div class="card stat fade-in' + (d.overdueInvoices ? "" : " stat--lime") + '"><span>Overdue invoices</span><b' + (d.overdueInvoices ? ' style="color:var(--red)"' : "") + ">" + d.overdueInvoices + "</b></div>" +
        "</div>" +
        '<div class="card" style="margin-top:1rem"><div class="card-head"><h2>Projects in motion</h2><button class="btn btn--sm btn--primary" type="button" data-new-project>' + P.icons.plus + "New project</button></div>" +
          (d.projects.length ? '<div class="list">' + d.projects.map(function (p) {
            return '<div class="row" data-project="' + p.id + '" style="cursor:pointer"><div class="row-main"><b>' + esc(p.name) + "</b><small>" + esc(p.company) + (p.due_date ? " · due " + esc(P.date(p.due_date)) : "") + '</small></div><div style="width:160px" class="bar"><i style="width:' + p.progress + '%"></i></div><span style="width:44px;text-align:right">' + p.progress + "%</span>" + P.badge(p.status) + "</div>";
          }).join("") + "</div>" : '<div class="empty"><b>No active projects</b>Add a client, then create their first project.</div>') +
        "</div>";
      on(view, "[data-project]", "click", function (el) { projectEditor(Number(el.getAttribute("data-project"))); });
      on(view, "[data-new-project]", "click", function () { newProject(); });
    });
  }

  /* ---------- Clients ---------- */
  function clients(view) {
    return clientsList().then(function (list) {
      view.innerHTML = topbar("Clients", "Each client gets their own private dashboard.", '<button class="btn btn--primary" type="button" data-new>' + P.icons.plus + "Add client</button>") +
        '<div class="card">' + (list.length ? '<div class="table-wrap"><table><thead><tr><th>Company</th><th>Contact</th><th>Portal login</th><th class="num">Active projects</th><th>Status</th></tr></thead><tbody>' +
          list.map(function (c) {
            return '<tr class="clickable" data-id="' + c.id + '"><td><b>' + esc(c.company) + "</b>" + (c.store_url ? '<br><small class="faint">' + esc(c.store_url) + "</small>" : "") + "</td><td>" + esc(c.contact_name || "-") + (c.email ? '<br><small class="faint">' + esc(c.email) + "</small>" : "") +
              "</td><td>" + (c.login_email ? esc(c.login_email) + '<br><small class="faint">' + (c.last_login ? "Last seen " + esc(P.ago(c.last_login)) : "Never signed in") + "</small>" : '<span class="faint">No login yet</span>') +
              '</td><td class="num">' + c.active_projects + "</td><td>" + P.badge(c.status) + "</td></tr>";
          }).join("") + "</tbody></table></div>" : '<div class="empty"><b>No clients yet</b>Add your first client to give them a portal login.</div>') + "</div>";
      on(view, "[data-new]", "click", function () { clientForm(null); });
      on(view, "tr[data-id]", "click", function (el) { clientDetail(Number(el.getAttribute("data-id"))); });
    });
  }

  function clientForm(c) {
    c = c || {};
    var d = P.dialog(c.id ? "Edit client" : "Add client",
      '<form novalidate><div class="form-grid">' +
        '<div class="field full"><label for="c-company">Company or brand</label><input id="c-company" name="company" required value="' + esc(c.company || "") + '"></div>' +
        '<div class="field"><label for="c-contact">Contact name</label><input id="c-contact" name="contact_name" value="' + esc(c.contact_name || "") + '"></div>' +
        '<div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" value="' + esc(c.email || "") + '"></div>' +
        '<div class="field"><label for="c-phone">Phone / WhatsApp</label><input id="c-phone" name="phone" value="' + esc(c.phone || "") + '"></div>' +
        '<div class="field"><label for="c-store">Store URL</label><input id="c-store" name="store_url" placeholder="brand.com" value="' + esc(c.store_url || "") + '"></div>' +
        (c.id ? '<div class="field"><label for="c-status">Status</label><select id="c-status" name="status">' + P.options([{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "archived", label: "Archived" }], c.status) + "</select></div>" : "") +
        '<div class="field full"><label for="c-notes">Private notes (only your team sees these)</label><textarea id="c-notes" name="notes">' + esc(c.notes || "") + "</textarea></div>" +
      '</div><div class="alert alert--error" data-error hidden style="margin-top:1rem"></div>' +
      '<div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">' + (c.id ? "Save changes" : "Add client") + "</button></div></form>");
    P.bindForm(d.querySelector("form"), function (data) {
      var req = c.id ? P.api("/admin/clients/" + c.id, { method: "PATCH", body: data }) : P.api("/admin/clients", { method: "POST", body: data });
      return req.then(function (r) { d.close(); P.toast(c.id ? "Client saved" : "Client added"); if (c.id) clientDetail(c.id); else clientDetail(r.id); });
    });
  }

  function clientDetail(id) {
    return P.api("/admin/clients/" + id).then(function (r) {
      var c = r.client, login = r.logins[0];
      var view = document.getElementById("view");
      view.innerHTML = '<p style="margin-bottom:1rem"><button class="btn btn--sm" type="button" data-back>← All clients</button></p>' +
        topbar(c.company, [c.contact_name, c.email, c.phone].filter(Boolean).join(" · "),
          '<div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn" type="button" data-edit>' + P.icons.edit + 'Edit</button><button class="btn btn--danger" type="button" data-delete>' + P.icons.trash + "Delete</button></div>") +
        '<div class="grid grid-3">' +
          '<div class="card"><div class="card-head"><h2>Portal login</h2></div>' +
            (login ? "<p><b>" + esc(login.email) + '</b></p><p class="note" style="margin:.3rem 0 1rem">' + (login.must_change_password ? "Waiting for first sign-in" : login.last_login ? "Last signed in " + esc(P.ago(login.last_login)) : "Never signed in") + '</p><button class="btn btn--sm" type="button" data-login>' + P.icons.key + "Reset password</button>"
              : '<p class="muted" style="margin-bottom:1rem">This client can\'t sign in yet.</p><form data-login-form novalidate><div class="field"><label for="l-email">Login email</label><input id="l-email" name="email" type="email" value="' + esc(c.email || "") + '"></div><div class="alert alert--error" data-error hidden style="margin-top:.6rem"></div><button class="btn btn--primary btn--sm" type="submit" style="margin-top:.8rem">Create portal login</button></form>') +
          "</div>" +
          '<div class="card span-2"><div class="card-head"><h2>Projects</h2><button class="btn btn--sm btn--primary" type="button" data-new-project>' + P.icons.plus + "New project</button></div>" +
            (r.projects.length ? '<div class="list">' + r.projects.map(function (p) {
              return '<div class="row" data-project="' + p.id + '" style="cursor:pointer"><div class="row-main"><b>' + esc(p.name) + "</b><small>" + esc(p.service || "") + (p.due_date ? " · due " + esc(P.date(p.due_date)) : "") + "</small></div>" + P.badge(p.status) + "</div>";
            }).join("") + "</div>" : '<div class="empty">No projects yet.</div>') +
          "</div>" +
        "</div>" +
        '<div class="card" style="margin-top:1rem"><div class="card-head"><h2>Invoices</h2><button class="btn btn--sm btn--primary" type="button" data-new-invoice>' + P.icons.plus + "New invoice</button></div>" +
          invoiceTable(r.invoices, false) + "</div>" +
        (c.notes ? '<div class="card" style="margin-top:1rem"><h2 style="margin-bottom:.6rem">Private notes</h2><p class="muted" style="white-space:pre-line">' + esc(c.notes) + "</p></div>" : "");

      on(view, "[data-back]", "click", function () { P.go("clients"); });
      on(view, "[data-edit]", "click", function () { clientForm(c); });
      on(view, "[data-delete]", "click", function () {
        P.confirm("Delete " + c.company + "?", "This permanently deletes the client, their portal login, projects, updates and invoices. It can't be undone.", "Delete client").then(function (ok) {
          if (!ok) return;
          P.api("/admin/clients/" + c.id, { method: "DELETE" }).then(function () { P.toast("Client deleted"); P.go("clients"); }).catch(function (e) { P.toast(e.message, true); });
        });
      });
      on(view, "[data-login]", "click", function () {
        P.confirm("Reset password?", "This signs " + c.company + " out everywhere and creates a new temporary password for them.", "Reset password").then(function (ok) {
          if (!ok) return;
          P.api("/admin/clients/" + c.id + "/login", { method: "POST", body: {} }).then(function (x) {
            P.showSecret("New temporary password", "Send these login details to " + c.company + " privately (for example on WhatsApp).", x.email, x.tempPassword);
          }).catch(function (e) { P.toast(e.message, true); });
        });
      });
      var lf = view.querySelector("[data-login-form]");
      if (lf) P.bindForm(lf, function (data) {
        return P.api("/admin/clients/" + c.id + "/login", { method: "POST", body: data }).then(function (x) {
          P.showSecret("Portal login created", "Send these login details to " + c.company + " privately (for example on WhatsApp).", x.email, x.tempPassword);
          clientDetail(c.id);
        });
      });
      on(view, "[data-project]", "click", function (el) { projectEditor(Number(el.getAttribute("data-project")), function () { clientDetail(c.id); }); });
      on(view, "[data-new-project]", "click", function () { newProject(c.id, function () { clientDetail(c.id); }); });
      on(view, "[data-new-invoice]", "click", function () { invoiceForm({ client_id: c.id }, function () { clientDetail(c.id); }); });
      bindInvoiceRows(view, function () { clientDetail(c.id); });
    }).catch(function (e) { P.toast(e.message, true); });
  }

  /* ---------- Projects ---------- */
  function projects(view) {
    return P.api("/admin/projects").then(function (r) {
      view.innerHTML = topbar("Projects", "Update progress here and clients see it right away.", '<button class="btn btn--primary" type="button" data-new>' + P.icons.plus + "New project</button>") +
        '<div class="card">' + (r.projects.length ? '<div class="table-wrap"><table><thead><tr><th>Project</th><th>Client</th><th>Progress</th><th>Next milestone</th><th>Status</th></tr></thead><tbody>' +
          r.projects.map(function (p) {
            return '<tr class="clickable" data-id="' + p.id + '"><td><b>' + esc(p.name) + '</b><br><small class="faint">' + esc(p.service || "") + "</small></td><td>" + esc(p.company) +
              '</td><td style="min-width:140px"><div class="bar"><i style="width:' + p.progress + '%"></i></div><small class="faint">' + p.progress + "% · " + p.taskCounts.done + "/" + p.taskCounts.total + " tasks</small></td><td>" +
              (p.nextMilestone ? esc(p.nextMilestone.title) + '<br><small class="faint">' + esc(P.date(p.nextMilestone.due_date)) + "</small>" : '<span class="faint">-</span>') + "</td><td>" + P.badge(p.status) + "</td></tr>";
          }).join("") + "</tbody></table></div>" : '<div class="empty"><b>No projects yet</b>Create a project for one of your clients.</div>') + "</div>";
      on(view, "[data-new]", "click", function () { newProject(); });
      on(view, "tr[data-id]", "click", function (el) { projectEditor(Number(el.getAttribute("data-id"))); });
    });
  }

  function newProject(clientId, after) {
    clientsList().then(function (list) {
      if (!list.length) { P.toast("Add a client first", true); P.go("clients"); return; }
      var d = P.dialog("New project",
        '<form novalidate><div class="form-grid">' +
          '<div class="field full"><label for="np-client">Client</label><select id="np-client" name="client_id">' + P.options(list.map(function (c) { return { value: c.id, label: c.company }; }), clientId) + "</select></div>" +
          '<div class="field full"><label for="np-name">Project name</label><input id="np-name" name="name" placeholder="e.g. Store redesign + launch ads" required></div>' +
          '<div class="field"><label for="np-service">Service</label><select id="np-service" name="service">' + P.options(SERVICES) + "</select></div>" +
          '<div class="field"><label for="np-status">Status</label><select id="np-status" name="status">' + P.options(PSTATUS, "planning") + "</select></div>" +
          '<div class="field"><label for="np-start">Start date</label><input id="np-start" name="start_date" type="date" value="' + today() + '"></div>' +
          '<div class="field"><label for="np-due">Target delivery</label><input id="np-due" name="due_date" type="date"></div>' +
          '<div class="field full"><label for="np-sum">Summary the client will see</label><textarea id="np-sum" name="summary" placeholder="What we\'re doing and why"></textarea></div>' +
        '</div><div class="alert alert--error" data-error hidden style="margin-top:1rem"></div>' +
        '<div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">Create project</button></div></form>');
      P.bindForm(d.querySelector("form"), function (data) {
        return P.api("/admin/projects", { method: "POST", body: data }).then(function (r) { d.close(); P.toast("Project created"); projectEditor(r.id, after); });
      });
    }).catch(function (e) { P.toast(e.message, true); });
  }

  function projectEditor(id, after) {
    P.api("/admin/projects/" + id).then(function (r) {
      var p = r.project;
      var d = P.dialog(p.name,
        '<p class="faint" style="margin-top:-.6rem">' + esc(p.company) + "</p>" +
        '<div class="seg" role="group" aria-label="Sections"><button type="button" aria-pressed="true" data-tab="tasks">Tasks</button><button type="button" aria-pressed="false" data-tab="milestones">Milestones</button><button type="button" aria-pressed="false" data-tab="details">Details</button></div>' +
        '<div data-pane="tasks">' +
          '<p class="note" style="margin-bottom:.6rem">Progress is worked out from the tasks: <b>' + p.progress + "%</b> done.</p>" +
          '<div class="list">' + (p.tasks.map(function (t) {
            return '<div class="row" data-task="' + t.id + '"><div class="row-main"><b>' + esc(t.title) + "</b><small>" + (t.assignee ? esc(t.assignee) : "Unassigned") + (t.due_date ? " · due " + esc(P.date(t.due_date)) : "") + '</small></div>' +
              '<select aria-label="Status of ' + esc(t.title) + '" data-task-status style="min-height:34px;border-radius:8px;border:1px solid var(--line);background:var(--black);padding:0 .5rem">' + P.options(TSTATUS, t.status) + "</select>" +
              '<button class="btn btn--icon btn--danger" type="button" data-task-del aria-label="Delete task">' + P.icons.trash + "</button></div>";
          }).join("") || '<div class="empty">No tasks yet. Add the first one below.</div>') + "</div>" +
          '<form data-task-form class="form-grid" style="margin-top:1rem" novalidate><div class="field full"><label for="t-title">New task</label><input id="t-title" name="title" placeholder="e.g. Design product page" required></div>' +
            '<div class="field"><label for="t-who">Assigned to</label><input id="t-who" name="assignee" placeholder="Team member"></div>' +
            '<div class="field"><label for="t-due">Due</label><input id="t-due" name="due_date" type="date"></div>' +
            '<div class="full"><div class="alert alert--error" data-error hidden></div><button class="btn btn--primary btn--sm" type="submit">' + P.icons.plus + "Add task</button></div></form>" +
        "</div>" +
        '<div data-pane="milestones" hidden>' +
          '<div class="list">' + (p.milestones.map(function (m) {
            return '<div class="row" data-ms="' + m.id + '"><label style="display:flex;gap:.6rem;align-items:center;flex:1;cursor:pointer"><input type="checkbox" data-ms-done' + (m.done ? " checked" : "") + '> <span><b>' + esc(m.title) + '</b><br><small class="faint">' + esc(P.date(m.due_date)) + "</small></span></label>" +
              '<button class="btn btn--icon btn--danger" type="button" data-ms-del aria-label="Delete milestone">' + P.icons.trash + "</button></div>";
          }).join("") || '<div class="empty">No milestones yet.</div>') + "</div>" +
          '<form data-ms-form class="form-grid" style="margin-top:1rem" novalidate><div class="field"><label for="m-title">New milestone</label><input id="m-title" name="title" placeholder="e.g. Store goes live" required></div>' +
            '<div class="field"><label for="m-due">Date</label><input id="m-due" name="due_date" type="date"></div>' +
            '<div class="full"><div class="alert alert--error" data-error hidden></div><button class="btn btn--primary btn--sm" type="submit">' + P.icons.plus + "Add milestone</button></div></form>" +
        "</div>" +
        '<div data-pane="details" hidden><form data-details novalidate><div class="form-grid">' +
          '<div class="field full"><label for="pd-name">Project name</label><input id="pd-name" name="name" value="' + esc(p.name) + '" required></div>' +
          '<div class="field"><label for="pd-service">Service</label><select id="pd-service" name="service">' + P.options(SERVICES, p.service) + "</select></div>" +
          '<div class="field"><label for="pd-status">Status</label><select id="pd-status" name="status">' + P.options(PSTATUS, p.status) + "</select></div>" +
          '<div class="field"><label for="pd-start">Start date</label><input id="pd-start" name="start_date" type="date" value="' + esc(p.start_date || "") + '"></div>' +
          '<div class="field"><label for="pd-due">Target delivery</label><input id="pd-due" name="due_date" type="date" value="' + esc(p.due_date || "") + '"></div>' +
          (p.progressFromTasks ? "" : '<div class="field"><label for="pd-progress">Progress % (used until you add tasks)</label><input id="pd-progress" name="progress" type="number" min="0" max="100" value="' + p.progress + '"></div>') +
          '<div class="field full"><label for="pd-sum">Summary the client sees</label><textarea id="pd-sum" name="summary">' + esc(p.summary || "") + "</textarea></div>" +
        '</div><div class="alert alert--error" data-error hidden style="margin-top:1rem"></div>' +
        '<div class="form-actions" style="justify-content:space-between"><button class="btn btn--danger" type="button" data-del-project>' + P.icons.trash + 'Delete project</button><button class="btn btn--primary" type="submit">Save details</button></div></form></div>' +
        '<div class="form-actions" style="margin-top:0"><button class="btn" type="button" data-post-update>Post an update to the client</button><button class="btn" type="button" data-close>Close</button></div>');

      var changed = false;
      d.addEventListener("close", function () { if (changed) { if (after) after(); else P.refresh(); } });
      var reopen = function (tab) { changed = true; d.close(); projectEditor(id, after); setTimeout(function () { var b = document.querySelector('dialog [data-tab="' + tab + '"]'); if (b) b.click(); }, 50); };

      on(d, "[data-tab]", "click", function (b) {
        d.querySelectorAll("[data-tab]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        d.querySelectorAll("[data-pane]").forEach(function (pane) { pane.hidden = pane.getAttribute("data-pane") !== b.getAttribute("data-tab"); });
      });
      on(d, "[data-task-status]", "change", function (sel) {
        var tid = sel.closest("[data-task]").getAttribute("data-task");
        P.api("/admin/tasks/" + tid, { method: "PATCH", body: { status: sel.value } }).then(function () { changed = true; P.toast("Task updated"); }).catch(function (e) { P.toast(e.message, true); });
      });
      on(d, "[data-task-del]", "click", function (b) {
        var tid = b.closest("[data-task]").getAttribute("data-task");
        P.api("/admin/tasks/" + tid, { method: "DELETE" }).then(function () { reopen("tasks"); }).catch(function (e) { P.toast(e.message, true); });
      });
      P.bindForm(d.querySelector("[data-task-form]"), function (data) {
        return P.api("/admin/projects/" + id + "/tasks", { method: "POST", body: data }).then(function () { reopen("tasks"); });
      });
      on(d, "[data-ms-done]", "change", function (cb) {
        var mid = cb.closest("[data-ms]").getAttribute("data-ms");
        P.api("/admin/milestones/" + mid, { method: "PATCH", body: { done: cb.checked } }).then(function () { changed = true; P.toast(cb.checked ? "Milestone done" : "Milestone reopened"); }).catch(function (e) { P.toast(e.message, true); });
      });
      on(d, "[data-ms-del]", "click", function (b) {
        var mid = b.closest("[data-ms]").getAttribute("data-ms");
        P.api("/admin/milestones/" + mid, { method: "DELETE" }).then(function () { reopen("milestones"); }).catch(function (e) { P.toast(e.message, true); });
      });
      P.bindForm(d.querySelector("[data-ms-form]"), function (data) {
        return P.api("/admin/projects/" + id + "/milestones", { method: "POST", body: data }).then(function () { reopen("milestones"); });
      });
      P.bindForm(d.querySelector("[data-details]"), function (data) {
        return P.api("/admin/projects/" + id, { method: "PATCH", body: data }).then(function () { changed = true; d.close(); P.toast("Project saved"); });
      });
      on(d, "[data-del-project]", "click", function () {
        d.close();
        P.confirm("Delete this project?", "This permanently deletes " + p.name + " with its tasks, milestones and updates.", "Delete project").then(function (ok) {
          if (!ok) return;
          P.api("/admin/projects/" + id, { method: "DELETE" }).then(function () { P.toast("Project deleted"); if (after) after(); else P.refresh(); });
        });
      });
      on(d, "[data-post-update]", "click", function () { d.close(); updateForm({ project_id: id, client_id: p.client_id }); });
    }).catch(function (e) { P.toast(e.message, true); });
  }

  /* ---------- Updates ---------- */
  function updates(view) {
    return P.api("/admin/updates").then(function (r) {
      view.innerHTML = topbar("Updates", "Post a project update to one client, or an announcement to everyone.", '<button class="btn btn--primary" type="button" data-new>' + P.icons.plus + "New update</button>") +
        '<div class="card"><div class="list">' + (r.updates.map(function (u) {
          return '<div class="row" data-id="' + u.id + '"><div class="row-main"><div class="feed-meta">' + (u.client_id ? "<span>" + esc(u.company || "") + "</span>" : '<span class="badge badge--blue">Everyone</span>') + (u.project_name ? "<span>· " + esc(u.project_name) + "</span>" : "") + "<span>· " + esc(P.ago(u.created_at)) + "</span></div><b>" + esc(u.title) + "</b>" + (u.body ? '<small style="display:block;white-space:pre-line">' + esc(u.body) + "</small>" : "") + "</div>" +
            '<button class="btn btn--icon btn--danger" type="button" data-del aria-label="Delete update">' + P.icons.trash + "</button></div>";
        }).join("") || '<div class="empty"><b>No updates yet</b>Updates you post show up on your clients\' dashboards.</div>') + "</div></div>";
      on(view, "[data-new]", "click", function () { updateForm({}); });
      on(view, "[data-del]", "click", function (b) {
        var uid = b.closest("[data-id]").getAttribute("data-id");
        P.confirm("Delete this update?", "Clients will no longer see it.", "Delete").then(function (ok) {
          if (ok) P.api("/admin/updates/" + uid, { method: "DELETE" }).then(function () { P.toast("Update deleted"); P.refresh(); });
        });
      });
    });
  }

  function updateForm(pre) {
    Promise.all([clientsList(), P.api("/admin/projects")]).then(function (res) {
      var list = res[0], projs = res[1].projects;
      var d = P.dialog("New update",
        '<form novalidate><div class="form-grid">' +
          '<div class="field"><label for="u-client">Who sees it</label><select id="u-client" name="client_id"><option value="">Everyone (announcement)</option>' + P.options(list.map(function (c) { return { value: c.id, label: c.company }; }), pre.client_id) + "</select></div>" +
          '<div class="field"><label for="u-project">Project (optional)</label><select id="u-project" name="project_id"><option value="">No specific project</option></select></div>' +
          '<div class="field full"><label for="u-title">Title</label><input id="u-title" name="title" required placeholder="e.g. Your new product page is live"></div>' +
          '<div class="field full"><label for="u-body">Message</label><textarea id="u-body" name="body" placeholder="Keep it short and clear."></textarea></div>' +
        '</div><div class="alert alert--error" data-error hidden style="margin-top:1rem"></div>' +
        '<div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">Post update</button></div></form>');
      var cSel = d.querySelector("#u-client"), pSel = d.querySelector("#u-project");
      function fillProjects() {
        var cid = Number(cSel.value);
        pSel.innerHTML = '<option value="">No specific project</option>' + P.options(projs.filter(function (p) { return p.client_id === cid; }).map(function (p) { return { value: p.id, label: p.name }; }), pre.project_id);
        pSel.disabled = !cid;
      }
      cSel.addEventListener("change", function () { pre.project_id = null; fillProjects(); });
      fillProjects();
      P.bindForm(d.querySelector("form"), function (data) {
        return P.api("/admin/updates", { method: "POST", body: data }).then(function () { d.close(); P.toast("Update posted"); if (location.hash === "#updates") P.refresh(); });
      });
    }).catch(function (e) { P.toast(e.message, true); });
  }

  /* ---------- Invoices ---------- */
  function invoiceTable(list, withClient) {
    if (!list.length) return '<div class="empty">No invoices yet.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Invoice</th>' + (withClient ? "<th>Client</th>" : "") + '<th>Description</th><th>Due</th><th class="num">Amount</th><th>Status</th><th></th></tr></thead><tbody>' +
      list.map(function (i) {
        return '<tr data-invoice=\'' + esc(JSON.stringify(i)) + "'><td><b>" + esc(i.number) + '</b><br><small class="faint">' + esc(P.date(i.issue_date)) + "</small></td>" + (withClient ? "<td>" + esc(i.company) + "</td>" : "") +
          "<td>" + esc(i.title) + "</td><td>" + esc(i.due_date ? P.date(i.due_date) : "-") + '</td><td class="num">' + esc(P.money(i.amount, i.currency)) + "</td><td>" + P.badge(i.displayStatus) + "</td>" +
          '<td style="white-space:nowrap;text-align:right">' + (i.status !== "paid" ? '<button class="btn btn--sm" type="button" data-paid>' + P.icons.check + "Mark paid</button> " : "") + '<button class="btn btn--icon" type="button" data-edit-invoice aria-label="Edit invoice">' + P.icons.edit + "</button></td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function bindInvoiceRows(root, after) {
    on(root, "[data-paid]", "click", function (b) {
      var i = JSON.parse(b.closest("tr").getAttribute("data-invoice"));
      var d = P.dialog("Mark " + i.number + " as paid",
        '<form novalidate><div class="form-grid"><div class="field"><label for="pp-date">Paid on</label><input id="pp-date" name="paid_date" type="date" value="' + today() + '"></div>' +
        '<div class="field"><label for="pp-method">Paid by</label><input id="pp-method" name="payment_method" placeholder="Bank transfer, JazzCash, Payoneer..."></div></div>' +
        '<div class="alert alert--error" data-error hidden style="margin-top:1rem"></div><div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">Mark as paid</button></div></form>');
      P.bindForm(d.querySelector("form"), function (data) {
        data.status = "paid";
        return P.api("/admin/invoices/" + i.id, { method: "PATCH", body: data }).then(function () { d.close(); P.toast("Invoice marked paid"); after(); });
      });
    });
    on(root, "[data-edit-invoice]", "click", function (b) { invoiceForm(JSON.parse(b.closest("tr").getAttribute("data-invoice")), after); });
  }

  function invoices(view) {
    return P.api("/admin/invoices").then(function (r) {
      view.innerHTML = topbar("Invoices", "Clients see an invoice once its status is Due or Paid. Drafts stay private.", '<button class="btn btn--primary" type="button" data-new>' + P.icons.plus + "New invoice</button>") +
        '<div class="card">' + invoiceTable(r.invoices, true) + "</div>";
      on(view, "[data-new]", "click", function () { invoiceForm({}, P.refresh); });
      bindInvoiceRows(view, P.refresh);
    });
  }

  function invoiceForm(inv, after) {
    clientsList().then(function (list) {
      if (!list.length) { P.toast("Add a client first", true); return; }
      var isEdit = !!inv.id;
      var number = inv.number || ("WDE-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900) + 100));
      var d = P.dialog(isEdit ? "Edit invoice " + inv.number : "New invoice",
        '<form novalidate><div class="form-grid">' +
          (isEdit ? "" : '<div class="field full"><label for="i-client">Client</label><select id="i-client" name="client_id">' + P.options(list.map(function (c) { return { value: c.id, label: c.company }; }), inv.client_id) + "</select></div>") +
          '<div class="field"><label for="i-num">Invoice number</label><input id="i-num" name="number" required value="' + esc(number) + '"></div>' +
          '<div class="field"><label for="i-status">Status</label><select id="i-status" name="status">' + P.options([{ value: "draft", label: "Draft (client can't see it)" }, { value: "sent", label: "Due (client sees it)" }, { value: "paid", label: "Paid" }], inv.status || "sent") + "</select></div>" +
          '<div class="field full"><label for="i-title">Description</label><input id="i-title" name="title" required placeholder="e.g. Meta Ads Management, December" value="' + esc(inv.title || "") + '"></div>' +
          '<div class="field"><label for="i-amount">Amount</label><input id="i-amount" name="amount" type="number" min="0" step="0.01" required value="' + (inv.amount != null ? inv.amount : "") + '"></div>' +
          '<div class="field"><label for="i-cur">Currency</label><select id="i-cur" name="currency">' + P.options(CURRENCIES, inv.currency || "USD") + "</select></div>" +
          '<div class="field"><label for="i-issue">Issue date</label><input id="i-issue" name="issue_date" type="date" value="' + esc(inv.issue_date || today()) + '"></div>' +
          '<div class="field"><label for="i-due">Due date</label><input id="i-due" name="due_date" type="date" value="' + esc(inv.due_date || "") + '"></div>' +
          '<div class="field full"><label for="i-notes">Notes for the client</label><textarea id="i-notes" name="notes" placeholder="Payment details, bank account, etc.">' + esc(inv.notes || "") + "</textarea></div>" +
        '</div><div class="alert alert--error" data-error hidden style="margin-top:1rem"></div>' +
        '<div class="form-actions"' + (isEdit ? ' style="justify-content:space-between"' : "") + ">" + (isEdit ? '<button class="btn btn--danger" type="button" data-del>' + P.icons.trash + "Delete</button>" : "") +
          '<span style="display:flex;gap:.6rem"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">' + (isEdit ? "Save invoice" : "Create invoice") + "</button></span></div></form>");
      P.bindForm(d.querySelector("form"), function (data) {
        var req = isEdit ? P.api("/admin/invoices/" + inv.id, { method: "PATCH", body: data }) : P.api("/admin/invoices", { method: "POST", body: data });
        return req.then(function () { d.close(); P.toast(isEdit ? "Invoice saved" : "Invoice created"); if (after) after(); });
      });
      var del = d.querySelector("[data-del]");
      if (del) del.addEventListener("click", function () {
        d.close();
        P.confirm("Delete invoice " + inv.number + "?", "It will be removed from the client's billing history. This can't be undone.", "Delete invoice").then(function (ok) {
          if (ok) P.api("/admin/invoices/" + inv.id, { method: "DELETE" }).then(function () { P.toast("Invoice deleted"); if (after) after(); });
        });
      });
    }).catch(function (e) { P.toast(e.message, true); });
  }

  /* ---------- Team ---------- */
  function team(view) {
    return P.api("/admin/team").then(function (r) {
      view.innerHTML = topbar("Team", "People at WeDo Ecom who can use this admin area.", '<button class="btn btn--primary" type="button" data-new>' + P.icons.plus + "Add team member</button>") +
        '<div class="card"><div class="list">' + r.team.map(function (t) {
          return '<div class="row" data-id="' + t.id + '"><div class="row-main"><b>' + esc(t.name) + (t.id === r.you ? ' <span class="faint">(you)</span>' : "") + "</b><small>" + esc(t.email) + " · " + (t.last_login ? "last seen " + esc(P.ago(t.last_login)) : "never signed in") + "</small></div>" +
            (t.id === r.you ? "" : '<button class="btn btn--sm btn--danger" type="button" data-del>Remove</button>') + "</div>";
        }).join("") + "</div></div>";
      on(view, "[data-new]", "click", function () {
        var d = P.dialog("Add team member",
          '<form novalidate><div class="form-grid"><div class="field"><label for="tm-name">Name</label><input id="tm-name" name="name" required></div><div class="field"><label for="tm-email">Email</label><input id="tm-email" name="email" type="email" required></div></div>' +
          '<p class="note" style="margin-top:.8rem">They get full admin access: all clients, projects and invoices.</p>' +
          '<div class="alert alert--error" data-error hidden style="margin-top:1rem"></div><div class="form-actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn btn--primary" type="submit">Add team member</button></div></form>');
        P.bindForm(d.querySelector("form"), function (data) {
          return P.api("/admin/team", { method: "POST", body: data }).then(function (x) {
            d.close(); P.showSecret("Team member added", "Send these login details privately.", x.email, x.tempPassword); P.refresh();
          });
        });
      });
      on(view, "[data-del]", "click", function (b) {
        var row = b.closest("[data-id]");
        P.confirm("Remove this team member?", "They'll lose access to the admin area immediately.", "Remove").then(function (ok) {
          if (ok) P.api("/admin/team/" + row.getAttribute("data-id"), { method: "DELETE" }).then(function () { P.toast("Removed"); P.refresh(); }).catch(function (e) { P.toast(e.message, true); });
        });
      });
    });
  }

  P.requireUser("admin").then(function (user) {
    me = user;
    P.shell({
      user: user,
      subtitle: "WeDo Ecom team",
      nav: [
        { id: "overview", label: "Overview", icon: "home" },
        { id: "clients", label: "Clients", icon: "clients" },
        { id: "projects", label: "Projects", icon: "projects" },
        { id: "updates", label: "Updates", icon: "updates" },
        { id: "invoices", label: "Invoices", icon: "billing" },
        { id: "team", label: "Team", icon: "team" }
      ],
      views: { overview: overview, clients: clients, projects: projects, updates: updates, invoices: invoices, team: team }
    });
  }).catch(function (e) {
    if (e.message === "redirect") return;
    document.getElementById("app").innerHTML = '<div style="padding:2rem"><div class="alert alert--error">' + esc(e.message) + '</div><p style="margin-top:1rem"><a class="btn" href="/portal/login.html">Back to sign in</a></p></div>';
  });
})();
