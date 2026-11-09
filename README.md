# HustleHub+

HustleHub+ is a secure MERN freelance marketplace. Freelancers post service listings, clients browse and book those services, and administrators manage the platform. The system handles sensitive data — credentials, booking records, income figures — so security is built into every layer rather than added after the fact.

## Intended users

**Clients** register, browse gig listings, book freelancers they want to work with, and view their booking history. Each booking creates a matching transaction record.

**Freelancers** publish gigs, manage their own listings, view booking history, and access a financial dashboard showing gross income, an estimated 20% tax deduction, and net earnings visualised with charts.

**Administrators** view all registered users and all gig listings from a protected admin panel, and can remove accounts or listings that violate platform rules.

## Architecture

```text
                         SYSTEM BOUNDARY
┌─────────────────────────────────────────────────────────────┐
│                         HTTPS / TLS                         │
│                                                             │
│  ┌───────────────┐       REST/JWT       ┌────────────────┐  │
│  │ Users         │ ───────────────────> │ React Frontend │  │
│  │ Client        │                      └───────┬────────┘  │
│  │ Freelancer    │                              │            │
│  │ Admin         │                              │ HTTPS      │
│  └───────────────┘                              ▼            │
│                                      ┌────────────────────┐  │
│                                      │ Express Backend    │  │
│                                      │ Validation / XSS   │  │
│                                      │ Sanitisation       │  │
│                                      │ Rate Limiting      │  │
│                                      │ Helmet / CSP       │  │
│                                      │ JWT / RBAC         │  │
│                                      │ Account Lockout    │  │
│                                      │ Error Handling     │  │
│                                      │ Winston Logging    │  │
│                                      └─────────┬──────────┘  │
│                                                │             │
│                                      ┌─────────▼──────────┐  │
│                                      │ MongoDB            │  │
│                                      │ Users              │  │
│                                      │ Gigs               │  │
│                                      │ Bookings           │  │
│                                      │ Transactions       │  │
│                                      └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Part 1 built the Express backend with HTTPS, bcrypt, JWT and input validation. Part 2 extended it into a full MERN stack with React, MongoDB, RBAC, gigs, bookings and transactions. Part 3 adds DevSecOps tooling (CI/CD, static analysis, Docker pipeline), structured logging, a visual finance dashboard, and two additional security controls.

---

## Running locally (without Docker)

### Prerequisites
- Node.js 20+
- MongoDB running on `localhost:27017` (or MongoDB Atlas URI)

### Backend

```bash
npm install --prefix backend
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET (min 32 chars) and MONGO_URI
npm run dev --prefix backend
```

The API listens on `https://localhost:3443`. Because the development certificate is self-signed, browsers and tools need to disable SSL verification for local use.

### Frontend

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

The React app opens at `http://localhost:5173`. The Vite dev server proxies all `/api` requests to `https://localhost:3443`.

### File-based mode (no MongoDB, Part 1 compatibility)

Set `USE_MONGO=false` in `backend/.env`. User data is stored in `backend/data/users.json`. Gig and booking routes require MongoDB and are not available in this mode.

### Local certificate

If the certificates in `backend/certs/` are missing, generate new ones:

```bash
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout backend/certs/server.key \
  -out backend/certs/server.crt \
  -days 365 -subj "/CN=localhost"
```

---

## Running with Docker

Requires Docker Desktop and a `JWT_SECRET` environment variable set in your shell.

```bash
export JWT_SECRET="your-secret-at-least-32-characters"
docker compose up --build
```

| Service   | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:5173    |
| Backend   | https://localhost:3443   |
| MongoDB   | localhost:27017          |

Log files from the backend are persisted in the `backend-logs` Docker volume.

---

## API endpoints

### Auth — `POST /api/auth/register`

| Field      | Type   | Rules                              |
|------------|--------|------------------------------------|
| `name`     | string | 1–100 chars                        |
| `email`    | string | Valid email, normalised            |
| `password` | string | 8–128 chars                        |
| `role`     | string | `client`, `freelancer`, or `admin` |

Returns 201 with `{ message, user }`. Returns 409 on duplicate email, 400 on validation failure.

### Auth — `POST /api/auth/login`

Returns 200 with `{ message, token, user }`. Returns 401 on wrong credentials. Returns 429 if the account is temporarily locked (5 failed attempts).

### Auth — `GET /api/auth/me` *(requires JWT)*

Returns the current user's profile.

### Gigs — `GET /api/gigs`

Public. Returns all active gigs.

### Gigs — `GET /api/gigs/:id`

Public. Returns a single active gig.

### Gigs — `POST /api/gigs` *(freelancer only)*

| Field         | Rules             |
|---------------|-------------------|
| `title`       | 3–100 chars       |
| `description` | 10–1000 chars     |
| `price`       | Number, 1–1000000 |

