import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getOrganizationReport,
  getPlatformReport,
  getVolunteerReport,
} from '../controllers/report.controller.js';

const router = Router();

router.get(
  '/organization',
  authenticate,
  authorize('organization', 'admin'),
  [
    query('organization_id')
      .optional()
      .isString()
      .isLength({ min: 36, max: 36 })
      .withMessage('organization_id must be a valid UUID'),
    validate,
  ],
  getOrganizationReport
);
router.get('/platform', authenticate, authorize('admin'), getPlatformReport);
router.get('/volunteer', authenticate, authorize('volunteer'), getVolunteerReport);

export default router;
