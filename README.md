# Flexora System Builder — Multi-Tenant SaaS Platform

**Flexora System Builder** is a modular, multi-tenant SaaS business platform where business owners register their businesses, describe operations, select tailored modules, and build their online web presence.

- **Step 1:** Authentication & Role-Based Access Control (RBAC) ✅
- **Step 2:** Business Registration, Business Profile Management, Business Categories & Types ✅
- **Step 3:** Platform Admin Category, Business Type & Module Management ✅

---

## 1. Architecture Overview

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS / Flexora Design Tokens, Lucide React, React Hot Toast, Axios, React Router.
- **Backend:** Node.js, Express, TypeScript, Mongoose, MongoDB Atlas / Local MongoDB, bcryptjs, jsonwebtoken, Zod, Helmet, Cookie-Parser, Express-Rate-Limit.
- **Testing:** Vitest, Supertest (51 comprehensive unit and integration tests across 3 test suites).

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

## 2. Platform Admin Architecture & Access Control (Step 3)

### Role & Endpoint Protection
- **Role Enforcement:** All administrative routes under `/api/v1/admin/*` and `/admin/*` require the `PLATFORM_ADMIN` role enforced by `requireAuth` and `requirePlatformAdmin` middleware.
- **Unauthorized Role Blocking:** Requests from Business Owners, Managers, and Staff to admin endpoints are rejected with `403 Forbidden`.
- **Audit Logging:** Administrative changes to business categories, business types, module categories, and modules are logged in `AuditLog` with `adminId`, action, entity type, entity ID, and non-sensitive change details.

### Business Category & Type Management
- **Safe Deletion Policy:** Categories and business types cannot be deleted if referenced by existing business types or active businesses. Administrators are prompted to deactivate/archive them instead to preserve historical tenant integrity.
- **Taxonomy Referential Integrity:** Assigning or editing business types enforces that the selected category exists and is active.

### Reusable Module Catalog & Dependency Graph
- **Catalog Separation:** Module definitions, pricing, prerequisites, and recommendation mappings are configuration-driven, cleanly decoupled from functional implementation.
- **Dependency Cycle Prevention (`dependencyGraph.ts`):** Directed Acyclic Graph (DAG) cycle detection via Depth-First Search (DFS) prevents:
  - Self-dependencies (Module A cannot depend on Module A).
  - Duplicate dependencies.
  - References to missing or archived modules.
  - Direct circular dependencies (A → B, preventing B → A).
  - Indirect circular dependencies (A → B → C, preventing C → A).
- **Pricing & Annual Savings:** Validates non-negative monthly and yearly prices on the server. Calculates annual savings preview (`monthlyPrice × 12 − yearlyPrice`).
- **Recommended Business Types:** Links modules to advisory business types in MongoDB to inform upcoming Step 4 recommendations.

---

## 3. Data Models

### ModuleCategory Model (`backend/src/models/ModuleCategory.ts`)
| Field | Type | Details |
| :--- | :--- | :--- |
| `name` | String | Module category title (e.g. "Booking & Scheduling", "Finance") |
| `slug` | String | Unique URL slug indexed for lookups |
| `description` | String | Category summary |
| `icon` | String | Icon identifier |
| `status` | Enum | `ACTIVE` or `INACTIVE` |
| `displayOrder` | Number | Sorting order |
| `createdAt`, `updatedAt` | Date | Timestamps |

