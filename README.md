# DropSeal

A drop-folder submission tool for a classroom: a teacher creates a folder,
sets a password and a deadline, and shares one link with the class.
Students enter the password and upload their files before the deadline —
the folder seals itself the moment time's up, enforced on the server, not
just in the browser.

Built with **React + Vite** (frontend) and **PocketBase** (backend + file
storage), designed to deploy as a single service so you don't need to wire
up two separate hosts.

> The name is just a placeholder — change `APP_NAME` in
> `frontend/src/lib/config.js` to whatever you like (e.g. "UpDrop") and
> rebuild. Nothing else references the name.

---

## How it works

- **Teacher** signs up/in, creates a folder (name + password + deadline),
  and gets a shareable student link.
- **Student** opens the link, sees the folder name and a live countdown,
  enters the password, then uploads files with their name attached.
- The password is **never sent to the browser** for students to read —
  entering it correctly trades it server-side for a short-lived signed
  token, and that token (not the password) is what's required to actually
  create the submission. The deadline is re-checked server-side on every
  password check and every upload, so the browser's countdown is just a
  display — it can't be tricked into accepting a late upload.

---

## Project layout

```
updrop/
├── backend/
│   ├── pb_hooks/main.pb.js       # custom API routes + submission gate
│   └── pb_migrations/            # database schema (auto-runs on first boot)
├── frontend/
│   └── src/                      # React app
└── build.sh                      # builds frontend into backend/pb_public
```

---

## Local development

### 1. Get PocketBase

Download the PocketBase binary for your OS from
https://github.com/pocketbase/pocketbase/releases (this project was built
and tested against **v0.39.6**) and put the `pocketbase` executable inside
the `backend/` folder.

### 2. Run the backend

```bash
cd backend
export SUBMIT_TOKEN_SECRET="anything-long-and-random-for-local-dev"
./pocketbase serve
```

The first time it runs, it will apply the migration in `pb_migrations/`
automatically and create the `teachers`, `folders`, and `submissions`
collections. Open `http://127.0.0.1:8090/_/` to create a PocketBase
**superuser** account (this is separate from teacher accounts — it's for
you to inspect the database, not for day-to-day use).

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The dev server proxies `/api` requests to
PocketBase on port 8090 (see `vite.config.js`), so there's nothing else to
configure.

---

## Deploying (frontend + backend together, one host)

The repo includes a `Dockerfile` at the root that does everything for
you: it builds the React app, downloads the correct Linux PocketBase
binary, and puts the build output into `pb_public` so one container
serves both the app and the API from one origin — no CORS, no separate
hosts, no manual build step before deploying.

You do **not** need to run `build.sh` or commit a `pocketbase` binary for
this path — Docker handles both during the build. (`build.sh` is still
handy for quick local testing of the combined setup; see below.)

### Hosting it (Railway)

PocketBase needs a host that keeps a process running and gives it a
persistent disk (for its SQLite database and uploaded files) — this rules
out pure static hosts like Netlify/Vercel, since PocketBase isn't a
serverless function. **Railway** and **Fly.io** are both good fits.
Steps for Railway:

1. Push this repo to GitHub, with the `Dockerfile` and `.dockerignore`
   at the repo root (not inside `backend/`).
2. In Railway, "New Project" → "Deploy from GitHub repo".
3. Leave the **root directory** as the repo root (blank) — Railway will
   detect the `Dockerfile` automatically and switch to the Docker
   builder. Do **not** set it to `backend`, and don't set a custom start
   command — the Dockerfile's `CMD` handles that.
4. Add a **volume** mounted at `/pb/pb_data` so your database and
   uploaded files survive redeploys.
5. In the **Variables** tab, set `SUBMIT_TOKEN_SECRET` to a long random
   string (e.g. generate one with `openssl rand -hex 32`).
6. Deploy. Railway gives you a `*.up.railway.app` URL — that's your whole
   app, frontend and API together.

The same idea works on Fly.io or any VPS that can run a Dockerfile: just
make sure whatever persistent volume you attach is mounted at `/pb/pb_data`.

### Testing the combined build locally (optional)

```bash
./build.sh
cd backend
./pocketbase serve
```

This does locally what the Dockerfile does on Railway — builds the
frontend and serves it alongside the API from one process — so you can
sanity-check it before pushing. You'll need the PocketBase binary for
your OS in `backend/` for this (see "Local development" above); it's
gitignored and only used for this local check, not for deployment.

### Environment variables

| Variable              | Required | Purpose                                                              |
| ---------------------- | -------- | ---------------------------------------------------------------------- |
| `SUBMIT_TOKEN_SECRET`  | Yes (production) | Signs the short-lived tokens issued after a correct password. Without it, a weak default is used — fine for local dev, **not** for a real deploy. |

---

## Managing teachers

Anyone can create a teacher account from the app's sign-up form — that's
what makes it usable by multiple teachers at your school without you
setting up each account by hand. If you'd rather lock that down to just
yourself, open `backend/pb_hooks/main.pb.js`... actually simpler: in the
PocketBase admin UI (`/_/`), go to **Collections → teachers → API Rules**
and change the "Create" rule from empty (public) to something like
`@request.auth.id != ""` combined with manually creating accounts as a
superuser, or just leave it open if it's just you and colleagues sharing
the tool.

---

## Notes and known limits

- A student can submit to the same folder more than once (each upload is
  its own record) — there's no "one submission per student" lock. If you
  want that, it's a small addition: check for an existing `submissions`
  record with the same `folder` + `student_name` before creating a new
  one.
- File size limit is 50MB per file, up to 10 files per submission —
  adjust `maxSize` / `maxSelect` on the `submissions.files` field in
  `pb_migrations/1720000000_schema.js` (and re-run against a fresh
  database, or edit the collection in the `/_/` admin UI on an existing
  one).
- Folder links use a `#/s/:id` hash route on purpose, so the app never
  needs any server-side routing configuration beyond "serve pb_public" —
  one less thing that can break on deploy.

---

## What was tested before this was handed to you

This was built and verified against a real running PocketBase v0.39.6
instance (not just written from memory): teacher registration and login,
folder creation with deadline validation, the public folder-info and
password-verification endpoints, submission uploads gated by the signed
token (including rejecting missing tokens, garbage tokens, and a token
from one folder reused on another), deadline expiry enforcement in real
time, and the full flow served the way it will be in production — one
PocketBase process serving both the built frontend and the API. The
`npm run build` also completes with zero errors.