Content is sanitised for XSS before storage.

### Gigs — `PUT /api/gigs/:id` *(freelancer, own gigs only)*

Partial update. Same field rules as create, all optional.

### Gigs — `DELETE /api/gigs/:id` *(freelancer, own gigs only)*

Soft delete — sets `active: false`.

### Bookings — `POST /api/bookings` *(client only)*

| Field   | Rules           |
|---------|-----------------|
| `gigId` | Valid MongoDB ID |

Creates a Booking and Transaction atomically. Returns 201 with both records.

### Bookings — `GET /api/bookings/mine` *(any authenticated user)*

Returns bookings where the caller is either the client or the freelancer.

### Bookings — `GET /api/bookings/finance` *(freelancer only)*

Returns `transactionCount`, `totalIncome`, `estimatedTax` (20%), `netAfterEstimatedTax`, and the full `transactions` array.

> The 20% tax figure is an educational estimate only and does not constitute South African tax advice.

### Admin — `GET /api/admin/users` *(admin only)*

Returns all users without password hashes.

### Admin — `GET /api/admin/gigs` *(admin only)*

Returns all gigs including soft-deleted ones.

### Admin — `GET /api/admin/bookings` *(admin only)*

Returns all bookings.

### Admin — `DELETE /api/admin/users/:id` *(admin only)*

Hard deletes a user.

### Admin — `DELETE /api/admin/gigs/:id` *(admin only)*

Hard deletes a gig.

### Health — `GET /api/health`

Returns `{ status: "ok", service: "HustleHub+ API" }`.

---

## Security implementation

### Password hashing

Passwords are hashed with bcrypt at work factor 12 before being written to the database. The raw password is discarded immediately after hashing and is never stored or included in any API response.

### JWT authentication

A signed JWT is issued on successful login. The token encodes the user's ID, email and role and is signed with a secret of at least 32 characters. All protected routes pass through the `authenticate` middleware, which verifies the signature, the issuer claim (`hustlehub-plus`) and the expiry before allowing the request to continue. Any missing or tampered token receives a 401.

### Role-based access control (RBAC)

Every sensitive route is guarded by `allowRoles()` middleware that reads the role from the verified JWT. Freelancers may create, edit and delete only their own gigs. Clients may only create bookings. Admin endpoints are restricted to the admin role. Gig ownership is enforced at the controller level in addition to the role check — a freelancer who does not own a gig receives a 403 when attempting to modify it.

### Input validation

All registration and login inputs are validated with express-validator before any processing occurs. Invalid requests receive a 400 with a structured array of field-level error messages. No request with invalid input reaches the database.

### XSS sanitisation

Gig titles and descriptions pass through the `xss` library on every write. The library is configured with an empty HTML whitelist, strip-ignore-tag mode and script/style body removal, which strips all tags and event-handler attributes. If sanitisation reduces a field to an empty string it is rejected with a 400. This prevents stored XSS attacks.

### NoSQL injection prevention

`express-mongo-sanitize` removes MongoDB operator keys (those beginning with `$`) from request bodies, query strings and URL parameters before they reach the application logic.

### Rate limiting

A global rate limiter permits 200 requests per 15-minute window. Authentication routes have their own tighter limit of 20 requests per 15 minutes. The booking creation endpoint has a separate limit of 30 requests per 15 minutes. All three return a plain-English JSON `error` field when the limit is exceeded.

### Security headers (Helmet + CSP)

Helmet applies a strict set of HTTP security headers on every response. The Content Security Policy restricts scripts and styles to the same origin (`'self'`), blocks all object embeds, and sets `frameAncestors 'none'` to prevent clickjacking. `unsafe-inline` is excluded from `styleSrc`. The `X-Powered-By` header is disabled to avoid advertising the server framework.

### HTTPS

The API is served over HTTPS using a locally generated self-signed development certificate. This ensures credentials and tokens cannot be intercepted as plain text during local demonstrations.

### Controlled error handling

The global error handler returns a generic message and never exposes stack traces, file paths or configuration values in responses. All internal error details are written to the server log instead.

---

## Additional security features

### 1 — Account lockout (brute force protection)

The login endpoint tracks failed attempts per email address. After five consecutive failures the account is locked for 15 minutes and further attempts return a 429 with a clear message. The counter resets on a successful login and the lock clears automatically after the window expires. Every failed attempt and every lock event is recorded in the Winston security log along with the originating IP address.

### 2 — XSS content sanitisation on user input

In addition to the express-validator field checks, every piece of user-submitted gig content (title and description) is passed through the `xss` library on write. The library's strictest option set is used — empty whitelist, strip-ignore-tag mode, script and style body removal. The sanitised output is what gets persisted, meaning no executable markup can reach the database regardless of how data is later retrieved or rendered.

