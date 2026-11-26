/* ==========================================================================
   WeDo Ecom Client Portal: API (Cloudflare Pages Function + D1)
   Every request to /api/* lands here.

   Needs (set in Cloudflare Pages → Settings):
   - D1 database binding named DB
   - Secret SETUP_KEY: a long random phrase, used once to create the first
     admin account at /portal/setup.html

   Security model
   - Passwords: PBKDF2-SHA256 with a random salt per user.
   - Sessions: random 256-bit token in an HttpOnly, Secure, SameSite cookie;
     only its SHA-256 hash is stored in the database.
   - Clients can only ever read rows that belong to their own client_id.
   - Changes (POST/PATCH/DELETE) must come from this site's own origin.
   - Login attempts are rate-limited per email and per IP.
   ========================================================================== */

const SESSION_COOKIE = "wedo_sess";
const SESSION_DAYS = 14;
const PBKDF2_ITERATIONS = 100000; // the most Cloudflare Workers allows
const MAX_BODY = 64 * 1024;

const PROJECT_STATUS = ["planning", "in_progress", "review", "completed", "on_hold"];
const TASK_STATUS = ["todo", "in_progress", "done"];
const INVOICE_STATUS = ["draft", "sent", "paid"];
const SERVICES = ["Shopify Store Design", "Meta Ads Management", "AI UGC Video Ads", "Full Growth Package", "Other"];

/* ---------------- Schema (created automatically on first request) -------- */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS clients (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     company TEXT NOT NULL, contact_name TEXT, email TEXT, phone TEXT, store_url TEXT,
     notes TEXT, status TEXT NOT NULL DEFAULT 'active',
     created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
     password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','client')),
     client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
     must_change_password INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT (datetime('now')), last_login TEXT)`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
     id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL, at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_key ON login_attempts(key, at)`,
  `CREATE TABLE IF NOT EXISTS projects (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     name TEXT NOT NULL, service TEXT, status TEXT NOT NULL DEFAULT 'planning',
     progress INTEGER NOT NULL DEFAULT 0, summary TEXT, start_date TEXT, due_date TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id)`,
  `CREATE TABLE IF NOT EXISTS tasks (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'todo', assignee TEXT, due_date TEXT,
     sort INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)`,
  `CREATE TABLE IF NOT EXISTS milestones (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     title TEXT NOT NULL, due_date TEXT, done INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id)`,
  `CREATE TABLE IF NOT EXISTS updates (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
     project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
     kind TEXT NOT NULL DEFAULT 'update', title TEXT NOT NULL, body TEXT,
     author TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_updates_client ON updates(client_id)`,
  `CREATE TABLE IF NOT EXISTS invoices (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     number TEXT NOT NULL, title TEXT NOT NULL, amount_cents INTEGER NOT NULL,
     currency TEXT NOT NULL DEFAULT 'USD', issue_date TEXT, due_date TEXT,
     status TEXT NOT NULL DEFAULT 'draft', paid_date TEXT, payment_method TEXT, notes TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id)`
];

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch(SCHEMA.map((s) => db.prepare(s)));
  schemaReady = true;
}

/* ---------------- Small helpers ----------------------------------------- */
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) fail(415, "Send JSON.");
  const text = await request.text();
  if (text.length > MAX_BODY) fail(413, "That request is too large.");
  try { return JSON.parse(text || "{}"); } catch { fail(400, "That request isn't valid JSON."); }
}

