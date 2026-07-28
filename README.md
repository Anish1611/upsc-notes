# Current Affairs and UPSC Notes

A free, public study-material library. The **admin** uploads notes behind a
password; **everyone else** can browse, search, and download every note —
no login required. Notes stay published until the admin deletes them.

## What's inside
- `server.js` — the backend (Node.js + Express)
- `public/index.html` — the public library homepage (browse/search/download) with a collapsible **Admin Panel** (password-protected upload & delete)
- `public/download.html` — the note detail/download page opened from a shared link
- `public/style.css` — shared styling (maroon/navy/gold academic theme, fully responsive)
- `data/files.json` — auto-created; stores note metadata (name, category, size, link)
- `uploads/` — auto-created; stores the actual uploaded files

## What changed from the original template
- Rebranded to **Current Affairs and UPSC Notes**, with a new academic-style visual identity (Merriweather serif headings, maroon/navy/gold palette) instead of the old "drop-off counter" look.
- **Public browsing is now open to everyone** — `GET /api/files` no longer requires a password, so any visitor can see and download every note the admin has uploaded. Only **uploading** and **deleting** still require the admin access code.
- Notes are **never auto-deleted** — nothing in this code removes a file on its own. A note stays live until the admin clicks Delete in the Admin Panel.
- Added optional **category** tags (Current Affairs, Polity, Economy, Geography, History, Environment, Science & Tech…) and a **search + filter bar** on the homepage.
- Fully **responsive** layout: single column on phones, multi-column note grid on tablets/desktops.
- Footer credit: **"Curated by QuidMind(AM)"** on every page.
- Fixed a bug in the original upload route where the password check ran before the file form was parsed (it could never actually see the password).
- Upgraded `multer` to the patched 2.x line (the 1.x line has known vulnerabilities).

## Running it on your own computer (to test first)
```bash
npm install
UPLOAD_PASSWORD=choose-a-strong-password node server.js
```
Then open `http://localhost:3000` in your browser.

- Visitors see the library immediately — no password needed.
- Click **Admin Login** (top right) to reveal the upload/delete panel, then enter your access code.

## Environment variables
| Variable | Purpose | Default |
|---|---|---|
| `UPLOAD_PASSWORD` | Admin access code for uploading/deleting notes | `changeme` — **change this before going live** |
| `MAX_FILE_MB` | Max upload size per file, in MB | `100` |
| `PORT` | Port the server listens on | `3000` (most hosts set this for you) |

---

## Step-by-step: hosting it for free on Render

Render is a good default because it runs a real Node.js server (this app
needs one — it's not a static site) and has a free tier.

### 1. Put the code on GitHub
1. Go to [github.com/new](https://github.com/new) and create a new repository, e.g. `upsc-notes`.
2. Upload this whole folder to that repo. Easiest way if you're not familiar with git:
   - On the repo page, click **Add file → Upload files**.
   - Drag in every file/folder from this project (`server.js`, `package.json`, `public/`, `data/`, `uploads/`, `README.md`, `.gitignore`).
   - Scroll down, click **Commit changes**.

### 2. Create the web service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and sign up/log in (you can sign in with GitHub).
2. Click **New +** → **Web Service**.
3. Choose **Build and deploy from a Git repository**, then connect your GitHub account and select the `upsc-notes` repo.
4. Fill in the settings:
   - **Name**: anything, e.g. `upsc-notes` (this becomes part of your URL).
   - **Region**: pick the one closest to your users.
   - **Branch**: `main`.
   - **Runtime**: Node.
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**.
5. Scroll to **Environment Variables** and click **Add Environment Variable**:
   - Key: `UPLOAD_PASSWORD` → Value: a strong password only you know.
   - (optional) Key: `MAX_FILE_MB` → Value: e.g. `200`.
6. Click **Create Web Service**. Render will install dependencies and start the app — this takes 1–3 minutes.
7. Once the status shows **Live**, your site is at `https://upsc-notes.onrender.com` (or whatever name you chose). Open it to confirm the library loads.

### 3. ⚠️ Important: make uploads survive restarts
Render's **free** web services use temporary disk storage. Every time the
service restarts, sleeps, or redeploys, the `uploads/` folder (and
`data/files.json`) is wiped — only the code in GitHub survives. On the free
tier the service also auto-sleeps after 15 minutes of no traffic and wipes
storage on wake.

To make notes **permanent**, do one of the following:
- **Render persistent disk** (a few dollars/month): in your service → **Disks** → **Add Disk**, mount it at `/opt/render/project/src/uploads` and a second one (or a subpath) for `/opt/render/project/src/data`. Files then survive restarts.
- **Upgrade to a paid Render instance type**, which does not sleep, combined with a persistent disk as above.
- **Move file storage to cloud storage** (e.g. Cloudflare R2, AWS S3, Backblaze B2 — all have free tiers): the app would upload to that bucket instead of the local `uploads/` folder. This is the most robust long-term option and works on any host, including fully free ones. This requires a moderate change to `server.js` — ask if you'd like this wired in.

If you just want a quick way to permanently host a batch of notes without
worrying about server storage at all, a paid Render instance + persistent
disk (roughly $7/month for the smallest instance) is the simplest reliable
option.

### 4. Using the site day-to-day (as admin)
1. Open your site, click **Admin Login** (top right).
2. Enter your access code.
3. Drag a file into the upload box, pick a **Category**, optionally add a short description, and click **Publish to library**.
4. The note now appears instantly for every visitor on the homepage — no code or link needed.
5. To remove a note, scroll to **Manage uploaded notes** in the Admin Panel and click **Delete**. It disappears for everyone immediately, and stays gone until you upload it again.

### Alternative free hosts
The same steps apply on any Node-friendly host — the key requirements are
"Node web service," a `npm install` build step, and `npm start` as the run
command:
- **Railway** ([railway.app](https://railway.app)) — similar free-tier flow to Render.
- **Fly.io** ([fly.io](https://fly.io)) — free allowance, supports persistent volumes for uploads.
- **Replit** ([replit.com](https://replit.com)) — good for quick testing, less suited to production traffic.
