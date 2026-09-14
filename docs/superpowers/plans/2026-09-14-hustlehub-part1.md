# HustleHub+ Part 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure Node.js/Express backend API with HTTPS, JWT auth, bcrypt password hashing, input validation, and safe error handling.

**Architecture:** Express app split into routes/controllers/middleware/models layers. An in-memory array stores users for Part 1. A Node `https` server wraps the app using a self-signed SSL cert.

**Tech Stack:** Node.js, Express, bcryptjs, jsonwebtoken, express-validator, helmet, uuid, dotenv, Jest, Supertest

---

## File Map

| File | Responsibility |
|------|---------------|
| `backend/package.json` | Dependencies and npm scripts |
| `backend/.env` | Runtime secrets (gitignored) |
| `backend/.env.example` | Committed env template |
| `backend/.gitignore` | Excludes node_modules, .env, certs |
| `backend/certs/key.pem` | SSL private key (gitignored) |
| `backend/certs/cert.pem` | SSL certificate (gitignored) |
| `backend/src/models/user.store.js` | In-memory user array + CRUD helpers |
| `backend/src/middleware/validate.middleware.js` | Runs express-validator, returns 400 on failure |
| `backend/src/middleware/auth.middleware.js` | Verifies JWT, attaches req.user |
| `backend/src/controllers/auth.controller.js` | register, login, getProfile logic |
| `backend/src/routes/auth.routes.js` | Express router with validation rules wired in |
| `backend/app.js` | Express app: helmet, routes, 404 + error handlers |
| `backend/server.js` | HTTPS server entry point |
| `backend/tests/user.store.test.js` | Unit tests for user store |
| `backend/tests/auth.test.js` | Integration tests for all auth endpoints |
| `README.md` | Architecture diagram, security rationale, setup instructions |
| `HustleHub.postman_collection.json` | Postman collection (root of repo) |

---

## Task 1: Project Scaffold

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `backend/src/controllers/` (empty dir placeholder)
- Create: `backend/src/routes/` (empty dir placeholder)
- Create: `backend/src/middleware/` (empty dir placeholder)
- Create: `backend/src/models/` (empty dir placeholder)
- Create: `backend/certs/` (empty dir placeholder)
- Create: `backend/tests/` (empty dir placeholder)

- [ ] **Step 1: Create the backend directory structure**

Run in Git Bash from `C:/Users/Kento/Projects/HustleHub`:
```bash
mkdir -p backend/src/controllers backend/src/routes backend/src/middleware backend/src/models backend/certs backend/tests
```

- [ ] **Step 2: Create `backend/package.json`**

```json
{
  "name": "hustlehub-backend",
  "version": "1.0.0",
  "description": "HustleHub+ secure backend API - Part 1",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --forceExit --detectOpenHandles"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.2.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "supertest": "^7.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "testTimeout": 15000
  }
}
```

- [ ] **Step 3: Create `backend/.env.example`**

```
PORT=3000
JWT_SECRET=replace_this_with_a_secret_of_at_least_32_characters
```

- [ ] **Step 4: Create `backend/.env`**

```
PORT=3000
JWT_SECRET=hustlehub_jwt_super_secret_key_2026!!
```

- [ ] **Step 5: Create root `.gitignore`**

```
node_modules/
.env
backend/certs/key.pem
backend/certs/cert.pem
```

- [ ] **Step 6: Install dependencies**

Run from `C:/Users/Kento/Projects/HustleHub/backend`:
```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit scaffold**

Run from `C:/Users/Kento/Projects/HustleHub`:
```bash
git add .gitignore backend/package.json backend/.env.example
git commit -m "scaffold: initialise backend project structure"
```

---

## Task 2: Generate Self-Signed SSL Certificate

**Files:**
- Create: `backend/certs/key.pem`
- Create: `backend/certs/cert.pem`

- [ ] **Step 1: Generate the certificate**

Run from `C:/Users/Kento/Projects/HustleHub/backend` in Git Bash:
```bash
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

Expected output:
```
Generating a RSA private key
.....+++++
writing new private key to 'certs/key.pem'
```

- [ ] **Step 2: Verify files exist**

```bash
ls certs/
```

Expected: `cert.pem  key.pem`

- [ ] **Step 3: Confirm certs are gitignored**

