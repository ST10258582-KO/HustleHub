import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/rbac.js';
import { listGigs, getGig, createGig, updateGig, deleteGig } from '../controllers/gigController.js';

const router = Router();

const title = body('title').isString().trim().isLength({ min: 3, max: 100 });
const description = body('description').isString().trim().isLength({ min: 10, max: 1000 });
const price = body('price').isFloat({ min: 1, max: 1000000 });

// GET /api/gigs?search=keyword
router.get('/', listGigs);
router.get('/:id', getGig);
router.post('/', authenticate, allowRoles('freelancer'), title, description, price, createGig);
router.put('/:id', authenticate, allowRoles('freelancer'), title.optional(), description.optional(), price.optional(), updateGig);
router.delete('/:id', authenticate, allowRoles('freelancer'), deleteGig);

export default router;
