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