Run from `C:/Users/Kento/Projects/HustleHub`:
```bash
git status
```

Expected: `certs/` files do NOT appear under "Untracked files". If they do, check `.gitignore`.

---

## Task 3: In-Memory User Store (TDD)

**Files:**
- Create: `backend/src/models/user.store.js`
- Create: `backend/tests/user.store.test.js`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/user.store.test.js`:
```js
const store = require('../src/models/user.store');

beforeEach(() => store.clear());

test('create() stores a user and findByEmail() retrieves it', () => {
  store.create({ name: 'Alice', email: 'alice@test.com', passwordHash: 'hash123', role: 'client' });
  const found = store.findByEmail('alice@test.com');
  expect(found).toBeDefined();
  expect(found.name).toBe('Alice');
  expect(found.role).toBe('client');
});

test('create() lowercases the email', () => {
  store.create({ name: 'Bob', email: 'BOB@TEST.COM', passwordHash: 'hash123', role: 'client' });
  expect(store.findByEmail('bob@test.com')).toBeDefined();
});

test('create() assigns a unique id and createdAt', () => {
  const u = store.create({ name: 'Carol', email: 'carol@test.com', passwordHash: 'hash123', role: 'freelancer' });
  expect(u.id).toBeDefined();
  expect(u.createdAt).toBeInstanceOf(Date);
});

test('findById() retrieves user by id', () => {
  const u = store.create({ name: 'Dave', email: 'dave@test.com', passwordHash: 'hash123', role: 'client' });
  expect(store.findById(u.id)).toBeDefined();
  expect(store.findById(u.id).name).toBe('Dave');
});

test('findByEmail() returns undefined for unknown email', () => {
  expect(store.findByEmail('nobody@test.com')).toBeUndefined();
});

test('findById() returns undefined for unknown id', () => {
  expect(store.findById('fake-id')).toBeUndefined();
});

