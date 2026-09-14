# HustleHub+

A secure freelance marketplace API. Part 1 establishes the backend foundation: user registration, authentication, and JWT-protected routes served over HTTPS.

---

## System Overview

**Intended Users**
- **Clients** — browse and book freelancer services
- **Freelancers** — advertise services and track income
- **Admins** — platform management (Part 2+)

**MERN Architecture**

```
Client (Postman / React — Part 2)
       │
       │ HTTPS (TLS — self-signed cert locally)
       ▼
┌─────────────────────────────────────┐
│         Express.js API              │
│  ┌──────────┐  ┌─────────────────┐  │
│  │  Helmet  │  │ express-validator│  │
│  └──────────┘  └─────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  Routes → Controllers          │  │
│  │  POST /api/auth/register       │  │
│  │  POST /api/auth/login          │  │
│  │  GET  /api/auth/profile (JWT)  │  │
│  └────────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
In-Memory User Store (Part 1)
MongoDB (Part 2+)
```

---

## Backend Structure

```
backend/
├── src/
│   ├── controllers/auth.controller.js   # Business logic (register, login, getProfile)
│   ├── routes/auth.routes.js            # Route definitions + validation rules
│   ├── middleware/
│   │   ├── auth.middleware.js           # JWT verification (verifyToken)
│   │   └── validate.middleware.js       # express-validator runner
│   └── models/user.store.js             # In-memory user array + CRUD helpers
├── certs/                               # SSL cert files (gitignored, generate locally)
├── app.js                               # Express setup: helmet, routes, error handlers
├── server.js                            # HTTPS server entry point
└── .env                                 # Secrets: PORT, JWT_SECRET (gitignored)
```

---

## Security Decisions

### Password Hashing

Passwords are hashed with **bcryptjs** using 12 salt rounds before being stored. Plain-text passwords are never retained in memory or written to any log. On login, `bcrypt.compare()` verifies the submitted password against the stored hash — the hash is a one-way function and cannot be reversed.

**Why bcrypt?** bcrypt is purpose-built for password hashing. Unlike general-purpose hashes (MD5, SHA-256), bcrypt is intentionally slow and includes a built-in salt, making brute-force and rainbow-table attacks impractical.

### JWT Authentication

After a successful login, the API issues a **JSON Web Token** signed with `JWT_SECRET` (stored in `.env`, never hardcoded). The token payload carries `{ id, email, role }` and expires in 1 hour.

Every protected route passes through the `verifyToken` middleware, which:
1. Reads the `Authorization: Bearer <token>` header
2. Verifies the token signature using `JWT_SECRET`
3. Attaches the decoded payload to `req.user`
4. Returns `401 Unauthorized` if the token is missing, malformed, or expired

**Why JWT?** JWTs are stateless — the server does not need to store session data. The token is self-contained and can be verified cryptographically on every request.

### Input Validation

All incoming request data is validated with **express-validator** before it reaches any business logic. The validation rules enforce:
- `name`: required, non-empty string
- `email`: must be a valid email format (normalised to lowercase)
- `password`: minimum 8 characters, must contain at least one number
- `role`: optional, must be `client` or `freelancer`

Validation failures return `400 Bad Request` with field-level error messages — no raw stack traces, no internal details are ever returned to the client.

### HTTPS

The API runs exclusively over **HTTPS** using a locally-generated self-signed certificate. The Node `https` module wraps the Express app, ensuring all traffic is encrypted in transit. A self-signed certificate is appropriate for local development; production deployments would use a CA-signed certificate (e.g., from Let's Encrypt).

**Why HTTPS matters:** Without HTTPS, all data transmitted between the client and server — including passwords and JWT tokens — would be visible to anyone on the network (man-in-the-middle attacks). HTTPS encrypts the channel so only the intended parties can read the data.

### Security Headers

**Helmet** is applied globally on every request. Helmet sets multiple HTTP response headers that defend against common web attacks:
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `Content-Security-Policy` — restricts resource loading

### Safe Error Handling

A global error handler catches any unhandled errors and returns only:
```json
{ "error": "An internal server error occurred" }
```
Stack traces, file paths, and configuration values are **never** exposed to clients. This prevents attackers from learning about the system's internals through error messages.

---

## Setup

### Prerequisites
- Node.js 18+
- Git Bash (for openssl on Windows)

### 1. Clone and install

```bash
git clone <repo-url>
cd HustleHub/backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET (minimum 32 characters)
```

### 3. Generate SSL certificate

```bash
cd backend
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "//CN=localhost"
```

> **Note:** On Windows with Git Bash, use `//CN=localhost` (double slash).

### 4. Start the server

```bash
npm start
# API available at https://localhost:3000
```

### 5. Run tests

```bash
npm test
```

Expected output:
```
Test Suites: 2 passed, 2 total
Tests:       24 passed, 0 failed
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register a new user |
| POST | `/api/auth/login` | None | Login, receive JWT |
| GET | `/api/auth/profile` | Bearer JWT | Get authenticated user profile |

### Register — `POST /api/auth/register`

**Request body:**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "Password1",
  "role": "freelancer"
}
```

`role` is optional, defaults to `"client"`. Accepted values: `"client"`, `"freelancer"`.

**201 Created:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "3209bc6b-196f-47de-8a35-7c716493a719",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "freelancer"
  }
}
```

**400 Validation error:**
```json
{
  "errors": [
    { "field": "password", "message": "Password must contain at least one number" }
  ]
}
```

**409 Duplicate email:**
```json
{ "error": "Email already registered" }
```

---

### Login — `POST /api/auth/login`

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "Password1"
}
```

**200 OK:**
```json
{ "token": "<JWT string>" }
```

**401 Invalid credentials:**
```json
{ "error": "Invalid credentials" }
```

---

### Profile — `GET /api/auth/profile`

**Header:** `Authorization: Bearer <JWT>`

**200 OK:**
```json
{
  "id": "3209bc6b-196f-47de-8a35-7c716493a719",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "role": "freelancer",
  "createdAt": "2026-09-14T10:00:00.000Z"
}
```

**401 No or invalid token:**
```json
{ "error": "Access denied. No token provided." }
```
