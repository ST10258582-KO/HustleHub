import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import { listUsers, listAllGigs, listAllBookings, deleteUser, forceDeleteGig } from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, allowRoles('admin'));
router.get('/users', listUsers);
router.get('/gigs', listAllGigs);
router.get('/bookings', listAllBookings);
router.delete('/users/:id', deleteUser);
router.delete('/gigs/:id', forceDeleteGig);

export default router;