### 3 — Request ID tracing

Every incoming HTTP request is assigned a cryptographically random UUID by the `requestId` middleware, which runs before all route handlers. The ID is:
- Attached to `req.id` for use in controller-level log entries
- Returned in the `X-Request-Id` response header so clients and reverse proxies can correlate requests
- Included in every security-relevant log entry (login, booking, admin actions)

This creates a full audit trail where each log entry can be linked to the exact HTTP request that produced it, which is essential for security incident investigation.

### Cloud logging (Logtail / Better Stack)

If a `LOGTAIL_TOKEN` environment variable is set, Winston automatically ships all log entries to the configured Better Stack source in real time. This enables centralised log storage, alerting, and dashboard visualisation without changing any application code. Without the token the application falls back to file-based logging.

---

## Security review

This section maps common threat categories to the specific controls in place.

### Injection attacks

**Threat:** Malicious operators injected into MongoDB queries via JSON request bodies (e.g. `{ "email": { "$gt": "" } }`).

**Protection:** `express-mongo-sanitize` removes all keys beginning with `$` or containing `.` from every incoming request before it reaches the application. Mongoose parameterises all queries by default, adding a second layer.

### Cross-site scripting (XSS)

**Threat:** Script tags or event-handler attributes embedded in user-submitted gig content that execute in another user's browser.

**Protection (stored XSS):** The `xss` library strips all HTML from gig titles and descriptions on write. No executable markup is stored.

**Protection (reflected XSS):** Helmet's Content Security Policy restricts all script execution to `'self'` and blocks inline scripts, so even if malicious content somehow reached the page, the browser policy would refuse to execute it.

### Authentication weaknesses

**Threat:** Weak or plain-text passwords compromised in a data breach.
**Protection:** bcrypt with work factor 12. The hash is a one-way function; the original password cannot be recovered from the stored value.

**Threat:** Brute-force attacks against the login endpoint.
**Protection:** Account lockout after five failures for 15 minutes. The authentication route also has a tighter rate limit (20 requests per 15 minutes) to slow automated attacks further.

**Threat:** JWT interception or replay on an unencrypted channel.
**Protection:** The API is HTTPS-only. The JWT includes an issuer claim and an expiry, both of which are verified on every request.

**Threat:** Weak JWT signing secret.
**Protection:** The `.env.example` requires a minimum 32-character secret and Docker Compose enforces this with a mandatory variable substitution that aborts startup if the value is missing.

### Access control issues

**Threat:** Privilege escalation — a client accessing freelancer-only endpoints, or vice versa.
**Protection:** `allowRoles()` middleware on every sensitive route checks the role embedded in the verified JWT. Mismatched roles receive a 403.

**Threat:** Resource ownership bypass — a freelancer editing or deleting another freelancer's gig.
**Protection:** After the role check, the gig controller compares `gig.freelancerId` to `req.user.sub`. A mismatch returns a 403 before any database write occurs.

**Threat:** Unauthenticated access to protected resources.
**Protection:** The `authenticate` middleware is applied to all booking, admin and finance routes. A missing or invalid JWT is rejected with a 401 before any handler runs.

### Information disclosure

**Threat:** Internal server details (stack traces, file paths) leaking in error responses.
**Protection:** The global error handler returns a generic message only. All internal detail goes to the Winston log on the server.

**Threat:** Password hashes included in API responses.
**Protection:** The `publicUser` helper explicitly selects only `id`, `name`, `email` and `role`. Admin user listings use `.select('-passwordHash')`. No hash field is ever serialised to a response.

### Clickjacking

**Protection:** `frameAncestors 'none'` in the Content Security Policy prevents the application from being embedded in an iframe.

### Oversized payloads

**Protection:** `express.json({ limit: '10kb' })` and `express.urlencoded({ limit: '10kb' })` reject bodies over 10 KB before they are parsed, preventing memory exhaustion from large payload attacks.

---

## Logging

Structured logging is provided by Winston and writes to two files inside `backend/logs/`:

| File           | Contents                                   |
|----------------|--------------------------------------------|
| `combined.log` | All log entries (info, warn, error, http)  |
| `error.log`    | Error-level entries only                   |

HTTP access logs (every request and response code) are piped from Morgan through the same Winston stream.

**What is logged and why:**

| Event                        | Level | Why it matters                                              |
|------------------------------|-------|-------------------------------------------------------------|
| Successful login             | info  | Establishes a baseline of normal access patterns            |
| Failed login attempt         | warn  | Indicates potential credential stuffing or brute force      |
| Account lock triggered       | warn  | Signals a likely attack on a specific account               |
| New user registered          | info  | Audit trail for account creation                            |
| Booking created              | info  | Financial audit trail linking client, freelancer and amount |
| Booking creation failure     | error | Detects partial transaction failures or DB issues           |
| Admin deleting user/gig      | info  | Accountability for privileged destructive actions           |
| Unhandled server error       | error | Operational monitoring — surfaces bugs or infrastructure issues |
| All HTTP requests (Morgan)   | http  | Standard access log for security analysis and debugging     |

