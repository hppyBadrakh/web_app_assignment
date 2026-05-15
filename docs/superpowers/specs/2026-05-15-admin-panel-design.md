# Admin Panel Design

**Date:** 2026-05-15
**Project:** TestHub (`web_app_assignment`)

---

## Overview

Add a fully functional admin panel to the existing TestHub platform. The admin panel lives at `/admin/*` routes within the current React app and is backed by new Express endpoints mounted at `/api/admin`. Admins authenticate via a dedicated login page that requires username, password, **and** a secret admin code stored in `.env`.

---

## Backend

### New Environment Variable

```
ADMIN_SECRET_CODE=<chosen-passphrase>
```

Added to `server/.env`. The server validates this on every admin login attempt.

### New Route File

`server/src/routes/admin.js` — mounted at `/api/admin` in `server/src/app.js`.

### New Middleware

`requireAdmin` — defined in `server/src/middleware/authenticate.js` alongside the existing `authenticate`:

1. Calls `authenticate` (verifies Bearer token, attaches `req.user`)
2. Checks `req.user.role === 'admin'`
3. Returns `403` if not admin, otherwise calls `next()`

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/admin/login` | None | Login with `{ username, password, adminCode }`. Validates credentials + role=admin + adminCode. Returns session token. |
| `GET` | `/api/admin/stats` | requireAdmin | Returns `{ userCount, examCount, competitionCount, recentLoginAttempts[] }`. |
| `GET` | `/api/admin/users` | requireAdmin | Returns all users: `id, username, email, role, created_at`. |
| `PUT` | `/api/admin/users/:id/role` | requireAdmin | Body: `{ role: 'admin' | 'user' }`. Updates user role. |
| `DELETE` | `/api/admin/users/:id` | requireAdmin | Deletes user. Blocked if `id === req.user.id` (can't self-delete). |

### Reused Endpoints (no changes needed)

Admin CRUD on exams and competitions uses the **existing** `/api/exams` and `/api/competitions` routes. The existing `canModify` middleware already grants admins full access, so no duplication is needed.

### Error Responses

| Scenario | Status | Message |
|----------|--------|---------|
| Wrong password | `401` | `"Invalid credentials"` |
| Wrong admin code | `403` | `"Invalid admin code"` |
| Account is not admin | `403` | `"Not an admin account"` |
| Expired/invalid token | `401` | `"Session expired or invalid token"` |
| Non-admin accessing admin route | `403` | `"Admin access required"` |
| Admin attempting self-delete | `400` | `"Cannot delete your own account"` |

---

## Frontend

### New Files

```
web/src/
├── context/
│   └── AdminAuthContext.jsx       # Mirrors AuthContext, uses adminToken in localStorage
├── components/layout/
│   └── AdminLayout.jsx            # Sidebar nav + logout, wraps all admin pages
└── pages/admin/
    ├── AdminLogin.jsx             # /admin/login — 3-field form
    ├── AdminDashboard.jsx         # /admin — stats cards + recent login attempts
    ├── AdminUsers.jsx             # /admin/users — user table with role toggle + delete
    ├── AdminExams.jsx             # /admin/exams — exam table with edit/delete + create
    └── AdminCompetitions.jsx      # /admin/competitions — competition table with edit/delete + create
```

### New Routes in `App.jsx`

```
/admin/login        → <AdminLogin>              (public, redirects to /admin if already logged in)
/admin              → <AdminProtectedRoute> → <AdminDashboard>
/admin/users        → <AdminProtectedRoute> → <AdminUsers>
/admin/exams        → <AdminProtectedRoute> → <AdminExams>
/admin/competitions → <AdminProtectedRoute> → <AdminCompetitions>
```

`AdminProtectedRoute` redirects to `/admin/login` if `adminToken` is absent or invalid.

### AdminAuthContext

- Stores token in `localStorage` under key `adminToken` (separate from user's `token`)
- Exposes: `adminUser`, `adminLogin(username, password, adminCode)`, `adminLogout()`, `adminFetch(url, options)`
- On mount: validates existing `adminToken` via `GET /api/admin/stats` (reuses the stats endpoint as a health/auth check)
- On `401` from any `adminFetch` call: clears token and redirects to `/admin/login`

### AdminLayout

- Left sidebar with nav links: Dashboard, Users, Exams, Competitions
- Top bar showing logged-in admin username + Logout button
- Wraps the `<Outlet />` for all protected admin pages

### Page Behaviour

**AdminDashboard:** Fetches `/api/admin/stats`. Displays 3 stat cards (Users, Exams, Competitions) and a table of the last 5 login attempts (username, IP, success/fail, timestamp).

**AdminUsers:** Fetches `/api/admin/users`. Table columns: username, email, role (badge), created_at, actions (toggle role / delete). Confirm dialog before delete.

**AdminExams:** Fetches `/api/exams` (existing endpoint). Table with all exam fields. Edit opens an inline form. Delete calls `DELETE /api/exams/:id`. Create button opens a form that calls `POST /api/exams`.

**AdminCompetitions:** Same pattern as AdminExams but for `/api/competitions`.

### Styling

Follows the existing CSS/Tailwind conventions already in the project. No new CSS libraries introduced.

---

## Data Flow

### Admin Login

```
AdminLogin form submits { username, password, adminCode }
  → POST /api/admin/login
  → Server: bcrypt verify password → check role=admin → check adminCode===env.ADMIN_SECRET_CODE
  → 200: { token, user } → AdminAuthContext stores adminToken → redirect /admin
  → 401/403: show error message inline
```

### Authenticated Admin Request

```
adminFetch(url) adds Authorization: Bearer <adminToken>
  → requireAdmin: verifySession → role check → req.user set
  → Route handler responds
  → On 401: AdminAuthContext.adminLogout() → redirect /admin/login
```

---

## What Is NOT In Scope

- Admin activity audit log (beyond existing `login_attempts` table)
- Admin-specific password policy
- Multi-admin invite flow
- Pagination on admin tables (acceptable at current data scale)
