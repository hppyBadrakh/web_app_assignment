# Feature Rollout Design — TestHub Web App

**Date:** 2026-05-21  
**Status:** Approved  
**Approach:** Foundation-first (Approach B) — session migration → auth context → UI → tests

---

## Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 (HashRouter), plain CSS |
| Backend | Express.js (ESM, `"type":"module"`), better-sqlite3 (SQLite) |
| Auth (current) | Custom Bearer tokens in `Authorization` header, stored in SQLite `sessions` table |
| Auth (target) | `express-session` + `better-sqlite3-session-store`, httpOnly cookies |
| Build | Vite (replaces Webpack requirement — already satisfies all production build criteria) |
| Tests | Jest with `--experimental-vm-modules` (ESM support), supertest |

---

## Section 1 — Password Hashing (Task 1)

**Decision: No changes needed.**

The existing `helpers/password.js` already satisfies all requirements:
- `bcrypt` with cost factor **12** (≥ 10 threshold met)
- bcrypt generates and embeds a cryptographic random salt per-hash internally
- A pepper (`PASSWORD_SECRET_KEY` from `.env`) is mixed into the password before hashing, adding a second security layer
- `verifyPassword` uses `bcrypt.compare` which is constant-time

No separate `salt` column is required — bcrypt embeds the salt in the hash string (`$2b$12$<22-char-salt><31-char-hash>`).

**Files touched:** None.

---

## Section 2 — Session Persistence (Task 2)

### Goal
Replace custom `Authorization: Bearer <token>` flow with `express-session` + httpOnly cookies.

### Backend changes

**New packages:** `express-session`, `better-sqlite3-session-store`

**`server/src/app.js`:**
- Add `session()` middleware before routes
- Config:
  ```js
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new BetterSqlite3Store({ client: db }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
  ```
- CORS: `origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'`, `credentials: true`

**`server/src/routes/auth.js`:**
- Login: set `req.session.userId = user.id` (drop token generation)
- Logout: call `req.session.destroy()` (remove Bearer token logic)
- `/me`: read `req.session.userId`, query user from DB, return user object

**`server/src/middleware/authenticate.js`:**
- Read `req.session.userId` instead of `req.headers.authorization`
- Return `401` with `{ error: 'Unauthorized' }` if missing

**DB:** The existing `sessions` table remains but is unused by express-session. The `better-sqlite3-session-store` creates its own `sessions` table — there will be a name conflict. Resolution: rename existing table to `auth_sessions` in a migration (try/catch ALTER TABLE), or drop and recreate. The store's table will be `sessions`.

**New `.env` variable:** `SESSION_SECRET` — document in `.env.example`.

### Frontend changes

**`web/src/context/AuthContext.jsx`:**
- Remove `localStorage` token storage entirely
- Remove `token` state
- `authFetch`: remove `Authorization` header injection; add `credentials: 'include'` to all fetches
- `login(user)`: just `setUser(user)` — no token to store
- `logout()`: POST to `/api/auth/logout` with `credentials: 'include'`, then `setUser(null)`
- On mount: fetch `/api/auth/me` with `credentials: 'include'` to restore session

**All other `fetch` calls** across pages: add `credentials: 'include'`.

---

## Section 3 — Dynamic Navbar + Profile Page (Tasks 3–4)

### Navbar (Task 3)

**Already reactive** via `useAuth()`. Two additions:
- Replace `👤` emoji with `<img src={user.avatarUrl || '/default-avatar.svg'} alt="Profile avatar" />` in the logged-in dropdown trigger
- Add `updateUser(fields)` to AuthContext that does `setUser(prev => ({ ...prev, ...fields }))`
- After avatar upload, call `updateUser({ avatarUrl })` — navbar updates in same tick

### Profile Page (Task 4)

**`web/src/pages/Profile.jsx`:**
- Replace hardcoded `INITIAL` state with real data from `useAuth()`
- Avatar section: clickable `<img>` / overlay triggers a hidden `<input type="file" accept="image/jpeg,image/png">`
- On file select: POST `multipart/form-data` to `/api/profile/avatar` with `credentials: 'include'`
- On success: call `updateUser({ avatarUrl: data.avatarUrl })`

**New server route `server/src/routes/profile.js`:**
- `POST /api/profile/avatar` — protected by `authenticate`
- Uses `multer`: `fileFilter` allows only `image/jpeg` / `image/png`, `limits: { fileSize: 5 * 1024 * 1024 }`
- Saves to `server/uploads/<uuid>.<ext>`
- Runs `UPDATE users SET avatar_url = ? WHERE id = ?`
- Returns `{ avatarUrl: '/uploads/<filename>' }`

**DB migration** (in `database.js`, try/catch):
```js
try { db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT') } catch (_) {}
```

**`server/src/app.js`:**
```js
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
```