const v = {
  str(x, name, { max = 500, required = false } = {}) {
    if (x === undefined || x === null || x === "") { if (required) fail(400, `${name} is required.`); return null; }
    if (typeof x !== "string") fail(400, `${name} must be text.`);
    const s = x.trim();
    if (required && !s) fail(400, `${name} is required.`);
    if (s.length > max) fail(400, `${name} is too long (max ${max} characters).`);
    return s || null;
  },
  email(x, name = "Email", required = true) {
    const s = v.str(x, name, { max: 200, required });
    if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) fail(400, `${name} isn't a valid email address.`);
    return s ? s.toLowerCase() : null;
  },
  date(x, name) {
    if (x === undefined || x === null || x === "") return null;
    if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) fail(400, `${name} must be a date like 2026-12-31.`);
    return x;
  },
  oneOf(x, list, name, fallback) {
    if (x === undefined || x === null || x === "") return fallback;
    if (!list.includes(x)) fail(400, `${name} must be one of: ${list.join(", ")}.`);
    return x;
  },
  int(x, name, { min = 0, max = 1e12 } = {}) {
    const n = Number(x);
    if (!Number.isInteger(n) || n < min || n > max) fail(400, `${name} must be a whole number between ${min} and ${max}.`);
    return n;
  },
  password(x) {
    if (typeof x !== "string" || x.length < 10) fail(400, "Password must be at least 10 characters.");
    if (x.length > 200) fail(400, "Password is too long.");
    return x;
  }
};

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- Crypto ------------------------------------------------- */
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (buf) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function randomBytes(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
async function sha256hex(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}
async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}
async function verifyPassword(password, stored) {
  const [alg, iter, salt, hash] = String(stored || "").split("$");
  if (alg !== "pbkdf2") return false;
  const test = await pbkdf2(password, unb64(salt), Number(iter));
  return safeEqual(b64(test), hash);
}
// A readable temporary password, e.g. "wedo-K7mQ-2xPa-9fRt"
function tempPassword() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const r = randomBytes(12);
  const part = (o) => [...r.slice(o, o + 4)].map((b) => abc[b % abc.length]).join("");
  return `wedo-${part(0)}-${part(4)}-${part(8)}`;
}
// A fake hash so "no such user" takes as long as "wrong password"
let dummyHash = null;

