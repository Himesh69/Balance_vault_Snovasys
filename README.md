<div align="center">

# BalanceVault

**Secure account management platform with double-entry ledger, RBAC, and immutable audit logging.**

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-34%2F34_passing-brightgreen)](.)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Overview

BalanceVault is a full-stack banking-style platform built for secure account management. It implements JWT authentication with role-based access control, a complete KYC onboarding workflow with admin adjudication, a double-entry accounting ledger that guarantees balanced books, and an immutable audit log that records every action in the system.

### Key Features

| Feature | Description |
|---|---|
| **JWT Auth + RBAC** | Stateless authentication with `ACCOUNT_HOLDER` and `ADMIN` roles, bcrypt cost ≥ 12 |
| **KYC Onboarding** | Multi-step onboarding workflow with admin review queue and adjudication dossier |
| **Double-Entry Ledger** | Every transaction produces balanced debit/credit entries — books always sum to zero |
| **Immutable Audit Logs** | Append-only log of every mutation: actor, action, resource, IP, user-agent, timestamp |
| **Redis Rate Limiting** | Distributed rate limiting with graceful in-memory fallback for local development |
| **Separated DB Roles** | `balancevault_migrator` (DDL) vs `balancevault_app` (DML only) for production security |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│            React 19 + Vite + Tailwind CSS                    │
│       Nginx reverse proxy (production) / Vite (dev)          │
├──────────────────────────────────────────────────────────────┤
│                          API                                 │
│           Express + TypeScript + Prisma ORM                  │
│    /auth  /onboarding  /accounts  /admin  /health            │
├───────────────────────┬──────────────────────────────────────┤
│     PostgreSQL 16     │           Redis 7                    │
│   Users, Accounts,    │     Rate limiting,                   │
│   Ledger, Audit Logs  │     Session cache                    │
└───────────────────────┴──────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL & Redis)

### 1. Clone & Install

```bash
git clone https://github.com/himesh723/Balance_vault.git
cd Balance_vault
npm --prefix backend install
npm --prefix frontend install
```

### 2. Start Infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379) in Docker.

### 3. Run Migrations & Seed

```bash
cd backend
cp ../.env.example .env          # or use the existing .env
npx prisma migrate deploy
npx prisma db seed
cd ..
```

The seed creates an admin user and the platform clearing account:

| Credential | Value |
|---|---|
| **Email** | `admin@balancevault.com` |
| **Password** | `Admin123!` |

### 4. Start the Application

```bash
# Terminal 1 — Backend API (http://localhost:4000)
npm --prefix backend run dev

# Terminal 2 — Frontend SPA (http://localhost:5173)
npm --prefix frontend run dev
```

---

## Production Deployment

### Docker Compose (Self-Hosted)

```bash
docker compose up -d --build
```

This builds and runs all four services (PostgreSQL, Redis, API, Frontend) with the frontend available on port 3000.

**Pre-built images** are also available on Docker Hub:

```bash
docker pull himesh723/balancevault-api:d6688b1
docker pull himesh723/balancevault-frontend:d6688b1
```

### Render (One-Click)

This repo includes a [`render.yaml`](render.yaml) blueprint. To deploy:

