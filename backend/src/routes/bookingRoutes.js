import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import { createBooking, myBookings, myFinance } from '../controllers/bookingController.js';

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Too many booking requests. Please try again in 15 minutes.' }),
});

router.use(authenticate);
router.get('/mine', myBookings);
router.get('/finance', allowRoles('freelancer'), myFinance);
router.post('/', bookingLimiter, allowRoles('client'), body('gigId').isMongoId(), createBooking);

export default router;
