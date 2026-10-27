import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many authentication requests. Please try again in 15 minutes.' }),
});

router.use(authLimiter);

const name = body('name').trim().isLength({ min: 2, max: 80 }).matches(/^[\p{L} .'-]+$/u).withMessage('Name contains invalid characters.');
const email = body('email').trim().isEmail().normalizeEmail().withMessage('A valid email address is required.');
const password = body('password').isString().isLength({ min: 8, max: 128 }).withMessage('Password must contain 8 to 128 characters.');
const role = body('role').optional().isIn(['client', 'freelancer', 'admin']).withMessage('Role must be client, freelancer, or admin.');

router.post('/register', name, email, password, role, register);
router.post('/login', email, password, login);
router.get('/me', authenticate, me);
export default router;
