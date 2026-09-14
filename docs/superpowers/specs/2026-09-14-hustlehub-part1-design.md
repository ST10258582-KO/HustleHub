# HustleHub+ Part 1 — Secure Backend Foundations

**Date:** 2026-09-14
**Module:** APDS7311/w — Application Development Security
**Scope:** Part 1 only (100 marks)

---

## Purpose

Build the secure backend API for HustleHub+, a freelance marketplace platform. Part 1 establishes the foundation: user registration, login, JWT-based route protection, HTTPS, input validation, and safe error handling.

---

## Architecture

MERN stack backend only (React frontend comes in Part 2). No database yet — user data stored in an in-memory array that resets on server restart.

```
Client (Postman / browser)
       │
       │ HTTPS (TLS 1.2+)
       ▼
Express App (Node.js)
  ├── Helmet (security headers)
  ├── express-validator (input validation)
  ├── Routes → Controllers
  │     └── Auth: /api/auth/register, /api/auth/login, /api/auth/profile
  └── JWT Middleware (protects /profile and future routes)
       │
       ▼
In-Memory User Store (array of { id, name, email, passwordHash, role })
```

---

## Project Structure

```
HustleHub/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.js   # register, login, getProfile logic
│   │   ├── routes/
│   │   │   └── auth.routes.js       # Express router, wires validation + controller
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # verifyToken — validates JWT on protected routes
│   │   │   └── validate.middleware.js # runs express-validator, returns 400 on fail
│   │   └── models/
│   │       └── user.store.js        # in-memory array + CRUD helpers
│   ├── certs/
│   │   ├── cert.pem                 # self-signed SSL certificate
│   │   └── key.pem                  # private key (gitignored)
│   ├── app.js                       # Express setup: middleware, routes, error handler
│   ├── server.js                    # HTTPS server entry (reads certs, calls app)
│   ├── .env                         # JWT_SECRET, PORT (gitignored)
│   ├── .env.example                 # committed template
│   └── package.json
├── README.md
└── .gitignore
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create new user account |
| POST | `/api/auth/login` | No | Authenticate, return JWT |
| GET | `/api/auth/profile` | JWT | Return authenticated user's info |

---

## Security Decisions

### Password Hashing
- **bcryptjs** with salt rounds = 12
- Plain-text passwords are never stored or logged
- Hash compared on login via `bcrypt.compare()`

### JWT Authentication
- Token payload: `{ id, email, role }`
- Signed with `JWT_SECRET` from `.env` (minimum 32 chars)
- Expiry: 1 hour (`expiresIn: '1h'`)
- `verifyToken` middleware decodes and attaches `req.user` on every protected route

### HTTPS
- Self-signed certificate generated via `openssl` (instructions in README)
- Node `https` module wraps the Express app
- All traffic encrypted in transit; API will not serve over HTTP

### Input Validation
- `express-validator` on register: name (non-empty), email (valid format), password (min 8 chars, at least one number)
- `express-validator` on login: email (valid), password (non-empty)
- Validation errors return `400` with field-level messages; no raw stack traces exposed

### Error Handling
- Global error handler in `app.js` returns `{ error: "message" }` — never exposes stack traces, file paths, or config values
- `404` handler for unknown routes
- Auth errors return `401 Unauthorized` with generic message

### Security Headers
- **helmet** applied globally (sets X-Content-Type-Options, X-Frame-Options, CSP, etc.)

---

## Data Model (In-Memory)

```js
{
  id: uuid,           // auto-generated
  name: String,
  email: String,      // unique, lowercased
  passwordHash: String,
  role: 'client' | 'freelancer' | 'admin',  // default 'client'
  createdAt: Date
}
```

---

## Rubric Coverage

| Criteria | Target Band | How |
|----------|-------------|-----|
| README (System Architecture, Security) | 16-20 | Full arch diagram + security rationale in README |
| API Functionality (Register/Login) | 16-20 | Full edge-case handling, consistent JSON responses |
| Password Security & JWT | 16-20 | bcrypt salt=12, JWT payload + expiry, ready for route protection |
| HTTPS Implementation | 8-10 | openssl self-signed cert, https module |
| Input Validation & Error Handling | 8-10 | express-validator, global error handler, no leaks |
| Code Structure | 8-10 | routes/controllers/middleware/models cleanly separated |
| Postman Testing | 8-10 | Collection covers register, login, profile, all error cases |

---

## Out of Scope (Part 1)

- React frontend (Part 2)
- MongoDB / real database (Part 2)
- Role-based access control beyond storing role (Part 2)
- Rate limiting (Part 2)
