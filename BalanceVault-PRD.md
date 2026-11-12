# Product Requirements Document (PRD)
## BalanceVault — Money Movement with a Ledger You Can Prove

**Version:** 1.1  
**Status:** Ready for Implementation  
**Last Updated:** 2026-11-12  
**Owner:** Snovasys Challenge Team  

---

## 1. Executive Summary

BalanceVault is a secure account-management platform that provides controlled access, structured onboarding, role-based authorization, reliable financial operations, and a fully auditable double-entry ledger of every important action.

The system is designed so that every significant state change (account creation, status change, ledger movement, role change, onboarding decision) is recorded in an immutable audit trail that can be inspected by authorized administrators.

**Core value proposition**
- Account holders get a clear, controlled onboarding experience and a reliable view of their accounts and ledger.
- Administrators get tools to manage users, review onboarding requests, and inspect a complete audit log.
- The platform itself is built with explicit security boundaries (separate database roles, rate limiting, RBAC) so that “you can prove” what happened.

---

## 2. Goals & Success Criteria

### 2.1 Business / Product Goals
- Provide a production-grade foundation for account management with strong auditability.
- Enforce least-privilege access through roles and database-level separation.
- Make onboarding and account lifecycle operations transparent and reviewable.
- Demonstrate clean separation of concerns (frontend, API, data, infrastructure).
- Deliver a working MVP as quickly as possible while meeting all challenge requirements.

### 2.2 Success Metrics (MVP)
| Metric | Target |
|--------|--------|
| Successful registration → onboarding completion rate | ≥ 80% of started flows |
| All critical operations produce an audit entry | 100% |
| Unauthorized access attempts blocked | 100% (tested via role matrix) |
| Rate-limit effectiveness on auth & sensitive endpoints | Configurable, measurable |
| Docker-based local environment starts cleanly | `docker compose up` works out of the box |
| Double-entry ledger integrity | Every movement has balancing debit + credit |

---

## 3. Scope

### 3.1 In Scope (MVP)
- User registration (account-holder) — no email verification required
- Authentication via JWT (chosen for speed of implementation)
- Role-based access control (RBAC)
- Account-holder onboarding workflow with common identity fields
- Admin: user management, onboarding review/approval/rejection, audit-log viewing
- Double-entry ledger for all money movements
- Minimum account operations (see §6.3)
- Immutable audit logging of important actions
- PostgreSQL via Prisma with migrations
- Separate database roles for application vs. migration duties
- Redis-backed rate limiting
- Docker Compose for PostgreSQL + Redis (and optionally the application services)
- Hard deletes only (no soft-delete flags)

### 3.2 Out of Scope (MVP)
- Real-world payment processors or bank integrations
- Multi-currency FX or complex financial products
- Mobile native applications
- Advanced analytics / BI dashboards
- Full KYC/AML vendor integrations
- Email verification / password-reset email flows
- Soft deletes
- Horizontal scaling / multi-region deployment (architecture should not preclude it)

---

## 4. Personas & Roles

| Role | Description | Primary Capabilities |
|------|-------------|----------------------|
| **Account Holder** | End user who owns one or more accounts | Register, complete onboarding, view own accounts & ledger, perform allowed operations on own accounts |
| **Admin** | Internal operator | Manage users, review/approve/reject onboarding, view audit logs, perform administrative account actions |
| **System / Service** | Backend processes | Write audit entries, enforce rate limits, run migrations (via privileged DB role) |

---

## 5. User Journeys (High Level)

### 5.1 Account Holder Journey
1. Lands on registration page → creates credentials + basic profile (no email verification).
2. Logs in (JWT issued) → is guided through onboarding form.
3. Submits onboarding → status becomes `SUBMITTED` (Pending Review).
4. After admin approval → primary account is created/activated.
5. Can view account details, double-entry ledger history, and perform the minimum permitted operations.
6. All sensitive actions are recorded in the audit log (visible only to admins).