test('clear() empties the store', () => {
  store.create({ name: 'Eve', email: 'eve@test.com', passwordHash: 'hash', role: 'client' });
  store.clear();
  expect(store.findByEmail('eve@test.com')).toBeUndefined();
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

Run from `C:/Users/Kento/Projects/HustleHub/backend`:
```bash
npx jest tests/user.store.test.js --no-coverage
```

Expected: `FAIL` — `Cannot find module '../src/models/user.store'`

- [ ] **Step 3: Implement `backend/src/models/user.store.js`**

```js
const { v4: uuidv4 } = require('uuid');

const users = [];

const findByEmail = (email) =>
  users.find((u) => u.email === email.toLowerCase());

const findById = (id) =>
  users.find((u) => u.id === id);

const create = ({ name, email, passwordHash, role = 'client' }) => {
  const user = {
    id: uuidv4(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date(),
  };
  users.push(user);
  return user;
};

const clear = () => {
  users.length = 0;
};

module.exports = { findByEmail, findById, create, clear };
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npx jest tests/user.store.test.js --no-coverage
```

Expected:
```
PASS tests/user.store.test.js
  ✓ create() stores a user and findByEmail() retrieves it
  ✓ create() lowercases the email
  ✓ create() assigns a unique id and createdAt
  ✓ findById() retrieves user by id
  ✓ findByEmail() returns undefined for unknown email
  ✓ findById() returns undefined for unknown id
  ✓ clear() empties the store
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/user.store.js backend/tests/user.store.test.js
git commit -m "feat: add in-memory user store with unit tests"
```

---

## Task 4: Write Integration Test Suite (All Failing)

**Files:**
- Create: `backend/tests/auth.test.js`

This task writes all integration tests before any implementation exists, so they all fail. Later tasks will make them pass.

- [ ] **Step 1: Create `backend/tests/auth.test.js`**

```js
process.env.JWT_SECRET = 'test_secret_hustlehub_32chars_!!';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const store = require('../src/models/user.store');

beforeEach(() => store.clear());

// ─── REGISTER ───────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('201 - registers a new user and returns safe fields only', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Password1', role: 'client' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.role).toBe('client');
  });

  test('201 - defaults role to client when omitted', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Password1' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('client');
  });

  test('409 - rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Password1' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice2', email: 'alice@test.com', password: 'Password1' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  test('400 - rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@test.com', password: 'Password1' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('name');
  });

  test('400 - rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'Password1' });
    expect(res.status).toBe(400);
  });

  test('400 - rejects password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Pass1' });
    expect(res.status).toBe(400);
  });

  test('400 - rejects password with no number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'PasswordOnly' });
    expect(res.status).toBe(400);
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Password1' });
  });

  test('200 - returns JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'Password1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  test('401 - rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('401 - rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('400 - rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-email', password: 'Password1' });
    expect(res.status).toBe(400);
  });

  test('400 - rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com' });
    expect(res.status).toBe(400);
  });
});

// ─── PROFILE ─────────────────────────────────────────────────────────────────

describe('GET /api/auth/profile', () => {
  let token;

  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Password1' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.com', password: 'Password1' });
    token = res.body.token;
  });

  test('200 - returns profile for authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@test.com');
    expect(res.body.name).toBe('Alice');
    expect(res.body.passwordHash).toBeUndefined();
  });

  test('401 - rejects request without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('401 - rejects malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer notarealtoken');
    expect(res.status).toBe(401);
  });

  test('401 - rejects Authorization header without Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', token);
    expect(res.status).toBe(401);
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  test('404 - returns JSON error for unknown route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

Run from `C:/Users/Kento/Projects/HustleHub/backend`:
```bash
npx jest tests/auth.test.js --no-coverage
```

Expected: `FAIL` — `Cannot find module '../app'`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/auth.test.js
git commit -m "test: add full integration test suite for auth endpoints"
```

---

## Task 5: Validation Middleware

**Files:**
- Create: `backend/src/middleware/validate.middleware.js`

- [ ] **Step 1: Create `backend/src/middleware/validate.middleware.js`**

```js
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/validate.middleware.js
git commit -m "feat: add input validation middleware"
```

---

## Task 6: JWT Auth Middleware

**Files:**
- Create: `backend/src/middleware/auth.middleware.js`

- [ ] **Step 1: Create `backend/src/middleware/auth.middleware.js`**

```js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { verifyToken };
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/auth.middleware.js
git commit -m "feat: add JWT verification middleware"
```

---

## Task 7: Auth Controller

**Files:**
- Create: `backend/src/controllers/auth.controller.js`

- [ ] **Step 1: Create `backend/src/controllers/auth.controller.js`**

```js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../models/user.store');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (store.findByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = store.create({ name, email, passwordHash, role });
    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = store.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};

const getProfile = (req, res, next) => {
  try {
    const user = store.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/auth.controller.js
git commit -m "feat: add auth controller (register, login, getProfile)"
```

---

## Task 8: Auth Routes + Express App (Tests Pass Here)

**Files:**
- Create: `backend/src/routes/auth.routes.js`
- Create: `backend/app.js`

- [ ] **Step 1: Create `backend/src/routes/auth.routes.js`**

```js
const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['client', 'freelancer'])
    .withMessage('Role must be client or freelancer'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/profile', verifyToken, getProfile);

module.exports = router;
```

- [ ] **Step 2: Create `backend/app.js`**

```js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./src/routes/auth.routes');

const app = express();

app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);

// 404 — unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — never expose internals
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.message);
  res.status(500).json({ error: 'An internal server error occurred' });
});

module.exports = app;
```

- [ ] **Step 3: Run all tests — verify they PASS**

Run from `C:/Users/Kento/Projects/HustleHub/backend`:
```bash
npx jest --no-coverage
```

Expected:
```
PASS tests/user.store.test.js
PASS tests/auth.test.js

Test Suites: 2 passed, 2 total
Tests:       XX passed, XX total
```

If any test fails, fix the issue before proceeding.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/auth.routes.js backend/app.js
git commit -m "feat: wire auth routes and Express app — all tests green"
```

---

## Task 9: HTTPS Server

**Files:**
- Create: `backend/server.js`

- [ ] **Step 1: Create `backend/server.js`**

```js
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HustleHub+ API running on https://localhost:${PORT}`);
});
```

- [ ] **Step 2: Start the server and verify it runs**

Run from `C:/Users/Kento/Projects/HustleHub/backend`:
```bash
npm start
```

Expected output:
```
HustleHub+ API running on https://localhost:3000
```

- [ ] **Step 3: Test a live endpoint with curl (ignore cert warning)**

Open a second Git Bash terminal:
```bash
curl -k -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Password1"}'
```

Expected:
```json
{"message":"User registered successfully","user":{"id":"...","name":"Test","email":"test@test.com","role":"client"}}
```

Stop the server with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add backend/server.js
git commit -m "feat: add HTTPS server with self-signed SSL"
```

