# WeDo Ecom Client Portal

A private area where each client signs in to see their own projects, updates and invoices, and where the WeDo Ecom team manages everything.

- **Clients:** `/portal/login.html` → their dashboard at `/portal/`
- **Team (admin):** same login page → admin dashboard at `/portal/admin.html`
- **Installs as an app:** on a phone, open the portal and choose "Add to Home Screen".

## What's in Phase 1

| Clients see | The team can |
| --- | --- |
| Overview: active projects, tasks done, next milestone, amount due | Add, edit and delete clients |
| Projects: progress bar, tasks (to do / in progress / done), milestones | Create a portal login for a client (temporary password, shown once) |
| Updates: project news and team announcements | Reset a client's password |
| Billing: invoices, amount due, paid so far, next payment date | Create projects, tasks (with who's doing them) and milestones |
| Store: placeholder until Shopify is connected (Phase 2) | Post updates to one client or announcements to everyone |
| | Create invoices (draft / due / paid), mark them paid |
| | Add other team members as admins |

Progress is worked out from the tasks automatically (done ÷ total). Drafts and private notes are never shown to clients.

## How it runs (free)

- **Hosting:** Cloudflare Pages (serves the website and portal).
- **Backend:** `functions/api/[[path]].js`, a Cloudflare Pages Function that handles every `/api/...` request.
- **Database:** Cloudflare D1 (SQLite). Tables are created automatically on the first request.
- **Free plan limits** are far above what an agency portal uses. If a daily limit is ever reached, the portal pauses until midnight UTC instead of charging you.

## One-time setup in Cloudflare

1. **Create the database:** Cloudflare dashboard → **Storage & Databases → D1** → **Create** → name it `wedo-portal`.
2. **Create the site:** **Workers & Pages → Create → Pages → Connect to Git** → pick the `wedo-ecom` repo.
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/`
3. **Connect the database:** your Pages project → **Settings → Bindings → Add → D1 database**. Variable name: `DB`, database: `wedo-portal`.
4. **Add the setup key:** **Settings → Variables and secrets → Add** → type **Secret**, name `SETUP_KEY`, value: a long phrase only you know (at least 12 characters).
5. **Redeploy:** **Deployments** → latest deployment → **Retry deployment** (settings apply on the next deploy).
6. **Create your admin account:** open `https://<your-project>.pages.dev/portal/login.html`. The first visit shows "Set up your portal". Enter the setup key and your details. This only works once.

## Daily use

1. **New client:** Admin → **Clients → Add client** → open the client → **Create portal login**. Copy the details and send them privately (for example on WhatsApp). The client picks their own password on first sign-in.
2. **New project:** open the client → **New project**, then add tasks and milestones. Change a task's status and the client's progress bar updates.
3. **Invoice:** **Invoices → New invoice**. "Draft" stays private. "Due" shows on the client's billing page. When the money arrives, press **Mark paid**.
4. **Update:** from a project → **Post an update to the client**, or **Updates → New update** → "Everyone" for an announcement.

## Security

- Passwords are hashed with PBKDF2-SHA256 and a unique salt. Nobody, including the team, can read them.
- Sign-in sessions use a secure, HttpOnly cookie; only a hash of the session is stored.
- Each client can only read rows with their own client ID. The API checks this on every request.
- Changes must come from the site itself (cross-site requests are blocked).
- After 8 wrong passwords in 15 minutes, sign-in is paused for that email or connection.
- Temporary passwords must be changed on first sign-in.

## Next phases

- **Phase 2: Shopify.** Each client connects their store through a small Shopify Dev Dashboard app. We'll show sales, orders, revenue and best-sellers, synced automatically.
- **Phase 3: messages, support requests and file sharing.**