/* ---------------- Sessions ---------------------------------------------- */
function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}
function sessionCookie(token, maxAge) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
async function createSession(db, userId) {
  const token = b64url(randomBytes(32));
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256hex(token), userId, expires).run();
  return token;
}
async function currentUser(request, db) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const row = await db.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.client_id, u.must_change_password, s.expires_at, s.token_hash
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`
  ).bind(await sha256hex(token)).first();
  if (!row) return null;
  if (row.expires_at < new Date().toISOString()) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(row.token_hash).run();
    return null;
  }
  return row;
}
function requireUser(user) { if (!user) fail(401, "Please sign in."); return user; }
function requireAdmin(user) {
  requireUser(user);
  if (user.role !== "admin") fail(403, "Only the WeDo Ecom team can do that.");
  if (user.must_change_password) fail(403, "Please set a new password first.");
  return user;
}
function requireClient(user) {
  requireUser(user);
  if (user.role !== "client" || !user.client_id) fail(403, "This area is for client accounts.");
  if (user.must_change_password) fail(403, "Please set a new password first.");
  return user;
}

/* ---------------- Rate limiting ----------------------------------------- */
async function tooManyAttempts(db, keys) {
  for (const key of keys) {
    const r = await db.prepare(
      "SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND at > datetime('now', '-15 minutes')"
    ).bind(key).first();
    if (r && r.n >= 8) return true;
  }
  return false;
}
async function recordAttempt(db, keys) {
  await db.batch(keys.map((k) => db.prepare("INSERT INTO login_attempts (key) VALUES (?)").bind(k)));
  await db.prepare("DELETE FROM login_attempts WHERE at < datetime('now', '-1 day')").run();
}

/* ---------------- Shapes sent to the browser ----------------------------- */
const publicUser = (u, client) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  mustChangePassword: !!u.must_change_password,
  client: client ? { id: client.id, company: client.company } : null
});

function invoiceView(i) {
  const overdue = i.status === "sent" && i.due_date && i.due_date < today();
  return { ...i, amount: i.amount_cents / 100, displayStatus: overdue ? "overdue" : i.status };
}

async function projectWithDetails(db, project) {
  const [tasks, milestones] = await Promise.all([
    db.prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY sort, id").bind(project.id).all(),
    db.prepare("SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date IS NULL, due_date, id").bind(project.id).all()
  ]);
  const t = tasks.results || [];
  const done = t.filter((x) => x.status === "done").length;
  return {
    ...project,
    progress: t.length ? Math.round((done / t.length) * 100) : project.progress,
    progressFromTasks: t.length > 0,
    taskCounts: { total: t.length, done, in_progress: t.filter((x) => x.status === "in_progress").length, todo: t.filter((x) => x.status === "todo").length },
    tasks: t,
    milestones: milestones.results || []
  };
}

/* ---------------- Router ------------------------------------------------- */
const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "(\\d+)"; }) + "$");
  routes.push({ method, re, keys, handler });
};

export async function onRequest(context) {
  const { request, env } = context;
  try {
    if (!env.DB) fail(500, "The portal database isn't connected yet (missing DB binding).");
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Changes must come from this site (stops other sites using a signed-in browser)
    if (method !== "GET" && method !== "HEAD") {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) fail(403, "Request blocked: wrong origin.");
    }

    await ensureSchema(env.DB);
    const path = url.pathname.replace(/\/+$/, "");
    for (const r of routes) {
      if (r.method !== method) continue;
      const m = path.match(r.re);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => (params[k] = Number(m[i + 1])));
      const user = await currentUser(request, env.DB);
      return await r.handler({ request, env, db: env.DB, url, params, user });
    }
    fail(404, "Not found.");
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on our side. Please try again." }, 500);
  }
}

/* ---------------- Auth --------------------------------------------------- */
route("GET", "/api/auth/status", async ({ db }) => {
  const admin = await db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first();
  return json({ needsSetup: !admin });
});

route("POST", "/api/auth/setup", async ({ request, env, db }) => {
  const admin = await db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first();
  if (admin) fail(409, "The portal is already set up. Sign in instead.");
  if (!env.SETUP_KEY || env.SETUP_KEY.length < 12) fail(500, "Setup is locked: add a SETUP_KEY secret (12+ characters) in Cloudflare first.");
  const body = await readBody(request);
  if (!safeEqual(String(body.setupKey || ""), env.SETUP_KEY)) fail(403, "That setup key isn't right.");
  const name = v.str(body.name, "Name", { required: true, max: 100 });
  const email = v.email(body.email);
  const hash = await hashPassword(v.password(body.password));
  const r = await db.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')").bind(email, name, hash).run();
  const token = await createSession(db, r.meta.last_row_id);
  return json({ ok: true }, 201, { "set-cookie": sessionCookie(token, SESSION_DAYS * 86400) });
});

route("POST", "/api/auth/login", async ({ request, db }) => {
  const body = await readBody(request);
  const email = v.email(body.email);
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const keys = ["email:" + email, "ip:" + ip];
  if (await tooManyAttempts(db, keys)) fail(429, "Too many sign-in attempts. Wait 15 minutes and try again.");
  const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!dummyHash) dummyHash = await hashPassword("not-a-real-password");
  const ok = await verifyPassword(password, user ? user.password_hash : dummyHash);
  if (!user || !ok) {
    await recordAttempt(db, keys);
    fail(401, "That email or password isn't right.");
  }
  const token = await createSession(db, user.id);
  await db.batch([
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(user.id),
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(new Date().toISOString())
  ]);
  return json({ ok: true, role: user.role, mustChangePassword: !!user.must_change_password }, 200,
    { "set-cookie": sessionCookie(token, SESSION_DAYS * 86400) });
});

route("POST", "/api/auth/logout", async ({ request, db }) => {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256hex(token)).run();
  return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
});

route("GET", "/api/auth/me", async ({ db, user }) => {
  requireUser(user);
  const client = user.client_id ? await db.prepare("SELECT id, company FROM clients WHERE id = ?").bind(user.client_id).first() : null;
  return json({ user: publicUser(user, client) });
});

route("POST", "/api/auth/password", async ({ request, db, user }) => {
  requireUser(user);
  const body = await readBody(request);
  const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first();
  if (!(await verifyPassword(String(body.current || ""), row.password_hash))) fail(400, "Your current password isn't right.");
  const next = v.password(body.next);
  if (next === body.current) fail(400, "Choose a new password that's different from the old one.");
  await db.batch([
    db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").bind(await hashPassword(next), user.id),
    // sign out every other device
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").bind(user.id, user.token_hash)
  ]);
  return json({ ok: true });
});

/* ---------------- Client area (only their own data) ---------------------- */
route("GET", "/api/me/dashboard", async ({ db, user }) => {
  requireClient(user);
  const cid = user.client_id;
  const [client, projects, updates, invoices] = await Promise.all([
    db.prepare("SELECT id, company, contact_name, store_url FROM clients WHERE id = ?").bind(cid).first(),
    db.prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY CASE status WHEN 'completed' THEN 1 ELSE 0 END, updated_at DESC").bind(cid).all(),
    db.prepare(`SELECT u.id, u.kind, u.title, u.body, u.author, u.created_at, u.project_id, p.name AS project_name
                  FROM updates u LEFT JOIN projects p ON p.id = u.project_id
                 WHERE u.client_id = ? OR u.client_id IS NULL
                 ORDER BY u.created_at DESC, u.id DESC LIMIT 30`).bind(cid).all(),
    db.prepare("SELECT * FROM invoices WHERE client_id = ? AND status != 'draft' ORDER BY issue_date DESC, id DESC").bind(cid).all()
  ]);
  const detailed = await Promise.all((projects.results || []).map((p) => projectWithDetails(db, p)));
  const inv = (invoices.results || []).map(invoiceView);
  const byCurrency = (list) => list.reduce((acc, i) => { acc[i.currency] = (acc[i.currency] || 0) + i.amount; return acc; }, {});
  return json({
    client,
    projects: detailed,
    updates: updates.results || [],
    invoices: inv,
    billing: {
      paid: byCurrency(inv.filter((i) => i.status === "paid")),
      pending: byCurrency(inv.filter((i) => i.status === "sent")),
      nextDue: inv.filter((i) => i.status === "sent").sort((a, b) => (a.due_date || "9").localeCompare(b.due_date || "9"))[0] || null
    }
  });
});

/* ---------------- Admin: overview ---------------------------------------- */
route("GET", "/api/admin/overview", async ({ db, user }) => {
  requireAdmin(user);
  const [clients, active, pending, overdue, recent] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM clients WHERE status = 'active'").first(),
    db.prepare("SELECT COUNT(*) AS n FROM projects WHERE status IN ('planning','in_progress','review')").first(),
    db.prepare("SELECT currency, SUM(amount_cents) AS cents, COUNT(*) AS n FROM invoices WHERE status = 'sent' GROUP BY currency").all(),
    db.prepare("SELECT COUNT(*) AS n FROM invoices WHERE status = 'sent' AND due_date < ?").bind(today()).first(),
    db.prepare(`SELECT p.id, p.name, p.status, p.progress, p.due_date, c.company FROM projects p JOIN clients c ON c.id = p.client_id
                 WHERE p.status != 'completed' ORDER BY p.updated_at DESC LIMIT 8`).all()
  ]);
  const projects = await Promise.all((recent.results || []).map(async (p) => {
    const t = await db.prepare("SELECT COUNT(*) AS total, SUM(status='done') AS done FROM tasks WHERE project_id = ?").bind(p.id).first();
    return { ...p, progress: t.total ? Math.round((t.done / t.total) * 100) : p.progress };
  }));
  return json({
    activeClients: clients.n, activeProjects: active.n, overdueInvoices: overdue.n,
    pending: (pending.results || []).map((r) => ({ currency: r.currency, amount: r.cents / 100, count: r.n })),
    projects
  });
});

/* ---------------- Admin: clients & their logins -------------------------- */
const clientFields = (b, partial) => {
  const out = {};
  if (!partial || "company" in b) out.company = v.str(b.company, "Company", { required: true, max: 120 });
  if (!partial || "contact_name" in b) out.contact_name = v.str(b.contact_name, "Contact name", { max: 120 });
  if (!partial || "email" in b) out.email = v.email(b.email, "Email", false);
  if (!partial || "phone" in b) out.phone = v.str(b.phone, "Phone", { max: 40 });
  if (!partial || "store_url" in b) out.store_url = v.str(b.store_url, "Store URL", { max: 200 });
  if (!partial || "notes" in b) out.notes = v.str(b.notes, "Notes", { max: 2000 });
  if ("status" in b) out.status = v.oneOf(b.status, ["active", "paused", "archived"], "Status", "active");
  return out;
};
function updateSql(table, fields, id) {
  const keys = Object.keys(fields);
  if (!keys.length) fail(400, "Nothing to change.");
  return { sql: `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`, args: [...keys.map((k) => fields[k]), id] };
}

route("GET", "/api/admin/clients", async ({ db, user }) => {
  requireAdmin(user);
  const r = await db.prepare(`SELECT c.*,
      (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.status != 'completed') AS active_projects,
      (SELECT email FROM users u WHERE u.client_id = c.id LIMIT 1) AS login_email,
      (SELECT last_login FROM users u WHERE u.client_id = c.id LIMIT 1) AS last_login
    FROM clients c ORDER BY c.status = 'archived', c.company COLLATE NOCASE`).all();
  return json({ clients: r.results || [] });
});

route("POST", "/api/admin/clients", async ({ request, db, user }) => {
  requireAdmin(user);
  const f = clientFields(await readBody(request), false);
  const r = await db.prepare("INSERT INTO clients (company, contact_name, email, phone, store_url, notes) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(f.company, f.contact_name, f.email, f.phone, f.store_url, f.notes).run();
  return json({ id: r.meta.last_row_id }, 201);
});

route("GET", "/api/admin/clients/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  const client = await db.prepare("SELECT * FROM clients WHERE id = ?").bind(params.id).first();
  if (!client) fail(404, "Client not found.");
  const [login, projects, invoices] = await Promise.all([
    db.prepare("SELECT id, email, name, last_login, must_change_password FROM users WHERE client_id = ?").bind(params.id).all(),
    db.prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY updated_at DESC").bind(params.id).all(),
    db.prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY issue_date DESC, id DESC").bind(params.id).all()
  ]);
  return json({ client, logins: login.results || [], projects: projects.results || [], invoices: (invoices.results || []).map(invoiceView) });
});

route("PATCH", "/api/admin/clients/:id", async ({ request, db, user, params }) => {
  requireAdmin(user);
  const q = updateSql("clients", clientFields(await readBody(request), true), params.id);
  const r = await db.prepare(q.sql).bind(...q.args).run();
  if (!r.meta.changes) fail(404, "Client not found.");
  return json({ ok: true });
});

route("DELETE", "/api/admin/clients/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  const id = params.id;
  const projectIds = "SELECT id FROM projects WHERE client_id = ?";
  await db.batch([
    db.prepare(`DELETE FROM tasks WHERE project_id IN (${projectIds})`).bind(id),
    db.prepare(`DELETE FROM milestones WHERE project_id IN (${projectIds})`).bind(id),
    db.prepare(`DELETE FROM updates WHERE client_id = ? OR project_id IN (${projectIds})`).bind(id, id),
    db.prepare("DELETE FROM projects WHERE client_id = ?").bind(id),
    db.prepare("DELETE FROM invoices WHERE client_id = ?").bind(id),
    db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE client_id = ?)").bind(id),
    db.prepare("DELETE FROM users WHERE client_id = ?").bind(id),
    db.prepare("DELETE FROM clients WHERE id = ?").bind(id)
  ]);
  return json({ ok: true });
});

// Create or reset the client's login. Returns a temporary password ONCE.
route("POST", "/api/admin/clients/:id/login", async ({ request, db, user, params }) => {
  requireAdmin(user);
  const client = await db.prepare("SELECT * FROM clients WHERE id = ?").bind(params.id).first();
  if (!client) fail(404, "Client not found.");
  const body = await readBody(request);
  const existing = await db.prepare("SELECT id FROM users WHERE client_id = ?").bind(params.id).first();
  const pass = tempPassword();
  const hash = await hashPassword(pass);
  if (existing) {
    await db.batch([
      db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").bind(hash, existing.id),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(existing.id)
    ]);
    const row = await db.prepare("SELECT email FROM users WHERE id = ?").bind(existing.id).first();
    return json({ email: row.email, tempPassword: pass, reset: true });
  }
  const email = v.email(body.email || client.email, "Login email");
  const taken = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (taken) fail(409, "That email already has a portal login.");
  await db.prepare("INSERT INTO users (email, name, password_hash, role, client_id, must_change_password) VALUES (?, ?, ?, 'client', ?, 1)")
    .bind(email, client.contact_name || client.company, hash, params.id).run();
  return json({ email, tempPassword: pass, reset: false }, 201);
});

/* ---------------- Admin: projects, tasks, milestones --------------------- */
const projectFields = (b, partial) => {
  const out = {};
  if (!partial || "name" in b) out.name = v.str(b.name, "Project name", { required: true, max: 140 });
  if (!partial || "service" in b) out.service = v.oneOf(b.service, SERVICES, "Service", "Other");
  if (!partial || "status" in b) out.status = v.oneOf(b.status, PROJECT_STATUS, "Status", "planning");
  if (!partial || "progress" in b) out.progress = b.progress === undefined || b.progress === "" ? 0 : v.int(b.progress, "Progress", { min: 0, max: 100 });
  if (!partial || "summary" in b) out.summary = v.str(b.summary, "Summary", { max: 3000 });
  if (!partial || "start_date" in b) out.start_date = v.date(b.start_date, "Start date");
  if (!partial || "due_date" in b) out.due_date = v.date(b.due_date, "Due date");
  return out;
};

route("GET", "/api/admin/projects", async ({ db, user, url }) => {
  requireAdmin(user);
  const cid = url.searchParams.get("client_id");
  const stmt = cid
    ? db.prepare("SELECT p.*, c.company FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.client_id = ? ORDER BY p.updated_at DESC").bind(Number(cid))
    : db.prepare("SELECT p.*, c.company FROM projects p JOIN clients c ON c.id = p.client_id ORDER BY p.status = 'completed', p.updated_at DESC");
  const r = await stmt.all();
  const list = await Promise.all((r.results || []).map((p) => projectWithDetails(db, p)));
  return json({ projects: list.map(({ tasks, milestones, ...p }) => ({ ...p, nextMilestone: milestones.find((m) => !m.done) || null })) });
});

route("POST", "/api/admin/projects", async ({ request, db, user }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const clientId = v.int(b.client_id, "Client", { min: 1 });
  if (!(await db.prepare("SELECT id FROM clients WHERE id = ?").bind(clientId).first())) fail(400, "Pick a client that exists.");
  const f = projectFields(b, false);
  const r = await db.prepare("INSERT INTO projects (client_id, name, service, status, progress, summary, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(clientId, f.name, f.service, f.status, f.progress, f.summary, f.start_date, f.due_date).run();
  return json({ id: r.meta.last_row_id }, 201);
});

route("GET", "/api/admin/projects/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  const p = await db.prepare("SELECT p.*, c.company FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.id = ?").bind(params.id).first();
  if (!p) fail(404, "Project not found.");
  return json({ project: await projectWithDetails(db, p) });
});

route("PATCH", "/api/admin/projects/:id", async ({ request, db, user, params }) => {
  requireAdmin(user);
  const f = projectFields(await readBody(request), true);
  f.updated_at = new Date().toISOString().replace("T", " ").slice(0, 19);
  const q = updateSql("projects", f, params.id);
  const r = await db.prepare(q.sql).bind(...q.args).run();
  if (!r.meta.changes) fail(404, "Project not found.");
  return json({ ok: true });
});

route("DELETE", "/api/admin/projects/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  await db.batch([
    db.prepare("DELETE FROM tasks WHERE project_id = ?").bind(params.id),
    db.prepare("DELETE FROM milestones WHERE project_id = ?").bind(params.id),
    db.prepare("DELETE FROM updates WHERE project_id = ?").bind(params.id),
    db.prepare("DELETE FROM projects WHERE id = ?").bind(params.id)
  ]);
  return json({ ok: true });
});

const touchProject = (db, projectId) =>
  db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").bind(projectId);

route("POST", "/api/admin/projects/:id/tasks", async ({ request, db, user, params }) => {
  requireAdmin(user);
  if (!(await db.prepare("SELECT id FROM projects WHERE id = ?").bind(params.id).first())) fail(404, "Project not found.");
  const b = await readBody(request);
  const title = v.str(b.title, "Task", { required: true, max: 200 });
  const max = await db.prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM tasks WHERE project_id = ?").bind(params.id).first();
  const r = await db.prepare("INSERT INTO tasks (project_id, title, status, assignee, due_date, sort) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(params.id, title, v.oneOf(b.status, TASK_STATUS, "Status", "todo"), v.str(b.assignee, "Assignee", { max: 80 }), v.date(b.due_date, "Due date"), max.m + 1).run();
  await touchProject(db, params.id).run();
  return json({ id: r.meta.last_row_id }, 201);
});

route("PATCH", "/api/admin/tasks/:id", async ({ request, db, user, params }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const f = {};
  if ("title" in b) f.title = v.str(b.title, "Task", { required: true, max: 200 });
  if ("status" in b) f.status = v.oneOf(b.status, TASK_STATUS, "Status", "todo");
  if ("assignee" in b) f.assignee = v.str(b.assignee, "Assignee", { max: 80 });
  if ("due_date" in b) f.due_date = v.date(b.due_date, "Due date");
  f.updated_at = new Date().toISOString().replace("T", " ").slice(0, 19);
  const task = await db.prepare("SELECT project_id FROM tasks WHERE id = ?").bind(params.id).first();
  if (!task) fail(404, "Task not found.");
  const q = updateSql("tasks", f, params.id);
  await db.batch([db.prepare(q.sql).bind(...q.args), touchProject(db, task.project_id)]);
  return json({ ok: true });
});

route("DELETE", "/api/admin/tasks/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  await db.prepare("DELETE FROM tasks WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
});

route("POST", "/api/admin/projects/:id/milestones", async ({ request, db, user, params }) => {
  requireAdmin(user);
  if (!(await db.prepare("SELECT id FROM projects WHERE id = ?").bind(params.id).first())) fail(404, "Project not found.");
  const b = await readBody(request);
  const r = await db.prepare("INSERT INTO milestones (project_id, title, due_date, done) VALUES (?, ?, ?, ?)")
    .bind(params.id, v.str(b.title, "Milestone", { required: true, max: 200 }), v.date(b.due_date, "Date"), b.done ? 1 : 0).run();
  await touchProject(db, params.id).run();
  return json({ id: r.meta.last_row_id }, 201);
});

route("PATCH", "/api/admin/milestones/:id", async ({ request, db, user, params }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const f = {};
  if ("title" in b) f.title = v.str(b.title, "Milestone", { required: true, max: 200 });
  if ("due_date" in b) f.due_date = v.date(b.due_date, "Date");
  if ("done" in b) f.done = b.done ? 1 : 0;
  const q = updateSql("milestones", f, params.id);
  const r = await db.prepare(q.sql).bind(...q.args).run();
  if (!r.meta.changes) fail(404, "Milestone not found.");
  return json({ ok: true });
});

route("DELETE", "/api/admin/milestones/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  await db.prepare("DELETE FROM milestones WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
});

/* ---------------- Admin: updates & announcements ------------------------- */
route("GET", "/api/admin/updates", async ({ db, user }) => {
  requireAdmin(user);
  const r = await db.prepare(`SELECT u.*, c.company, p.name AS project_name FROM updates u
      LEFT JOIN clients c ON c.id = u.client_id LEFT JOIN projects p ON p.id = u.project_id
      ORDER BY u.created_at DESC, u.id DESC LIMIT 100`).all();
  return json({ updates: r.results || [] });
});

route("POST", "/api/admin/updates", async ({ request, db, user }) => {
  requireAdmin(user);
  const b = await readBody(request);
  let clientId = b.client_id ? v.int(b.client_id, "Client", { min: 1 }) : null;
  const projectId = b.project_id ? v.int(b.project_id, "Project", { min: 1 }) : null;
  if (projectId) {
    const p = await db.prepare("SELECT client_id FROM projects WHERE id = ?").bind(projectId).first();
    if (!p) fail(400, "Pick a project that exists.");
    if (clientId && clientId !== p.client_id) fail(400, "That project belongs to a different client.");
    clientId = p.client_id;
  } else if (clientId && !(await db.prepare("SELECT id FROM clients WHERE id = ?").bind(clientId).first())) {
    fail(400, "Pick a client that exists.");
  }
  const r = await db.prepare("INSERT INTO updates (client_id, project_id, kind, title, body, author) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(clientId, projectId, clientId ? "update" : "announcement",
      v.str(b.title, "Title", { required: true, max: 160 }), v.str(b.body, "Message", { max: 5000 }), user.name).run();
  return json({ id: r.meta.last_row_id }, 201);
});

route("DELETE", "/api/admin/updates/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  await db.prepare("DELETE FROM updates WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
});

/* ---------------- Admin: invoices ---------------------------------------- */
const invoiceFields = (b, partial) => {
  const out = {};
  if (!partial || "number" in b) out.number = v.str(b.number, "Invoice number", { required: true, max: 40 });
  if (!partial || "title" in b) out.title = v.str(b.title, "Description", { required: true, max: 200 });
  if (!partial || "amount" in b) {
    const n = Number(b.amount);
    if (!Number.isFinite(n) || n < 0 || n > 1e9) fail(400, "Amount must be a number.");
    out.amount_cents = Math.round(n * 100);
  }
  if (!partial || "currency" in b) out.currency = v.oneOf(b.currency, ["USD", "PKR", "GBP", "EUR", "AED"], "Currency", "USD");
  if (!partial || "issue_date" in b) out.issue_date = v.date(b.issue_date, "Issue date") || (partial ? null : today());
  if (!partial || "due_date" in b) out.due_date = v.date(b.due_date, "Due date");
  if (!partial || "status" in b) out.status = v.oneOf(b.status, INVOICE_STATUS, "Status", "draft");
  if (!partial || "paid_date" in b) out.paid_date = v.date(b.paid_date, "Paid date");
  if (!partial || "payment_method" in b) out.payment_method = v.str(b.payment_method, "Payment method", { max: 60 });
  if (!partial || "notes" in b) out.notes = v.str(b.notes, "Notes", { max: 2000 });
  if (out.status === "paid" && !out.paid_date && !partial) out.paid_date = today();
  return out;
};

route("GET", "/api/admin/invoices", async ({ db, user }) => {
  requireAdmin(user);
  const r = await db.prepare("SELECT i.*, c.company FROM invoices i JOIN clients c ON c.id = i.client_id ORDER BY i.issue_date DESC, i.id DESC").all();
  return json({ invoices: (r.results || []).map(invoiceView) });
});

route("POST", "/api/admin/invoices", async ({ request, db, user }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const clientId = v.int(b.client_id, "Client", { min: 1 });
  if (!(await db.prepare("SELECT id FROM clients WHERE id = ?").bind(clientId).first())) fail(400, "Pick a client that exists.");
  const f = invoiceFields(b, false);
  const r = await db.prepare(`INSERT INTO invoices (client_id, number, title, amount_cents, currency, issue_date, due_date, status, paid_date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(clientId, f.number, f.title, f.amount_cents, f.currency, f.issue_date, f.due_date, f.status, f.paid_date, f.payment_method, f.notes).run();
  return json({ id: r.meta.last_row_id }, 201);
});

