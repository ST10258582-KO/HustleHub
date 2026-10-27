import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { readUsers, writeUsers } from '../utils/store.js';
import { createToken } from '../utils/jwt.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // lock after 5 consecutive failures

const loginAttempts = new Map();

function getAttemptRecord(normalEmail) {
  if (!loginAttempts.has(normalEmail)) {
    loginAttempts.set(normalEmail, { count: 0, lockedUntil: null });
  }
  return loginAttempts.get(normalEmail);
}

function isLocked(record) {
  if (record.lockedUntil && Date.now() < record.lockedUntil) return true;
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    record.count = 0;
    record.lockedUntil = null;
  }
  return false;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input.', details: errors.array().map(e => e.msg) });
  const { name, email, password, role = 'client' } = req.body;
  const normalEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  if (process.env.USE_MONGO === 'true') {
    const existing = await User.findOne({ email: normalEmail });
    if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });
    const user = await User.create({ name: name.trim(), email: normalEmail, passwordHash, role });
    logger.info('User registered', { email: normalEmail, role, ip: req.ip, requestId: req.id });
    return res.status(201).json({ message: 'Registration successful.', user: publicUser({ ...user.toObject(), id: user._id.toString() }) });
  }

  const users = await readUsers();
  if (users.some(u => u.email === normalEmail)) return res.status(409).json({ error: 'An account with that email already exists.' });
  const user = { id: crypto.randomUUID(), name: name.trim(), email: normalEmail, passwordHash, role };
  users.push(user);
  await writeUsers(users);
  logger.info('User registered', { email: normalEmail, role, ip: req.ip, requestId: req.id });
  res.status(201).json({ message: 'Registration successful.', user: publicUser(user) });
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input.', details: errors.array().map(e => e.msg) });
  const { email, password } = req.body;
  const normalEmail = email.trim().toLowerCase();

  const record = getAttemptRecord(normalEmail);
  if (isLocked(record)) {
    logger.warn('Login attempt on locked account', { email: normalEmail, ip: req.ip, requestId: req.id });
    return res.status(429).json({ error: 'Account temporarily locked. Please try again in 15 minutes.' });
  }

  let user;
  if (process.env.USE_MONGO === 'true') {
    const dbUser = await User.findOne({ email: normalEmail }).lean();
    if (dbUser) user = { ...dbUser, id: dbUser._id.toString() };
  } else {
    const users = await readUsers();
    user = users.find(u => u.email === normalEmail);
  }

  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!valid) {
    record.count += 1;
    logger.warn('Failed login attempt', { email: normalEmail, attempts: record.count, ip: req.ip, requestId: req.id });
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCK_DURATION_MS;
    }
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  record.count = 0;
  record.lockedUntil = null;
  logger.info('User logged in', { email: normalEmail, role: user.role, ip: req.ip, requestId: req.id });
  res.json({ message: 'Login successful.', token: createToken(user), user: publicUser(user) });
}

export async function me(req, res) {
  if (process.env.USE_MONGO === 'true') {
    const user = await User.findById(req.user.sub).select('name email role').lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } });
  }
  res.json({ user: { id: req.user.sub, email: req.user.email, role: req.user.role } });
}
