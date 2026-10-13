# Flexora System Builder — Module 1: Authentication & RBAC

**Flexora System Builder** is a modular, multi-tenant business platform where business owners create and manage custom business systems by selecting modules and building their website presence.

This repository implements **Step 1: Authentication and Role-Based Access Control (RBAC)**, establishing a hardened production foundation for multi-tenancy and user management.

---

## 1. Architecture Overview

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS / Vanilla CSS design tokens, Lucide React, React Hot Toast, Axios.
- **Backend:** Node.js, Express, TypeScript, Mongoose, MongoDB, bcryptjs, jsonwebtoken, Zod, Helmet, Cookie-Parser, Express-Rate-Limit.
- **Testing:** Vitest, Supertest.

### Key Security & Architectural Highlights
- **Zero Plaintext Credentials:** Passwords hashed with bcrypt (salt rounds: 12).
- **Silent Refresh & HttpOnly Cookies:** Short-lived access tokens (15m) kept strictly in memory. Long-lived refresh tokens (7d) stored in secure, `HttpOnly` cookies (`SameSite: Lax` / `Strict`).
- **Token Rotation & Reuse Detection:** Every refresh call invalidates the existing refresh session and issues a new pair. If an already-revoked session is presented, the system treats it as an attempted breach and revokes all active sessions for that user.
- **Multi-Tenant Foundation:** Pre-configured `BusinessMembership` model isolating user access by `tenantId`.
- **Last Active Admin Protection:** Server-enforced prevention against demoting or deactivating the last active Platform Admin.
- **Role Isolation:** Public registration is restricted to `BUSINESS_OWNER`. Platform Admin, Manager, and Staff roles cannot be self-assigned.

---

## 2. User Roles & Capabilities

| Role | Access | Dashboard Route | Capabilities |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | Platform-wide | `/admin/dashboard` | View metrics, manage accounts, activate/suspend users, reassign roles, view roadmap placeholders. |
| **Business Owner** | Tenant Owner | `/business/dashboard` | Manage business profile, workspace placeholder, team invitations (future), website builder (future). |
| **Manager** | Business Staff | `/manager/dashboard` | Oversee assigned business operations and assigned workspaces. Restricted from admin APIs. |
| **Staff** | Business Staff | `/staff/dashboard` | Access assigned workspace tasks. Restricted from administrative and owner operations. |

---

## 3. Getting Started & Installation

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- MongoDB Atlas cluster or a running local MongoDB instance (`mongodb://127.0.0.1:27017/flexora`)

### Step 1: Install Dependencies
From the repository root:
```powershell
npm install
```
*(A project-level `.npmrc` is configured with a high-availability registry mirror and fetch retries to seamlessly work behind corporate firewalls).*

---

### Step 2: Environment Configuration

#### Backend Environment
Copy the example environment file if you haven't already:
```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` and update the database URI:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Replace with your MongoDB connection string (Atlas or Local):
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/flexora

# Cryptographically strong secrets (pre-generated during initial setup):
JWT_SECRET=1625f984453cce6a9de8d86972e042869fceec61e558846fdb4def94651aa8d3
JWT_REFRESH_SECRET=1625f984453cce6a9de8d86972e042869fceec61e558846fdb4def94651aa8d3
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

#### Frontend Environment (Optional)
```powershell
Copy-Item frontend\.env.example frontend\.env
```
Default `VITE_API_URL` is `http://localhost:5000/api/v1`.

---

### Step 3: Seed Development Users
Once your `MONGODB_URI` is connected, seed the initial Platform Admin and demo accounts for all 4 roles:

```powershell
npm run seed
```

#### Available Seed Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Platform Admin** | `admin@flexora.com` | `Admin@123456` |
| **Business Owner** | `owner@flexora.com` | `Owner@123456` |
| **Manager** | `manager@flexora.com` | `Manager@123456` |
| **Staff** | `staff@flexora.com` | `Staff@123456` |

---

