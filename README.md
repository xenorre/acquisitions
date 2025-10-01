# README.md

Project type: Node.js (ESM) Express API with Drizzle ORM (PostgreSQL via Neon), Dockerized for dev/prod.

Common commands

- Install dependencies
  - npm install
- Run locally (hot reload)
  - npm run dev
- Run in production mode (locally)
  - npm start
- Lint and format
  - Lint: npm run lint
  - Lint (auto-fix): npm run lint:fix
  - Format write: npm run format
  - Format check: npm run format:check
- Database (Drizzle)
  - Generate SQL from models: npm run db:generate
  - Apply migrations: npm run db:migrate
  - Generate + migrate: npm run db:deploy
  - Explore schema: npm run db:studio
- Docker (compose)
  - Dev (requires .env.development): npm run dev:docker
  - Prod (requires .env.production): npm run prod:docker

Notes on testing

- No test runner or test scripts are configured in package.json. Running a single test is not applicable until a test framework is added.

High-level architecture

- Module system and path aliases
  - ESM enabled via "type": "module".
  - package.json defines Node "imports" aliases used across the codebase: #config/_, #middleware/_, #models/_, #routes/_, #controllers/_, #services/_, #utils/_, #validations/_.
  - Prefer these aliases over relative paths when creating or moving files to keep imports consistent.
- Application bootstrap
  - src/index.js loads environment (dotenv) and starts the server by importing src/server.js.
  - src/server.js reads PORT (default 3000) and calls app.listen.
  - src/app.js constructs the Express app, registers middleware, routes, and health endpoints, then exports the configured app.
- Middleware
  - helmet, cors, express.json/urlencoded, cookie-parser for request handling and security hardening.
  - morgan logs to Winston via a custom stream.
  - Custom security middleware (src/middleware/security.middleware.js) integrates Arcjet for bot detection, shielding, and per-role rate limiting (guest/user/admin) using sliding windows. Denials respond with 403 and structured JSON.
- Routing and request flow
  - Routes: /api/auth (src/routes/auth.routes.js), /api/users (src/routes/users.routes.js), plus root / and /health.
  - Controllers validate input with Zod (src/validations/auth.validation.js), format validation errors via utils (formatValidationError), then delegate to services.
  - Services encapsulate business logic and DB access:
    - auth.service.js: user creation with bcrypt hashing, uniqueness checks via Drizzle; authentication with bcrypt compare; returns user sans password.
    - users.service.js: reads users via typed Drizzle selects.
  - Utilities:
    - utils/jwt.js wraps jsonwebtoken (sign/verify) with configurable expiry.
    - utils/cookies.js centralizes secure cookie options and set/clear helpers.
    - utils/format.js formats Zod errors for API responses.
- Data layer (Drizzle + Neon)
  - src/config/database.js initializes Neon HTTP client and Drizzle. In development, Neon local overrides (neonConfig) are applied.
  - Schema defined in src/models/\*.js (e.g., users table with unique email, timestamps).
  - Drizzle config (drizzle.config.js) points schema to src/models and outputs SQL migrations to drizzle/.
  - Migrations are generated (db:generate) and applied (db:migrate); a sample migration exists under drizzle/.
- Logging
  - Winston logger (src/config/logger.js) with JSON logs, timestamps, and error stacks; writes to logs/ files and console in non-production.
  - morgan (combined) piped into Winston.
- Health and observability
  - GET /health returns JSON with status, timestamp, and formatted uptime. Used by Docker healthchecks.
  - GET /api returns a simple status message.
- Containerization and local dev
  - Dockerfile defines multi-stage builds (development, build, production) on Node 20-alpine. Healthchecks query /health.
  - docker-compose.dev.yml: runs Neon Local (5432) and the app (3000) with volumes for hot reload. Requires .env.development.
  - docker-compose.prod.yml: runs the production target with healthchecks and hardened container options. Requires .env.production.

Environment

- Required/used variables (via dotenv and Docker compose files):
  - DATABASE_URL (PostgreSQL connection, Neon or Neon Local)
  - ARCJET_KEY (Arcjet service key)
  - JWT_SECRET, JWT_EXPIRES_IN
  - LOG_LEVEL
  - NODE_ENV, PORT

Endpoints (non-exhaustive)

- GET / → Hello from API!
- GET /health → JSON health payload (used by container healthchecks)
- GET /api → Basic API status
- POST /api/auth/sign-up → Create user (validates with Zod, sets auth cookie)
- POST /api/auth/sign-in → Authenticate user (validates with Zod, sets auth cookie)
- POST /api/auth/sign-out → Clear auth cookie
- GET /api/users → List users (requires DB connectivity)

CI/config and tooling

- ESLint flat config (eslint.config.js) with @eslint/js recommended rules and project-specific rules; ignores node_modules, coverage, logs, drizzle.
- Prettier configured via .prettierrc.
- .gitignore excludes node_modules, logs, .env files, IDE artifacts, and Neon local artifacts.
