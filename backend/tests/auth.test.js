import request from 'supertest';
import app from '../src/app.js';

const ts = Date.now();
const baseEmail = `testuser${ts}@example.com`;

describe('Health', () => {
  test('GET /api/health returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('POST /api/auth/register', () => {
  test('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: baseEmail,
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.email).toBe(baseEmail);
    expect(res.body.user.role).toBe('client');
  });

  test('rejects duplicate email with 409', async () => {
    const dupEmail = `dup${ts}@example.com`;
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: dupEmail,
      password: 'Password123!',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: dupEmail,
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(409);
  });

  test('rejects invalid email with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects short password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: `short${ts}@example.com`,
      password: '123',
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const loginEmail = `login${ts}@example.com`;
  const loginPassword = 'LoginPass99!';

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Tester',
      email: loginEmail,
      password: loginPassword,
    });
  });

  test('logs in successfully and returns token and user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: loginEmail,
      password: loginPassword,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(loginEmail);
  });

  test('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: loginEmail,
      password: 'WrongPassword!',
    });
    expect(res.statusCode).toBe(401);
  });

  test('rejects non-existent email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: `nobody${ts}@example.com`,
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  const meEmail = `me${ts}@example.com`;
  const mePassword = 'MePass99!';
  let token;

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Me Tester',
      email: meEmail,
      password: mePassword,
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: meEmail,
      password: mePassword,
    });
    token = loginRes.body.token;
  });

  test('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('returns 401 when invalid token provided', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });

  test('returns user data with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
  });
});

// Extra: verify health response includes version
describe('Health endpoint extended', () => {
  it('health response includes service name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('HustleHub+ API');
  });
});