### 5.2 Admin Journey
1. Logs in with admin credentials.
2. Views list of users and their onboarding status.
3. Reviews pending onboarding requests → Approve / Reject (with optional reason). Rejected applications may be re-submitted by the user.
4. Manages user accounts (status changes, hard delete if required).
5. Inspects the audit log (filterable by user, action type, date range, resource).

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- Secure registration and login.
- Password hashing with bcrypt (cost factor ≥ 12).
- **JWT-based authentication** (access token, short-lived). Chosen because it is the fastest to implement and sufficient for the challenge.
- Role-based route and service-level guards.
- Logout = client discards token (optional server-side denylist can be added later if time permits).
- Redis-backed rate limiting on login, registration, and sensitive mutation endpoints.

### 6.2 Account Holder Registration & Onboarding

**Registration fields (minimal)**
- Email (unique)
- Password
- Full name

**Onboarding – common fields used across similar platforms**
- Full legal name
- Date of birth
- Phone number
- Residential address (street, city, state/province, postal code, country)
- Government ID type + number (e.g. Passport / National ID / Driver’s License) – stored as plain text for MVP
- Occupation / source of funds (simple free-text or select)
- Optional: profile photo / ID document upload (metadata only if file storage is out of scope)

**Onboarding status machine**
```
DRAFT → SUBMITTED → APPROVED
                 ↘ REJECTED → (user may edit & re-submit → SUBMITTED)
```
- Only the account holder can move `DRAFT → SUBMITTED`.
- Only an admin can move `SUBMITTED → APPROVED` or `REJECTED`.
- Rejection stores an optional reason. User can edit the form and re-submit.

### 6.3 Account Management & Minimum Operations

**Account**
- Created automatically (or on first approval) and linked to the user.
- Statuses: `PENDING` → `ACTIVE` ⇄ `SUSPENDED` → `CLOSED`
- Hard delete only (admin action).

**Double-Entry Ledger (required)**
- Every money movement creates at least two ledger entries that balance (debit = credit).
- Simple chart of accounts for MVP:
  - User Asset Account (liability from platform perspective or asset from user perspective – implement consistently)
  - Platform Clearing / Cash account
  - Optional: Fee / Adjustment accounts if needed

**Minimum required operations (MVP)**
1. **Create Account** – system creates the primary account on onboarding approval.
2. **Credit / Deposit** – increase user balance (double-entry: debit clearing, credit user account).
3. **Debit / Withdrawal** – decrease user balance (double-entry: debit user account, credit clearing) – subject to available balance.
4. **View Ledger / Statement** – list of balanced entries for an account.
5. **Suspend / Activate Account** – admin only.
6. **Hard Delete Account / User** – admin only (cascading or restricted by business rules).

No external payment rails, no transfers between users, no complex product types for MVP.

### 6.4 Admin Functionality
- List / search / filter users.
- View user detail + full onboarding data.
- Approve or reject onboarding (with reason).
- Change account / user status.
- Hard-delete user or account (with confirmation).
- Full audit-log viewer with filters (actor, action, resource type/id, date range).

### 6.5 Audit Logging
Every important action writes an immutable audit record containing at minimum:
- actorId (user or system)
- action (enum or string)
- resourceType + resourceId
- timestamp
- metadata / before-after snapshot (JSON)
- IP address & user-agent (captured when available)

Critical actions that **must** be audited:
- Registration, login success/failure (optional), onboarding submit/approve/reject
- Account create / status change / delete
- Every ledger movement
- Role or permission changes
- Admin actions on users

### 6.6 Rate Limiting
Redis-backed rate limiting applied to:
- `POST /auth/register`
- `POST /auth/login`
- Sensitive mutation endpoints (onboarding submit, ledger operations, admin actions)