**New package:** `multer`

---

## Section 4 — Responsive Design (Task 5)

**`web/src/index.css`** — add breakpoints at bottom:

```css
/* Tablet */
@media (max-width: 768px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile */
@media (max-width: 480px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .nav-menu { display: none; flex-direction: column; ... }
  .nav-menu.mobile-open { display: flex; }
  .menu-toggle { display: flex; }
}

/* Desktop */
@media (min-width: 769px) {
  .menu-toggle { display: none; }
}

img { max-width: 100%; height: auto; }
body { overflow-x: hidden; }
```

**Hamburger keyboard accessibility** (`Navbar.jsx`):
```jsx
onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMenuOpen(o => !o) } }}
```
Add `aria-expanded={menuOpen}` to the toggle button.

---

## Section 5 — Accessibility (Task 6)

Changes across the app:

- **Images:** All `<img>` tags get `alt`. Decorative: `alt=""`. Avatars: `alt="Profile avatar"`.
- **Inputs:** Audit all forms — add `<label htmlFor>` or `aria-label` where missing. Affected: Login, Signup, ChangePassword, admin forms.
- **Dropdown menus:** Add `role="menu"` on `<ul class="drop-menu">`, `role="menuitem"` on items. Escape key closes dropdown.
- **Live region:** Add `<div role="status" aria-live="polite" className="sr-only" id="live-region">` in AppShell. Error/success messages are injected here.
- **Color contrast fix:** `--green: #5eb562` → `#3d8c41` (ratio ~4.6:1 on white, passes AA). Update the CSS variable; all usages update automatically.
- **Focus styles:** Ensure no `outline: none` without a replacement. Add `:focus-visible` styles where missing.

---

## Section 6 — SEO (Task 7)

**New package:** `react-helmet-async`

**`web/src/main.jsx`:** Wrap app in `<HelmetProvider>`.

**Per-page `<Helmet>` blocks** (one per page component):
```jsx
<Helmet>
  <title>TestHub — Нүүр хуудас</title>
  <meta name="description" content="..." />
  <meta property="og:title" content="TestHub" />
  <meta property="og:description" content="..." />
  <meta property="og:image" content="/pictures/IMG_0894.svg" />
</Helmet>
```

Pages to update: Home, Tests, Competitions, Help, Login, Signup, Profile, TakeTest, TestHistory.

**`web/public/robots.txt`:**
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://yourdomain.com/sitemap.xml
```

**`web/public/sitemap.xml`:** All public hash routes with `<loc>`, `<lastmod>2026-05-21</lastmod>`, `<changefreq>monthly</changefreq>`.

**Image performance:**
- Add `loading="lazy"` to all below-fold images
- Server: `express.static('uploads', { maxAge: '1y' })` for uploaded avatars

---

## Section 7 — Tests (Task 9)

**Location:** `server/tests/`

**Setup:**
- Install: `jest`, `supertest` as devDependencies in `server/`
- `package.json` test script: `"test": "NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=tests/"`
- `jest.config.js`: `{ transform: {}, testEnvironment: 'node' }`
- `database.js` updated to use `process.env.TEST_DB || 'testhub.db'` so tests run on `:memory:`

**Test files:**

| File | Covers |
|---|---|
| `tests/password.test.js` | hashPassword / verifyPassword — success + wrong input |
| `tests/avatar.test.js` | POST /api/profile/avatar — valid image, oversized, non-image |
| `tests/register.test.js` | POST /api/auth/signup — success, duplicate email, missing fields |
| `tests/logout.test.js` | POST /api/auth/logout — valid session, already logged out |
| `tests/login.test.js` | POST /api/auth/login — correct creds, wrong password, unknown user |

Each test file creates a fresh in-memory DB and a supertest app instance. Session cookies are passed through supertest's `.set('Cookie', ...)` pattern.

---

## New Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `SESSION_SECRET` | express-session signing secret | Yes |
| `CLIENT_ORIGIN` | CORS allowed origin | Dev default: `http://localhost:5173` |
| `TEST_DB` | SQLite path for tests (`:memory:`) | Test only |

---

## Implementation Order

1. **Backend session migration** — `app.js`, `auth.js`, `authenticate.js`, `database.js`
2. **Profile route + multer** — new `routes/profile.js`, DB migration, static file serving
3. **Frontend AuthContext** — remove token/localStorage, add `credentials: 'include'`, add `updateUser`
4. **Profile page** — wire to real user data, avatar upload UI
5. **Navbar** — avatar image, keyboard accessibility
6. **CSS** — responsive breakpoints, contrast fix, focus styles
7. **Accessibility** — alt tags, aria-labels, live region, dropdown keyboard nav
8. **SEO** — react-helmet-async, robots.txt, sitemap.xml
9. **Tests** — Jest setup, 5 test suites