1. Push this repo to GitHub
2. Go to [Render Dashboard → Blueprints](https://dashboard.render.com/blueprints)
3. Click **New Blueprint Instance** and connect this repository
4. Render provisions PostgreSQL, Redis, API, and Frontend automatically

---

## API Reference

All endpoints are prefixed relative to the API root (`http://localhost:4000`).

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new account holder | — |
| `POST` | `/auth/login` | Login and receive JWT | — |
| `GET` | `/auth/me` | Get current user profile | Bearer |

### Onboarding (KYC)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/onboarding` | Start onboarding application | Bearer |
| `GET` | `/onboarding/status` | Check onboarding status | Bearer |
| `PATCH` | `/onboarding` | Update onboarding draft | Bearer |
| `POST` | `/onboarding/submit` | Submit for admin review | Bearer |

### Accounts & Ledger

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/accounts` | List user's accounts | Bearer |
| `GET` | `/accounts/:id` | Get account details | Bearer |
| `GET` | `/accounts/:id/ledger` | Get account ledger entries | Bearer |
| `POST` | `/accounts/:id/deposit` | Deposit funds | Bearer |
| `POST` | `/accounts/:id/withdraw` | Withdraw funds | Bearer |
| `POST` | `/accounts/transfer` | Transfer between accounts | Bearer |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/admin/users` | List all users | Admin |
| `GET` | `/admin/users/:id` | Get user details | Admin |
| `PATCH` | `/admin/users/:id/status` | Suspend / activate user | Admin |
| `DELETE` | `/admin/users/:id` | Hard delete user | Admin |
| `GET` | `/admin/onboarding` | List onboarding queue | Admin |
| `PATCH` | `/admin/onboarding/:id` | Approve / reject application | Admin |
| `GET` | `/admin/accounts` | List all accounts | Admin |
| `GET` | `/admin/audit-logs` | Query audit logs | Admin |

---

## Project Structure

```
Balance_vault/
├── backend/                    # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (6 models)
│   │   ├── migrations/         # Prisma migration history
│   │   └── seed.ts             # Admin user + clearing account seed
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/          # Auth, RBAC, rate limiting, errors
│   │   ├── routes/             # auth, onboarding, account, admin
│   │   ├── services/           # Business logic layer
│   │   └── index.ts            # Express app entry point
│   ├── tests/                  # 34 unit + integration tests
│   ├── Dockerfile              # Multi-stage production build
│   └── docker-entrypoint.sh    # Migrate + start script
├── frontend/                   # React 19 + Vite + Tailwind SPA
│   ├── src/
│   │   ├── components/         # UI primitives + layout shell
│   │   ├── context/            # Auth context provider
│   │   ├── lib/                # API client + utilities
│   │   └── pages/              # Login, Register, Dashboard,
│   │       └── admin/          # Users, Onboarding, Accounts, Logs
│   ├── nginx.conf              # Production reverse proxy config
│   └── Dockerfile              # Multi-stage Nginx build
├── docker-compose.yml          # Production 4-service stack
├── docker-compose.dev.yml      # Dev infrastructure (DB + Redis)
├── render.yaml                 # Render Blueprint for one-click deploy
├── init-db.sql                 # PostgreSQL role initialization
└── AGENTS.md                   # Development progress tracker
```

---

## Database Schema

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────▶│  Onboarding  │     │  AuditLog    │
│          │     │  (KYC)       │     │  (immutable) │
└────┬─────┘     └──────────────┘     └──────────────┘
     │
     ▼
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│ Account  │◀───▶│  LedgerEntry     │◀───▶│ LedgerTxn    │
│          │     │  (debit/credit)  │     │ (reference)  │
└──────────┘     └──────────────────┘     └──────────────┘
```

**Models:** `User` → `Onboarding` → `Account` → `LedgerEntry` ↔ `LedgerTransaction` + `AuditLog`

All monetary amounts are stored as **integers in the smallest currency unit** (cents for USD).

---

## Testing

```bash
npm --prefix backend test
```

**34 tests** across three suites:

| Suite | Tests | Coverage |
|---|---|---|
| Ledger (double-entry) | 6 | Deposits, withdrawals, transfers, balance consistency |
| Onboarding (KYC) | 5 | Draft → submit → approve/reject workflow |
| Auth & RBAC | 4 | Registration, login, token validation, role guards |
| Integration | 19 | Full API endpoint testing across all routes |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `4000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string (app role) | See `.env` |
| `DATABASE_URL_MIGRATE` | PostgreSQL connection string (migrator role) | See `.env` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT signing | (required) |
| `JWT_EXPIRES_IN` | Token expiration duration | `1h` |

---

## Design Decisions

- **Hard deletes only** — no soft-delete flags, per PRD requirements
- **Amounts in cents** — integers in smallest currency unit to avoid floating-point errors
- **bcrypt cost ≥ 12** — password hashing follows security best practices
- **Separated DB roles** — `balancevault_migrator` for DDL, `balancevault_app` for DML only
- **Redis with memory fallback** — graceful degradation when Redis is unavailable
- **Ponytail mode** — YAGNI-driven development, no unnecessary packages or abstractions

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with 🏦 by [himesh723](https://github.com/himesh723)

</div>