### Step 4: Run the Application
Start both the Vite frontend and the Express backend simultaneously:
```powershell
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 4. Running Automated Tests

Run the backend integration test suite with Vitest and Supertest:
```powershell
npm test
```

### Test Coverage Includes:
- Business Owner public registration validation.
- Duplicate email collision rejection (HTTP 409).
- Password complexity enforcement.
- Credential validation and HttpOnly cookie generation on login.
- Account suspension blocking access.
- RBAC enforcement (Business Owners, Managers, and Staff blocked from Admin APIs with 403 Forbidden).
- Platform Admin authorized access.
- Prevention of self-privilege escalation through profile updates.
- Safeguard preventing accidental demotion of the last active Platform Admin.
- Silent refresh token rotation and revocation.
- Reuse detection revoking all active sessions upon compromise.
- Password reset token hashing and expiration verification.

---

## 5. API Reference (`/api/v1`)

### Authentication
- `POST /api/v1/auth/register` — Public registration (Business Owner only).
- `POST /api/v1/auth/login` — Login with email and password.
- `POST /api/v1/auth/refresh` — Rotate refresh token from HttpOnly cookie.
- `POST /api/v1/auth/logout` — Revoke active refresh session.
- `POST /api/v1/auth/logout-all` — Revoke all active sessions for current user.
- `GET /api/v1/auth/me` — Get current authenticated user.
- `POST /api/v1/auth/forgot-password` — Generate secure password reset token.
- `POST /api/v1/auth/reset-password` — Set new password with valid token.

### User Profile
- `GET /api/v1/users/me` — Retrieve current user profile.
- `PATCH /api/v1/users/me` — Update first and last name (strict role protection).
- `PATCH /api/v1/users/me/password` — Change password.

### Platform Administration (Requires `PLATFORM_ADMIN` role)
- `GET /api/v1/admin/dashboard` — Platform statistics and roadmap placeholders.
- `GET /api/v1/admin/users` — Paginated user list with search, role, and status filters.
- `GET /api/v1/admin/users/:id` — User details.
- `PATCH /api/v1/admin/users/:id/status` — Activate, deactivate, or suspend account.
- `PATCH /api/v1/admin/users/:id/role` — Reassign user role (with last-admin protection).

---

## 6. Frontend Routes

| Route | Access | Description |
| :--- | :--- | :--- |
| `/` | Public | Public marketing and landing page. |
| `/login` | Public | Sign in form with password visibility toggle. |
| `/register` | Public | Register a new Business Owner account. |
| `/forgot-password`| Public | Password reset request with development mode preview link. |
| `/reset-password` | Public | Set new password via token. |
| `/dashboard` | Authenticated | Smart router that redirects users to their role-specific dashboard. |
| `/admin/dashboard`| Platform Admin | Admin overview with metrics and roadmap placeholders. |
| `/admin/users` | Platform Admin | User management table with role and status controls. |
| `/business/dashboard` | Business Owner | Business workspace empty state and module placeholders. |
| `/manager/dashboard` | Manager | Operations and assigned workspace empty state. |
| `/staff/dashboard` | Staff | Staff workspace placeholder and profile links. |
| `/profile` | Authenticated | Manage name, password, and active sessions. |
| `/unauthorized` | Authenticated | Access-denied page for role mismatches. |

---

## 7. Troubleshooting

- **MongoDB Connection Error (`querySrv ECONNREFUSED` or `ECONNREFUSED`):**
  Ensure you have replaced `YOUR_CLUSTER.mongodb.net` in [`backend/.env`](file:///c:/Internship%20SLT/FLEXORA-starter/FLEXORA/backend/.env) with your actual MongoDB Atlas cluster connection string or a local MongoDB server (`mongodb://127.0.0.1:27017/flexora`).
- **Firewall / NPM Proxy Issues:**
  The project includes `.npmrc` configured to use `https://registry.npmmirror.com` with `strict-ssl=false` and fetch retries to bypass corporate firewall restrictions.
- **Port Conflict (Port 5000 or 5173 in use):**
  Kill conflicting Node processes:
  ```powershell
  Get-Process -Name node | Stop-Process -Force
  ```