Configurable windows (e.g. 5 requests / minute for login).

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | RBAC at API level; separate DB roles; JWT; bcrypt; rate limiting; secrets via env |
| **Auditability** | 100% of critical mutations produce an audit entry |
| **Ledger Integrity** | Double-entry: sum of debits = sum of credits for every transaction |
| **Reliability** | DB transactions for multi-entry ledger writes + audit |
| **Speed of delivery** | Prefer simple, well-known libraries; avoid heavy frameworks where a lighter alternative exists |
| **Maintainability** | Prisma migrations; clear layering; Dockerized Postgres + Redis |
| **Deletes** | Hard deletes only |

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
┌─────────────────┐     HTTPS/JSON    ┌──────────────────────┐
│  React Frontend │ ◄────────────────► │  Node.js API Server  │
│  (Vite + TS)    │                    │  (Express + TS)      │
└─────────────────┘                    └──────────┬───────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
             ┌─────────────┐              ┌──────────────┐              ┌─────────────┐
             │ PostgreSQL  │              │    Redis     │              │ Audit +     │
             │ (Prisma)    │              │ (Rate Limit) │              │ Ledger      │
             └─────────────┘              └──────────────┘              └─────────────┘
```

### 8.2 Component Responsibilities

**Frontend**
- Lightweight React + TypeScript + Vite
- Tailwind CSS for styling (fast to build, no heavy component library)
- Minimal custom components or very light headless primitives
- Protected routes based on JWT + role
- Onboarding form, account/ledger views, admin screens

**Backend**
- Node.js + Express + TypeScript (chosen for speed and simplicity)
- Prisma Client
- JWT auth middleware
- Zod validation
- Central AuditService and LedgerService
- Redis rate-limiter middleware

**Database**
- PostgreSQL 16 via Docker
- Prisma schema + migrations
- Separate DB roles (see §9)

**Redis**
- Rate limiting only (MVP)

### 8.3 Docker Strategy

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: balancevault
      POSTGRES_PASSWORD: ...
      POSTGRES_DB: balancevault
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  # Optional for full-stack demo
  api:
    build: ./backend
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: ...
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ...
```

- Local development can run API & frontend on the host while Postgres + Redis stay in Docker.
- Migrations always run with the migrator role.

---

## 9. Data Architecture & Security Boundaries

### 9.1 Core Entities (Conceptual)

- **User** – id, email, passwordHash, fullName, role (`ACCOUNT_HOLDER` | `ADMIN`), status, createdAt, updatedAt
- **Onboarding** – userId, status, personal fields (see §6.2), reviewNotes, reviewedBy, submittedAt, reviewedAt
- **Account** – id, userId, accountNumber, status, currency (default USD or INR), createdAt
- **LedgerTransaction** – id, reference, description, createdBy, createdAt (header)
- **LedgerEntry** – id, transactionId, accountId, direction (`DEBIT` | `CREDIT`), amount, createdAt
- **AuditLog** – id, actorId, action, resourceType, resourceId, metadata (Json), ip, userAgent, createdAt

All deletes are hard deletes. Foreign keys should use appropriate `ON DELETE` behaviour (restrict or cascade as decided in schema).

### 9.2 Separate Database Roles

| Role | Privileges | Used By |
|------|------------|---------|
| `balancevault_migrator` | Full DDL + DML | Prisma migrate only |
| `balancevault_app` | DML only (SELECT/INSERT/UPDATE/DELETE) on application tables | Running API |

Application never connects with the migrator role.

### 9.3 Prisma
- Single schema file as source of truth.
- All schema changes via migrations.
- Seed script creates the first Admin user.

---

## 10. API Surface (High-Level)

### Auth
- `POST /auth/register`
- `POST /auth/login` → returns JWT
- `GET  /auth/me`

### Onboarding (Account Holder)
- `GET  /onboarding`
- `PUT  /onboarding`          (save draft)
- `POST /onboarding/submit`

### Accounts & Ledger (Account Holder)
- `GET  /accounts`
- `GET  /accounts/:id`
- `GET  /accounts/:id/ledger`
- `POST /accounts/:id/credit`   (or generic movement endpoint)
- `POST /accounts/:id/debit`

### Admin
- `GET    /admin/users`
- `GET    /admin/users/:id`
- `PATCH  /admin/users/:id`           (status)
- `DELETE /admin/users/:id`           (hard delete)
- `GET    /admin/onboarding`
- `POST   /admin/onboarding/:id/approve`
- `POST   /admin/onboarding/:id/reject`
- `GET    /admin/audit-logs`
- `PATCH  /admin/accounts/:id`        (suspend/activate)
- `DELETE /admin/accounts/:id`