Logs are written in JSON format with ISO timestamps, making them machine-parseable and ready to be ingested by any log aggregation platform.

---

## Testing

### Backend unit tests (Jest + Supertest)

The backend test suite runs against the file-based storage mode (no MongoDB required) and covers 11 test cases across authentication, input validation, and token verification.

```bash
npm test --prefix backend
```

Tests cover: health check, registration (success, duplicate, invalid email, short password), login (success, wrong password, non-existent user), and the `/me` route (no token, invalid token, valid token).

### Frontend unit tests (Vitest + React Testing Library)

```bash
npm test --prefix frontend -- --run
```

Four tests cover: auth form render, switching between login and register modes, error display on a failed login, and the main app layout after a successful login. The `api` service is mocked with `vi.mock` so no network requests are made.

### API tests (Postman + Newman)

The collection in `postman/HustleHub-Part2.postman_collection.json` covers 21 requests across 4 folders: Auth, Gigs, Bookings and Gig Cleanup. Every request has test assertions. Tokens and IDs are automatically passed between requests using collection variables — no manual configuration is needed to run the collection.

```bash
npx newman run postman/HustleHub-Part2.postman_collection.json --insecure
```

The `--insecure` flag bypasses the self-signed certificate warning.

---

## CI/CD pipeline

The pipeline is defined in `.github/workflows/ci.yml` and runs on every push and pull request.

### `backend` job
1. Install dependencies (`npm ci`)
2. **Static analysis** — `npm run lint` runs ESLint with `eslint-plugin-security`, catching security anti-patterns in source code. The pipeline fails if any warning is raised.
3. **Unit tests** — `npm test` runs the Jest suite.
4. **Security audit** — `npm audit --audit-level=high` fails if any high-severity vulnerability is found in the dependency tree.
5. **Docker image build** — `docker build -t hustlehub-backend ./backend` verifies the image builds successfully.

### `frontend` job
1. Install dependencies
2. **Static analysis** — ESLint on the React source
3. **Unit tests** — Vitest
4. **Production build** — `npm run build` verifies Vite can produce a deployable bundle
5. **Security audit** — npm audit at high severity
6. **Docker image build**

### `api-tests` job
Runs after the backend job. Starts a MongoDB 8 service container, starts the backend with `USE_MONGO=true`, then runs the Newman collection. This job uses `continue-on-error: true` to avoid blocking the overall pipeline while the HTTPS self-signed cert workaround is in place.

### Static analysis result

ESLint with `eslint-plugin-security` runs against all source files. The plugin checks for unsafe regex patterns, non-literal file system access, object injection sinks and other Node.js security anti-patterns. All flagged patterns in the codebase have been addressed: `fs` calls that use variables include `eslint-disable-line` comments with justification, and `security/detect-object-injection` is disabled at the config level because Mongoose model access does not present an injection risk. The pipeline runs with `--max-warnings 0`, meaning any new unresolved finding will cause the build to fail.

---

## Docker

Both the backend and frontend are containerised. The backend image runs as a non-root user (`appuser`) for defence-in-depth. The frontend image is a two-stage build — Vite compiles the React app in a Node builder stage, then the compiled assets are served by nginx in a minimal final image.

```bash
# Build and start all services
export JWT_SECRET="your-secret-at-least-32-characters"
docker compose up --build

# Stop and remove containers
docker compose down

# Stop and remove containers and volumes
docker compose down -v
```

The `backend-logs` volume persists Winston log files across container restarts. Backend logs can be inspected with:

```bash
docker compose exec backend cat logs/combined.log
```

---

## Project structure

```
hustlehub-plus/
├── .github/workflows/ci.yml     # CI/CD pipeline
├── backend/
│   ├── certs/                   # Self-signed dev TLS certificate
│   ├── logs/                    # Winston log output (gitignored)
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── middleware/          # auth, rbac, errors
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # Express routers
│   │   └── utils/               # logger, jwt, store
│   ├── tests/                   # Jest test suite
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Auth, GigList, GigForm, BookingHistory,
│   │   │                        #   FinanceDashboard, AdminPanel
│   │   ├── services/api.js      # Fetch wrapper
│   │   └── App.jsx
│   ├── nginx.conf               # nginx SPA + proxy config
│   ├── Dockerfile
│   └── package.json
├── postman/                     # Postman/Newman collections
├── docs/architecture.md
├── docker-compose.yml
└── README.md
```

---

*ST10258582 — APDS7311 / INSY7314 POE Part 3 — HustleHub+ Secure Freelance Marketplace*
