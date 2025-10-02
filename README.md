# Acquisitions API

[![Tests](https://github.com/xenorre/acquisitions/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/xenorre/acquisitions/actions/workflows/tests.yml)
[![Lint and Format](https://github.com/xenorre/acquisitions/actions/workflows/lint-and-format.yml/badge.svg?branch=main)](https://github.com/xenorre/acquisitions/actions/workflows/lint-and-format.yml)
[![Docker Build and Push](https://github.com/xenorre/acquisitions/actions/workflows/docker-build-and-push.yml/badge.svg?branch=main)](https://github.com/xenorre/acquisitions/actions/workflows/docker-build-and-push.yml)
![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)
![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)

A Node.js (ESM) Express API for the Acquisitions system, using Drizzle ORM with PostgreSQL (Neon/Neon Local). The project is containerized for both development and production, with CI workflows for linting, formatting, testing, and Docker image publishing.

- Repository: https://github.com/xenorre/acquisitions
- Issues: https://github.com/xenorre/acquisitions/issues

## Table of contents
- Overview
- Features
- Tech stack
- Quick start
  - Local (Node)
  - Docker (development)
  - Docker (production)
- Configuration (env vars)
- NPM scripts
- API endpoints
- Architecture
- Development (lint/format/test)
- CI/CD
- License

## Overview
This service exposes REST endpoints for authentication and users, with secure middleware, structured logging, and health checks suitable for orchestration. It uses modern ESM, import aliases, and a typed data layer via Drizzle ORM.

## Features
- Express 5 with ESM and import aliases (#config/*, #routes/*, #services/*, etc.)
- Security middleware: helmet, cors, cookie-parser, rate limiting and shielding via Arcjet
- Auth flows with Zod validation, bcrypt password hashing, JWT signing, and secure cookies
- PostgreSQL access with Drizzle ORM (Neon HTTP client); migrations via drizzle-kit
- Health endpoint and container healthchecks
- Winston structured logging with morgan integration
- Dockerized workflows for dev and prod
- GitHub Actions for lint/format, tests, and Docker image publishing

## Tech stack
- Runtime: Node.js 20 (ESM)
- Framework: Express 5
- Validation: Zod
- Auth: jsonwebtoken, bcrypt, secure cookies
- ORM: Drizzle ORM + @neondatabase/serverless
- Logging: Winston + morgan
- Tooling: ESLint (flat config) + Prettier
- CI: GitHub Actions (lint/format, tests, Docker build & push)

## Quick start

### Local (Node)
Prerequisites: Node 20+, a reachable PostgreSQL instance (Neon or local), and a valid DATABASE_URL.

```bash path=null start=null
# Install deps
npm install

# Configure env
# Create .env.development with the variables from the Configuration section

# (Optional) Generate and run migrations — requires DATABASE_URL to be reachable
npm run db:generate
npm run db:migrate

# Start in watch mode
npm run dev

# App will be available at http://localhost:3000
# Healthcheck at http://localhost:3000/health
```

### Docker (development)
This brings up Neon Local and the app with hot reload.

```bash path=null start=null
# Requires .env.development
npm run dev:docker
# App: http://localhost:3000  |  Neon Local: 5432
```

### Docker (production)
Builds and runs the hardened production container.

```bash path=null start=null
# Requires .env.production
npm run prod:docker
# App: http://localhost:3000
```

## Configuration (env vars)
Set via dotenv locally and docker-compose in containers.

- DATABASE_URL: PostgreSQL connection string (Neon or Neon Local)
- ARCJET_KEY: Arcjet service key
- JWT_SECRET: Secret used to sign JWTs
- JWT_EXPIRES_IN: e.g., 1d, 12h
- LOG_LEVEL: e.g., info, debug, warn
- NODE_ENV: development | test | production
- PORT: default 3000

Example (.env.development):

```dotenv path=null start=null
DATABASE_URL=postgres://neon:neon@localhost:5432/postgres
ARCJET_KEY=your_arcjet_key
JWT_SECRET=dev_secret
JWT_EXPIRES_IN=1d
LOG_LEVEL=debug
NODE_ENV=development
PORT=3000
```

## NPM scripts
```bash path=null start=null
# App lifecycle
npm run dev           # Node watch mode
npm start             # Production mode

# Lint & format
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Database (Drizzle)
npm run db:generate   # Generate SQL from schema
npm run db:migrate    # Apply migrations
npm run db:deploy     # Generate + migrate
npm run db:studio     # Explore schema

# Docker
npm run dev:docker
npm run prod:docker

# Tests
npm test              # Runs Jest (see CI for skip behavior if none exist)
```

## API endpoints (non-exhaustive)
- GET / → Hello from API!
- GET /health → Health JSON (used by healthchecks)
- GET /api → Basic API status
- POST /api/auth/sign-up → Create user (validates with Zod, sets auth cookie)
- POST /api/auth/sign-in → Authenticate user (validates with Zod, sets auth cookie)
- POST /api/auth/sign-out → Clear auth cookie
- GET /api/users → List users (requires DB connectivity)

## Architecture
- Module system and aliases
  - ESM via "type": "module"
  - Node import aliases defined in package.json: #config/*, #middleware/*, #models/*, #routes/*, #controllers/*, #services/*, #utils/*, #validations/*
- Bootstrap
  - src/index.js: loads env and starts server (imports src/server.js)
  - src/server.js: reads PORT (default 3000), calls app.listen
  - src/app.js: builds Express app (middleware, routes, /health)
- Middleware
  - helmet, cors, express.json/urlencoded, cookie-parser
  - morgan → Winston stream
  - Arcjet-based shielding and per-role rate limiting (guest/user/admin)
- Data layer (Drizzle + Neon)
  - src/config/database.js: Neon HTTP client + Drizzle
  - Schema in src/models/*.js; drizzle.config.js outputs to drizzle/
- Logging
  - Winston with JSON format, timestamps, error stacks; console in non-prod
- Health & observability
  - GET /health for liveness
- Containerization
  - Multi-stage Dockerfile (dev/build/prod) on Node 20-alpine
  - docker-compose.dev.yml: Neon Local + app with hot reload
  - docker-compose.prod.yml: production target + healthchecks and security options

Example project layout:
```text path=null start=null
.
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ index.js
│  ├─ config/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ controllers/
│  ├─ services/
│  └─ utils/ validations/
├─ drizzle/
├─ drizzle.config.js
├─ Dockerfile
├─ docker-compose.dev.yml
├─ docker-compose.prod.yml
├─ package.json
└─ README.md
```

## Development
- Lint: npm run lint (auto-fix: npm run lint:fix)
- Format: npm run format / npm run format:check
- Tests: npm test (Jest + Supertest). CI will skip gracefully if no tests are present, otherwise runs with coverage.

## CI/CD
GitHub Actions workflows:
- Lint and Format: .github/workflows/lint-and-format.yml
- Tests: .github/workflows/tests.yml (Node 20, coverage artifacts)
- Docker Build and Push: .github/workflows/docker-build-and-push.yml (multi-platform images, tags, OCI labels)

## License
ISC. See the license declaration in package.json.
