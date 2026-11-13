# BalanceVault — AGENTS.md Progress Tracker

> Tracks every meaningful action, fix, and decision made during development.

## Project Overview

**BalanceVault** — Secure account management platform with JWT auth, RBAC, onboarding workflow, double-entry ledger, immutable audit logging, and Redis rate limiting.

**Stack:** Node.js + Express + TypeScript + Prisma (backend) | React + Vite + Tailwind (frontend) | PostgreSQL + Redis (infra)

---

## Task Log

### 2026-11-12 — Initial Scaffolding

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Full backend: Express+TS+Prisma, all services/controllers/routes/middleware | ✅ Done | `e9cd64e` |
| 2 | Full frontend: React+Vite+Tailwind, all pages (Login, Register, Dashboard, Onboarding, Accounts, Admin*) | ✅ Done | `e9cd64e` |
| 3 | Docker Compose, Dockerfiles, init-db.sql, .env.example, .gitignore | ✅ Done | `e9cd64e` |
| 4 | 15 unit tests (ledger: 6, onboarding: 5, auth_rbac: 4) — all passing | ✅ Done | `e9cd64e` |
| 5 | Frontend SPA routing, Nginx reverse proxy config, AdminAccounts page | ✅ Done | `2dbcd50` |
| 6 | .agents/ skills + Code-review-graph tracked in git | ✅ Done | `72c2413` |

### 2026-11-13 — 502 Fix, Local Dev Setup, Endpoint Testing

| # | Task | Status | Commit |
|---|------|--------|--------|
| 7 | Create AGENTS.md progress tracker | ✅ Done | `e969008` |
| 8 | Create docker-compose.dev.yml (DB + Redis only for local dev) | ✅ Done | `e969008` |
| 9 | Create .env for local development | ✅ Done | `d0de8ab` |
| 10 | Fix: Add AppError class for proper HTTP status codes (root cause #2 of 502) | ✅ Done | `d0de8ab` |
| 11 | Run Prisma migrations to create tables (root cause #1 of 502) | ✅ Done | `d0de8ab` |
| 12 | Run seed to create admin user + clearing account | ✅ Done | `d0de8ab` |
| 13 | Fix backend Dockerfile (migrations + entrypoint) | ✅ Done | `d0de8ab` |
| 14 | Test all API endpoints locally (34/34 passing) | ✅ Done | `291e87e` |
| 15 | Integration tests for login flow & full banking workflow | ✅ Done | `291e87e` |
| 16 | Ponytail cleanup audit (lean dependencies, YAGNI) | ✅ Done | `291e87e` |
| 17 | Update Code Review Graph | ✅ Done | `Current` |

---

## 502 Root Cause Analysis

Three issues identified that cause the 502 Bad Gateway when accessing `/login` through Nginx proxy:

### Issue 1 (PRIMARY): No Prisma migrations exist
- `prisma migrate dev` was never run → no migration SQL files → no database tables
- Backend Dockerfile runs `npx prisma generate` (types only) but never `prisma migrate deploy`
- Result: Any Prisma query crashes the API → Nginx returns 502

### Issue 2: Service errors throw plain `Error` without HTTP status codes
- All services throw `new Error('message')` — no `statusCode` property
- Error handler defaults to 500 for everything
- Fix: Created `AppError` class mapping specific errors to proper HTTP codes

### Issue 3: Backend Dockerfile missing startup steps
- No entrypoint script to run migrations + seed before starting the server
- Fix: Added `docker-entrypoint.sh` with migrate deploy + seed + node start

---

## Architecture Decisions

- **Ponytail mode active**: YAGNI. One-line solutions preferred. Mark simplifications with `ponytail:` comments.
- **Hard deletes only** (PRD requirement) — no soft-delete flags
- **Amounts in cents** — integers in smallest currency unit
- **bcrypt cost ≥ 12** (PRD 6.1)
- **Separate DB roles** — `balancevault_migrator` (DDL) vs `balancevault_app` (DML only)
- **Redis with memory fallback** — graceful degradation for local dev

