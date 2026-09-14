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