---

## Task 10: README

**Files:**
- Modify: `README.md` (root of repo)

- [ ] **Step 1: Write `README.md`**

```markdown
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
│   ├── controllers/auth.controller.js   # Business logic
│   ├── routes/auth.routes.js            # Route definitions + validation rules
│   ├── middleware/
│   │   ├── auth.middleware.js           # JWT verification
│   │   └── validate.middleware.js       # express-validator runner
│   └── models/user.store.js             # In-memory user array
├── certs/                               # SSL cert (gitignored, generate locally)
├── app.js                               # Express setup
├── server.js                            # HTTPS entry point
└── .env                                 # Secrets (gitignored)
```

---

## Security Decisions

### Password Hashing
Passwords are hashed with **bcryptjs** using 12 salt rounds before being stored. Plain-text passwords are never retained in memory or logs. On login, `bcrypt.compare()` verifies the submitted password against the stored hash — the hash cannot be reversed.

### JWT Authentication
After a successful login, the API issues a **JSON Web Token** signed with `JWT_SECRET` (stored in `.env`, never hardcoded). The token payload carries `{ id, email, role }` and expires in 1 hour. Every protected route passes through the `verifyToken` middleware, which decodes and validates the token and attaches `req.user` for downstream handlers. An invalid or missing token returns `401 Unauthorized`.

### Input Validation
All incoming data is validated with **express-validator** before it reaches business logic. Registration requires: a non-empty name, a valid email address, and a password of at least 8 characters containing at least one number. Validation failures return `400 Bad Request` with field-level error messages — no raw stack traces are ever returned.

### HTTPS
The API runs exclusively over **HTTPS** using a locally-generated self-signed certificate (see Setup). The Node `https` module wraps Express, ensuring all traffic is encrypted in transit. Production deployments would use a CA-signed certificate.

### Security Headers
**Helmet** is applied globally, setting headers including `X-Content-Type-Options`, `X-Frame-Options`, and a `Content-Security-Policy` to protect against common web attacks.

### Safe Error Handling
A global error handler catches any unhandled errors and returns `{ "error": "An internal server error occurred" }`. Stack traces, file paths, and configuration values are never exposed to clients.

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
# Edit .env and set a strong JWT_SECRET (min 32 characters)
```

### 3. Generate SSL certificate

```bash
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### 4. Start the server

```bash
npm start
# API available at https://localhost:3000
```

### 5. Run tests

```bash
npm test
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
{ "name": "Alice", "email": "alice@example.com", "password": "Password1", "role": "client" }
```
`role` is optional, defaults to `"client"`. Accepted values: `"client"`, `"freelancer"`.

**201 Success:**
```json
{ "message": "User registered successfully", "user": { "id": "...", "name": "Alice", "email": "alice@example.com", "role": "client" } }
```

**400 Validation error:**
```json
{ "errors": [{ "field": "password", "message": "Password must contain at least one number" }] }
```

**409 Duplicate email:**
```json
{ "error": "Email already registered" }
```

### Login — `POST /api/auth/login`

**Request body:**
```json
{ "email": "alice@example.com", "password": "Password1" }
```

**200 Success:**
```json
{ "token": "<JWT>" }
```

**401 Invalid credentials:**
```json
{ "error": "Invalid credentials" }
```

### Profile — `GET /api/auth/profile`

**Header:** `Authorization: Bearer <JWT>`

**200 Success:**
```json
{ "id": "...", "name": "Alice", "email": "alice@example.com", "role": "client", "createdAt": "..." }
```

**401 No/invalid token:**
```json
{ "error": "Access denied. No token provided." }
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with architecture and security rationale"
```

---

## Task 11: Postman Collection

**Files:**
- Create: `HustleHub.postman_collection.json` (root of repo)

- [ ] **Step 1: Create `HustleHub.postman_collection.json`**