All protected routes require a valid JWT. Admin routes additionally require `role === ADMIN`.

---

## 11. Security Requirements

1. Passwords hashed with bcrypt (cost ≥ 12).
2. JWT access tokens (short expiry, e.g. 15–60 min). Refresh tokens optional for MVP.
3. RBAC middleware on every protected route.
4. Input validation with Zod.
5. Redis rate limiting on auth and mutation endpoints.
6. Separate database credentials; app role has no DDL rights.
7. Audit log is append-only from the application’s perspective.
8. Secrets only via environment variables.
9. Helmet + basic security headers.
10. Hard deletes only – no soft-delete columns.

---

## 12. Onboarding & Account Lifecycle

### Onboarding
```
DRAFT → SUBMITTED → APPROVED
                 ↘ REJECTED → (edit) → SUBMITTED
```

### Account
```
PENDING → ACTIVE ⇄ SUSPENDED → CLOSED
```
Hard delete possible from any state by Admin (subject to business rules, e.g. zero balance).

Every transition is written to the audit log.

---

## 13. Double-Entry Ledger Rules

- Every financial movement is a `LedgerTransaction` containing two or more `LedgerEntry` rows.
- For every transaction: `SUM(debit amounts) = SUM(credit amounts)`.
- Amounts stored as integers (smallest currency unit) or `Decimal` – choose one and stay consistent.
- Account balance is derived (sum of entries) or maintained as a cached value that is updated inside the same DB transaction.
- All ledger writes occur inside a single database transaction together with the corresponding audit entry.

---

## 14. Technology Stack (Final – optimised for speed)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + TypeScript + Vite | Fast DX |
| Styling | Tailwind CSS | Utility-first, very fast to build UI |
| Backend | Node.js + Express + TypeScript | Minimal ceremony, quick to implement |
| Validation | Zod | Shared-friendly, excellent DX |
| ORM | Prisma | Migrations + type safety |
| Database | PostgreSQL 16 | Via Docker |
| Cache / Rate Limit | Redis 7 | Via Docker |
| Auth | JWT (jsonwebtoken + bcrypt) | Fastest solid option |
| Containerization | Docker Compose | Postgres + Redis mandatory |

No heavy UI component library. Keep components simple and Tailwind-based.

---

## 15. Deployment & Local Development

```bash
# Start infrastructure
docker compose up -d

# Backend
cp .env.example .env
npx prisma migrate dev
npx prisma db seed          # creates initial admin
npm run dev

# Frontend
npm run dev
```

Environment variables (example):
- `DATABASE_URL` (app role)
- `DATABASE_URL_MIGRATE` (migrator role)
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Incomplete audit coverage | Central AuditService + tests that assert entries exist |
| Ledger imbalance | DB transaction + application-level assertion that debits == credits |
| Over-privileged DB role | Explicit migrator vs app roles |
| Scope creep | Strict adherence to the minimum operations listed in §6.3 |
| Slow UI development | Tailwind only – no complex design system |

---

## 17. Decisions Log (from Product Owner)

| Question | Decision |
|----------|----------|
| Auth mechanism | JWT (fastest solid implementation) |
| Ledger style | Double-entry |
| Email verification | Not required |
| Onboarding fields | Common identity & address fields (see §6.2) |
| Rejected onboarding | Re-submittable |
| UI approach | Lite & fast → React + Vite + Tailwind (no heavy component library) |
| Deletes | Hard deletes only |
| Account operations | Minimum set only (create, credit, debit, view ledger, suspend/activate, hard delete) |

---

## 18. Appendix – Glossary

- **RBAC** – Role-Based Access Control  
- **Audit Log** – Immutable record of who did what and when  
- **Double-Entry** – Every movement recorded as balanced debit(s) + credit(s)  
- **Onboarding** – Structured collection and review of account-holder information  
- **Hard Delete** – Row is permanently removed from the database  

---

*End of PRD – Version 1.1*
