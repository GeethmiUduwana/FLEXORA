# Flexora System Builder — Multi-Tenant SaaS Platform

**Flexora System Builder** is a modular, multi-tenant SaaS business platform where business owners register their businesses, describe operations, select tailored modules, and build their online web presence.

- **Step 1:** Authentication & Role-Based Access Control (RBAC) ✅
- **Step 2:** Business Registration, Business Profile Management, Business Categories & Types ✅

---

## 1. Architecture Overview

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS / Flexora Design Tokens, Lucide React, React Hot Toast, Axios, React Router.
- **Backend:** Node.js, Express, TypeScript, Mongoose, MongoDB Atlas / Local MongoDB, bcryptjs, jsonwebtoken, Zod, Helmet, Cookie-Parser, Express-Rate-Limit.
- **Testing:** Vitest, Supertest (32 comprehensive unit and integration tests).

### Visual Design System (Flexora Green Theme)
- Primary Green: `#16845B`
- Dark Green: `#0B3D2E`
- Light Green: `#E8F5EE`
- Background: `#F7FAF8`
- Surface: `#FFFFFF`
- Main Text: `#172B24`
- Secondary Text: `#64756D`
- Borders: `#DFE9E2`

---

## 2. Multi-Tenant Security & Isolation (Step 2)

Multi-tenancy and data isolation are strictly enforced:
- **Role Enforcement:** Only users with the `BUSINESS_OWNER` role can create businesses through `/api/v1/businesses`.
- **Server-Side Ownership:** The `ownerId` is populated strictly from the authenticated server session token, completely ignoring any untrusted spoofed `ownerId` in request bodies.
- **Strict Data Isolation:** A Business Owner can only view (`GET /businesses/:id`) and edit (`PATCH /businesses/:id`) businesses that they own. Any attempt to inspect or manipulate another owner's business returns `404 Not Found` (to prevent ID enumeration or leaking business existence) or `403 Forbidden`.
- **Protected Fields:** Sensitive fields such as `ownerId`, `slug`, and `status` are strictly protected from modification through profile patch requests.
- **Category & Type Referential Integrity:** Backend cross-checks verify that the selected category and business type exist and are active, and that the selected business type belongs to the selected category.
- **Custom Business Type Support:** When "Other / Custom Business" is selected or no predefined type matches, owners can register custom types without being forced into arbitrary categories.
- **Membership Sync:** Registering a business synchronizes tenant ownership into `BusinessMembership`, laying the architectural foundation for Step 5 Team Management (Managers and Staff).

---

## 3. Data Models

### BusinessCategory Model (`backend/src/models/BusinessCategory.ts`)
| Field | Type | Details |
| :--- | :--- | :--- |
| `name` | String | Unique category title (e.g. "Professional Services", "Health & Wellness") |
| `slug` | String | Unique URL slug indexed for lookups |
| `description` | String | Optional category summary |
| `icon` | String | Optional icon identifier |
| `status` | Enum | `ACTIVE` or `INACTIVE` |
| `displayOrder` | Number | Sorting order for onboarding display |
| `createdAt`, `updatedAt` | Date | Timestamps |

### BusinessType Model (`backend/src/models/BusinessType.ts`)
| Field | Type | Details |
| :--- | :--- | :--- |
| `name` | String | Subcategory / business type title (e.g. "Consulting", "Dental Clinic") |
| `slug` | String | Subcategory slug |
| `categoryId` | ObjectId | Reference to `BusinessCategory` (indexed) |
| `description` | String | Optional description |
| `status` | Enum | `ACTIVE` or `INACTIVE` |
| `isCustom` | Boolean | True if custom / open-ended |
| `createdAt`, `updatedAt` | Date | Compound index: `{ categoryId: 1, slug: 1 }` |

### Business Model (`backend/src/models/Business.ts`)
| Field | Type | Details |
| :--- | :--- | :--- |
| `name` | String | Business trading name (indexed) |
| `slug` | String | Unique URL identifier with collision suffix loop |
| `ownerId` | ObjectId | Reference to `User` (indexed for multi-tenant isolation) |
| `categoryId` | ObjectId | Reference to `BusinessCategory` |
| `businessTypeId` | ObjectId | Reference to `BusinessType` (optional if custom) |
| `customBusinessType` | String | Custom type text when selecting custom options |
| `description` | String | Business profile summary |
| `email`, `phone`, `address`, `website`, `logo` | String | Optional contact and branding details |
| `employeeCount`, `customerCount` | Number | Operational metrics |
| `mainServices`, `productsSold` | Array<String> | Offerings catalog |
| `onlineBookingRequired`, `onlinePaymentsRequired` | Boolean | Feature flags guiding Step 3 module selection |
| `status` | Enum | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `createdAt`, `updatedAt` | Date | Timestamps |

---

## 4. Business Registration Workflow

The frontend provides an interactive, responsive 3-step registration wizard at `/business/setup` and `/business/setup/review`:

1. **Step 1 — Business Details:**
   - Business Name *(required, min 2 chars)*
   - Business Category *(required, fetched dynamically from MongoDB)*
   - Business Type *(required, filtered dynamically by chosen category)*
   - Custom Business Type *(conditional, required only when Custom / Other is chosen)*
   - Business Description *(required, min 10 chars)*
   - Optional fields: Email, Phone, Address, Website URL, Logo URL.
2. **Step 2 — Business Operations:**
   - Number of Employees *(optional, non-negative)*
   - Approximate Monthly Customers *(optional, non-negative)*
   - Main Services & Products Sold *(optional comma-separated lists)*
   - Online Booking Required? *(Yes / No switch)*
   - Online Payments Required? *(Yes / No switch)*
