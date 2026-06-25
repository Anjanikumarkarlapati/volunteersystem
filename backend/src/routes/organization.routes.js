import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getMyOrganizationProfile,
  getOrganization,
  listOrganizationProfiles,
  updateMyOrganizationProfile,
  verifyOrganization,
} from '../controllers/organization.controller.js';

const router = Router();

router.get('/me', authenticate, authorize('organization'), getMyOrganizationProfile);
router.put(
  '/me',
  authenticate,
  authorize('organization'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 180 }),
    body('website').optional({ nullable: true, checkFalsy: true }).isURL({ require_tld: false }),
    body('mission').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 4000 }),
    validate,
  ],
  updateMyOrganizationProfile
);
router.get('/', authenticate, authorize('admin'), listOrganizationProfiles);
router.get(
  '/:id',
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  getOrganization
);
router.patch(
  '/:id/verify',
  authenticate,
  authorize('admin'),
  [
    param('id').isString().trim().isLength({ min: 36, max: 36 }),
    body('verified').optional().isBoolean(),
    validate,
  ],
  verifyOrganization
);

export default router;
