import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunity,
  listOpportunities,
  listOpportunityApplications,
  updateOpportunity,
  listNearbyOpportunities,
} from '../controllers/opportunity.controller.js';
import { applyForOpportunity } from '../controllers/application.controller.js';

const router = Router();

const opportunityValidation = [
  body('title').trim().isLength({ min: 3, max: 180 }),
  body('description').trim().isLength({ min: 10 }),
  body('category').trim().isLength({ min: 2, max: 80 }),
  body('required_skills').optional().isArray(),
  body('is_remote').optional().isBoolean(),
  body('start_date').isISO8601(),
  body('end_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('capacity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }),
  body('hours_estimate').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  body('latitude').optional({ nullable: true, checkFalsy: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ nullable: true, checkFalsy: true }).isFloat({ min: -180, max: 180 }),
  body('urgency_level').optional().isIn(['critical', 'high', 'normal', 'low']),
  body('status').optional().isIn(['draft', 'open', 'closed', 'cancelled']),
  validate,
];

router.get('/', listOpportunities);
router.post(
  '/',
  authenticate,
  authorize('organization', 'admin'),
  opportunityValidation,
  createOpportunity
);
router.get('/nearby', authenticate, listNearbyOpportunities);
router.get(
  '/:id',
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  getOpportunity
);
router.put(
  '/:id',
  authenticate,
  authorize('organization', 'admin'),
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  updateOpportunity
);
router.delete(
  '/:id',
  authenticate,
  authorize('organization', 'admin'),
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  deleteOpportunity
);
router.get(
  '/:id/applications',
  authenticate,
  authorize('organization', 'admin'),
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  listOpportunityApplications
);
router.post(
  '/:opportunityId/applications',
  authenticate,
  authorize('volunteer'),
  [
    param('opportunityId').isString().trim().isLength({ min: 36, max: 36 }),
    body('message').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    validate,
  ],
  applyForOpportunity
);

export default router;