3. **Step 3 — Review & Confirm (`/business/setup/review`):**
   - Clean summary card showing all entered details and preferences.
   - Jump back to any previous step with "Edit" buttons or direct step navigation.
   - Prevents duplicate submissions with inline loading spinners.
   - Automatic draft saving to `localStorage` prevents data loss on page refresh.
   - On successful submission, clears draft and redirects to `/business/dashboard`.

---

## 5. API Reference (`/api/v1`)

### Business Categories & Types
- `GET /api/v1/business-categories` — List all active categories sorted by display order.
- `GET /api/v1/business-categories/:id/types` — List active business types for a given category.

### Business Management (Requires `BUSINESS_OWNER` role)
- `POST /api/v1/businesses` — Register a business for the authenticated owner.
- `GET /api/v1/businesses/my` — List all businesses owned by the authenticated owner.
- `GET /api/v1/businesses/:id` — Get single business details (strictly verified for owner or platform admin).
- `PATCH /api/v1/businesses/:id` — Update permitted profile fields (ownership verified).

### Authentication & RBAC (Step 1)
- `POST /api/v1/auth/register` — Public registration (Business Owner role).
- `POST /api/v1/auth/login` — Login with credentials, issues JWT & HttpOnly refresh cookie.
- `POST /api/v1/auth/refresh` — Refresh token rotation.
- `POST /api/v1/auth/logout` / `logout-all` — Revoke sessions.
- `GET /api/v1/auth/me` — Authenticated user identity.
- `POST /api/v1/auth/forgot-password` / `reset-password` — Password recovery.

### Platform Administration (Requires `PLATFORM_ADMIN` role)
- `GET /api/v1/admin/dashboard` — Platform metrics.
- `GET /api/v1/admin/users` — Paginated user directory with status and role management.
- `PATCH /api/v1/admin/users/:id/status` / `role` — Account state updates.

---

## 6. Frontend Routes

| Route | Role Access | Description |
| :--- | :--- | :--- |
| `/` | Public | Public landing page and feature highlights. |
| `/login` | Public | Sign in form. |
| `/register` | Public | Register a new Business Owner account. |
| `/dashboard` | Authenticated | Smart router dispatching to role-specific dashboard. |
| `/business/setup` | Business Owner | Multi-step business registration wizard (Steps 1 & 2). |
| `/business/setup/review`| Business Owner | Step 3: Review and confirmation before creation. |
| `/business/dashboard`| Business Owner | Business dashboard displaying profile, completion %, and Step 3 module placeholder. |
| `/business/settings` | Business Owner | Edit and manage business profile details. |
| `/admin/dashboard` | Platform Admin | System administrator metrics. |
| `/admin/users` | Platform Admin | Admin user management table. |
| `/manager/dashboard` | Manager | Manager workspace dashboard. |
| `/staff/dashboard` | Staff | Staff operations dashboard. |
| `/profile` | Authenticated | User account details and security settings. |

---

## 7. Getting Started & Installation

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- MongoDB Atlas cluster or a running local MongoDB instance (`mongodb://127.0.0.1:27017/flexora`)

### Step 1: Install Dependencies
From the repository root:
```powershell
npm install
```

### Step 2: Environment Configuration
Copy environment files:
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Ensure `backend/.env` has:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/flexora
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Step 3: Seed Database
Seed default users, 9 standard business categories, and 72 predefined business types idempotently:
```powershell
npm run seed
```

#### Demo User Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Business Owner** | `owner@flexora.com` | `Owner@123456` |
| **Platform Admin** | `admin@flexora.com` | `Admin@123456` |
| **Manager** | `manager@flexora.com` | `Manager@123456` |
| **Staff** | `staff@flexora.com` | `Staff@123456` |

### Step 4: Run the Application
Start frontend and backend concurrently:
```powershell
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)

---

## 8. Running Automated Tests

Run all unit and integration test suites:
```powershell
npm test
```

### Verified Test Suites (32 Tests Passing):
1. **`auth.test.ts` (14 tests):**
   - Registration validation and role restrictions.
   - Login credential checks and HttpOnly cookies.
   - Account suspension blocking.
   - RBAC enforcement across roles.
   - Last active platform admin protection.
   - Token rotation, revocation, and reuse detection.
   - Password reset workflow.
2. **`business.test.ts` (18 tests):**
   - Category and business type listing.
   - Category-filtered business types.
   - 404 handling for non-existent categories.
   - Authenticated business creation by Business Owner.
   - Rejecting unauthenticated business creation (401).
   - Rejecting Managers and Staff from owner creation workflow (403).
   - Server-enforced `ownerId` preventing spoofing.
   - Required field validation (name, description, category).
   - Rejecting invalid or inactive categories.
   - Rejecting business types belonging to mismatched categories.
   - Custom business type registration.
   - Collision-safe unique slug generation loop.
   - Owner retrieving their owned businesses via `GET /businesses/my`.
   - Owner retrieving specific business by ID.
   - Rejecting another owner from reading private businesses (404/403).
   - Owner updating permitted profile fields via `PATCH /businesses/:id`.
   - Rejecting another owner from updating private businesses (403).
   - Protecting `ownerId` and `status` from modification.

---

## 9. Known Limitations & Roadmap

- **Step 3 (Upcoming):** Admin Category Management and Module Marketplace. Dynamic recommendations based on category and operational flags (e.g. online booking and payment flags) will be enabled in Step 3.
- **Step 4 (Upcoming):** Drag-and-drop Visual Website Builder.
- **Step 5 (Upcoming):** Team Management (inviting Managers and Staff to specific business tenants).