### BusinessModule Model (`backend/src/models/BusinessModule.ts`)
| Field | Type | Details |
| :--- | :--- | :--- |
| `name` | String | Reusable module title |
| `slug` | String | Unique URL slug |
| `description` | String | Feature capability summary |
| `icon` | String | Icon identifier |
| `moduleCategoryId` | ObjectId | Reference to `ModuleCategory` |
| `monthlyPrice` | Number | Non-negative monthly subscription cost |
| `yearlyPrice` | Number | Non-negative yearly subscription cost |
| `currency` | String | ISO Currency code (default: USD) |
| `status` | Enum | `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `dependencies` | Array<ObjectId> | Prerequisite modules (cycle-validated) |
| `recommendedBusinessTypes` | Array<ObjectId> | Reference to recommended `BusinessType` records |
| `displayOrder` | Number | Sorting order |
| `createdAt`, `updatedAt` | Date | Timestamps |

### AuditLog Model (`backend/src/models/AuditLog.ts`)
| Field | Type | Details |
| :--- | :--- | :--- |
| `adminId` | ObjectId | Reference to `User` |
| `action` | String | `CREATE`, `UPDATE`, `STATUS_CHANGE`, `DELETE` |
| `entityType` | String | Model modified |
| `entityId` | String | ID of modified entity |
| `details` | Object | Safe payload change details |
| `createdAt` | Date | Timestamp |

---

## 4. API Reference (`/api/v1`)

### Platform Admin Management (Requires `PLATFORM_ADMIN` role)
- `GET /api/v1/admin/dashboard` — Platform overview, user counts, module distribution, and diagnostics.
- `GET /api/v1/admin/categories` — List business categories with associated business type counts.
- `POST /api/v1/admin/categories` — Create business category.
- `GET /api/v1/admin/categories/:id` — Get single category details.
- `PATCH /api/v1/admin/categories/:id` — Update category details.
- `PATCH /api/v1/admin/categories/:id/status` — Toggle category status.
- `DELETE /api/v1/admin/categories/:id` — Safe deletion (blocked if referenced).
- `GET /api/v1/admin/business-types` — List business types with category filters and business counts.
- `POST /api/v1/admin/business-types` — Create business type.
- `GET /api/v1/admin/business-types/:id` — Get single business type details.
- `PATCH /api/v1/admin/business-types/:id` — Update business type.
- `PATCH /api/v1/admin/business-types/:id/status` — Toggle business type status.
- `DELETE /api/v1/admin/business-types/:id` — Safe deletion (blocked if used).
- `GET /api/v1/admin/module-categories` — List module categories with module counts.
- `POST /api/v1/admin/module-categories` — Create module category.
- `GET /api/v1/admin/module-categories/:id` — Get single module category details.
- `PATCH /api/v1/admin/module-categories/:id` — Update module category.
- `PATCH /api/v1/admin/module-categories/:id/status` — Toggle module category status.
- `DELETE /api/v1/admin/module-categories/:id` — Safe deletion (blocked if modules attached).
- `GET /api/v1/admin/modules` — List reusable modules with category/price filters and sorting.
- `POST /api/v1/admin/modules` — Create reusable module with pricing, dependencies, and recommendations.
- `GET /api/v1/admin/modules/:id` — Get module details with populated references.
- `PATCH /api/v1/admin/modules/:id` — Update module details, pricing, dependencies, and recommendations.
- `PATCH /api/v1/admin/modules/:id/status` — Toggle module status (`ACTIVE`, `INACTIVE`, `ARCHIVED`).
- `PATCH /api/v1/admin/modules/:id/dependencies` — Update dependencies (cycle-validated).
- `PATCH /api/v1/admin/modules/:id/recommendations` — Update recommended business types.
- `DELETE /api/v1/admin/modules/:id` — Safe deletion (blocked if other active modules depend on it).
- `GET /api/v1/admin/users` — Paginated user directory.
- `PATCH /api/v1/admin/users/:id/status` — Account status controls.
- `PATCH /api/v1/admin/users/:id/role` — Role reassignment with last-admin protection.

### Business Owner & Tenant Operations (Step 2)
- `GET /api/v1/business-categories` — Public / active business categories.
- `GET /api/v1/business-categories/:id/types` — Active business types for selected category.
- `POST /api/v1/businesses` — Register business workspace for authenticated owner.
- `GET /api/v1/businesses/my` — List businesses owned by current user.
- `GET /api/v1/businesses/:id` — Read single business (ownership verified).
- `PATCH /api/v1/businesses/:id` — Update permitted profile fields.

---

## 5. Frontend Routes

| Route | Role Access | Description |
| :--- | :--- | :--- |
| `/admin/dashboard` | Platform Admin | Live platform overview, metrics, module distribution, and diagnostics. |
| `/admin/categories` | Platform Admin | Business category CRUD table with type counts and modal editors. |
| `/admin/business-types` | Platform Admin | Business type CRUD table with category filters and business counts. |
| `/admin/module-categories` | Platform Admin | Module category CRUD table with module counts. |
| `/admin/modules` | Platform Admin | Reusable modules catalog with pricing, savings, prerequisites, and recommendation badges. |
| `/admin/modules/create` | Platform Admin | Module creator with pricing calculator, dependency graph selector, and recommendation mapping. |
| `/admin/modules/:id/edit` | Platform Admin | Module editor with dependency cycle detection. |
| `/admin/users` | Platform Admin | User management directory with status and role controls. |
| `/business/dashboard` | Business Owner | Business dashboard with profile completeness and upcoming module catalog placeholder. |
| `/business/setup` | Business Owner | 3-step business registration wizard. |
| `/business/settings` | Business Owner | Business profile settings. |

---

## 6. Getting Started & Installation

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- MongoDB Atlas cluster or running local MongoDB instance (`mongodb://127.0.0.1:27017/flexora`)

### Step 1: Install Dependencies
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
Seed default users, 9 business categories, 72 business types, 11 module categories, and 45+ reusable modules idempotently:
```powershell
npm run seed
```

#### Demo User Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Platform Admin** | `admin@flexora.com` | `Admin@123456` |
| **Business Owner** | `owner@flexora.com` | `Owner@123456` |
| **Manager** | `manager@flexora.com` | `Manager@123456` |
| **Staff** | `staff@flexora.com` | `Staff@123456` |

### Step 4: Run Application
Start both frontend and backend concurrently:
```powershell
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)

---

## 7. Running Automated Tests

Run the full automated test suite:
```powershell
npm test
```

### Verified Test Suites (51 Tests Passing):
1. **`auth.test.ts` (14 tests):** Authentication, token rotation, and RBAC enforcement.
2. **`business.test.ts` (18 tests):** Multi-tenant business registration, custom types, and isolation.
3. **`admin.step3.test.ts` (19 tests):**
   - Platform Admin role enforcement and unauthorized role blocking (401/403).
   - Category CRUD and safe deletion blocking when types/businesses exist.
   - Business type CRUD and inactive category validation.
   - Module category CRUD and deletion blocking when modules exist.
   - Reusable module creation, pricing validation, and annual savings.
   - Self-dependency rejection (A → A).
   - Duplicate dependency rejection.
   - Direct circular dependency prevention (A → B → A).
   - Indirect circular dependency prevention (A → B → C → A).
   - Admin dashboard aggregated statistics.

---

## 8. Known Limitations & Roadmap

- **Step 4 (Upcoming):** Customer Module Selection, Recommendation Engine, and Price Calculation for Business Owners.
- **Step 5 (Upcoming):** Visual Drag-and-Drop Website Builder.
- **Step 6 (Upcoming):** Team & Role Delegation inside Business Tenants.