route("PATCH", "/api/admin/invoices/:id", async ({ request, db, user, params }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const f = invoiceFields(b, true);
  if (f.status === "paid" && !("paid_date" in b)) f.paid_date = today();
  if (f.status && f.status !== "paid" && !("paid_date" in b)) f.paid_date = null;
  const q = updateSql("invoices", f, params.id);
  const r = await db.prepare(q.sql).bind(...q.args).run();
  if (!r.meta.changes) fail(404, "Invoice not found.");
  return json({ ok: true });
});

route("DELETE", "/api/admin/invoices/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  await db.prepare("DELETE FROM invoices WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
});

/* ---------------- Admin: team (other admin accounts) --------------------- */
route("GET", "/api/admin/team", async ({ db, user }) => {
  requireAdmin(user);
  const r = await db.prepare("SELECT id, name, email, last_login, created_at FROM users WHERE role = 'admin' ORDER BY id").all();
  return json({ team: r.results || [], you: user.id });
});

route("POST", "/api/admin/team", async ({ request, db, user }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const email = v.email(b.email);
  if (await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first()) fail(409, "That email already has a login.");
  const pass = tempPassword();
  await db.prepare("INSERT INTO users (email, name, password_hash, role, must_change_password) VALUES (?, ?, ?, 'admin', 1)")
    .bind(email, v.str(b.name, "Name", { required: true, max: 100 }), await hashPassword(pass)).run();
  return json({ email, tempPassword: pass }, 201);
});

route("DELETE", "/api/admin/team/:id", async ({ db, user, params }) => {
  requireAdmin(user);
  if (params.id === user.id) fail(400, "You can't remove your own account.");
  const r = await db.prepare("DELETE FROM users WHERE id = ? AND role = 'admin'").bind(params.id).run();
  if (!r.meta.changes) fail(404, "Team member not found.");
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(params.id).run();
  return json({ ok: true });
});