```json
{
  "info": {
    "name": "HustleHub+ Part 1",
    "_postman_id": "hustlehub-part1",
    "description": "Auth endpoint tests for HustleHub+ Part 1",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "https://localhost:3000" },
    { "key": "token", "value": "" }
  ],
  "item": [
    {
      "name": "Register - Success",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/register",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Alice Smith\", \"email\": \"alice@example.com\", \"password\": \"Password1\", \"role\": \"freelancer\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Status 201', () => pm.response.to.have.status(201));",
            "pm.test('Has user object', () => pm.expect(pm.response.json().user).to.be.an('object'));",
            "pm.test('No passwordHash exposed', () => pm.expect(pm.response.json().user.passwordHash).to.be.undefined);"
          ]
        }
      }]
    },
    {
      "name": "Register - Duplicate Email (409)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/register",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Alice Smith\", \"email\": \"alice@example.com\", \"password\": \"Password1\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 409', () => pm.response.to.have.status(409));"]
        }
      }]
    },
    {
      "name": "Register - Invalid Email (400)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/register",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Bob\", \"email\": \"not-an-email\", \"password\": \"Password1\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 400', () => pm.response.to.have.status(400));"]
        }
      }]
    },
    {
      "name": "Register - Weak Password (400)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/register",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Bob\", \"email\": \"bob@example.com\", \"password\": \"weak\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 400', () => pm.response.to.have.status(400));"]
        }
      }]
    },
    {
      "name": "Login - Success",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"alice@example.com\", \"password\": \"Password1\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Has token', () => pm.expect(pm.response.json().token).to.be.a('string'));",
            "pm.collectionVariables.set('token', pm.response.json().token);"
          ]
        }
      }]
    },
    {
      "name": "Login - Wrong Password (401)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"alice@example.com\", \"password\": \"WrongPass1\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Status 401', () => pm.response.to.have.status(401));",
            "pm.test('No stack trace', () => pm.expect(pm.response.text()).to.not.include('at '));"
          ]
        }
      }]
    },
    {
      "name": "Login - Unknown Email (401)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"nobody@example.com\", \"password\": \"Password1\"}"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 401', () => pm.response.to.have.status(401));"]
        }
      }]
    },
    {
      "name": "Profile - Authenticated (200)",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/auth/profile",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Status 200', () => pm.response.to.have.status(200));",
            "pm.test('Has email', () => pm.expect(pm.response.json().email).to.be.a('string'));",
            "pm.test('No passwordHash', () => pm.expect(pm.response.json().passwordHash).to.be.undefined);"
          ]
        }
      }]
    },
    {
      "name": "Profile - No Token (401)",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/auth/profile"
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 401', () => pm.response.to.have.status(401));"]
        }
      }]
    },
    {
      "name": "Profile - Invalid Token (401)",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/auth/profile",
        "header": [{ "key": "Authorization", "value": "Bearer notavalidtoken" }]
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 401', () => pm.response.to.have.status(401));"]
        }
      }]
    },
    {
      "name": "Unknown Route (404)",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/nonexistent"
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": ["pm.test('Status 404', () => pm.response.to.have.status(404));"]
        }
      }]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add HustleHub.postman_collection.json
git commit -m "test: add Postman collection covering all auth scenarios"
```

---

## Task 12: Open in VS Code

- [ ] **Step 1: Open project in VS Code**

Run from `C:/Users/Kento/Projects/HustleHub`:
```bash
code .
```

- [ ] **Step 2: Run final test suite to confirm everything is green**

In the VS Code terminal:
```bash
cd backend && npm test
```

Expected:
```
Test Suites: 2 passed, 2 total
Tests:       XX passed, 0 failed
```

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete HustleHub+ Part 1 — secure backend foundations"
```

---

## Self-Review Against Spec

| Spec Requirement | Task |
|-----------------|------|
| Node.js + Express backend | Task 1, 8 |
| bcrypt password hashing | Task 7 |
| JWT login + protected routes | Task 6, 7, 8 |
| HTTPS with self-signed cert | Task 2, 9 |
| Input validation (express-validator) | Task 5, 8 |
| Controlled error responses | Task 8 (app.js error handler) |
| Security headers (helmet) | Task 8 (app.js) |
| Clean code structure (routes/controllers/middleware/models) | Tasks 5-8 |
| README with architecture + security rationale | Task 10 |
| Postman collection | Task 11 |
| All tests green | Task 8, Step 3 |
