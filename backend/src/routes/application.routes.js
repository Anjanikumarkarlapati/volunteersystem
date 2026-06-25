import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listApplications,
  listMyApplications,
  updateApplicationStatus,
} from '../controllers/application.controller.js';

const router = Router();

router.get('/me', authenticate, authorize('volunteer'), listMyApplications);
router.get('/', authenticate, authorize('organization', 'admin'), listApplications);
router.patch(
  '/:id/status',
  authenticate,
  authorize('organization', 'admin'),
  [
    param('id').isString().trim().isLength({ min: 36, max: 36 }),
    body('status').isIn(['pending', 'approved', 'rejected', 'withdrawn', 'waitlisted']),
    body('review_notes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    validate,
  ],
  updateApplicationStatus
);

export default router;
