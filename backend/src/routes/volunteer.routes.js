import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getMyHours,
  getMyParticipationHistory,
  getMyVolunteerProfile,
  getVolunteer,
  listVolunteerProfiles,
  updateMyVolunteerProfile,
  getVolunteerHeatmap,
} from '../controllers/volunteer.controller.js';

const router = Router();

router.get('/me', authenticate, authorize('volunteer'), getMyVolunteerProfile);
router.put(
  '/me',
  authenticate,
  authorize('volunteer'),
  [
    body('phone').optional({ nullable: true }).trim().isLength({ max: 40 }),
    body('location').optional({ nullable: true }).trim().isLength({ max: 180 }),
    body('bio').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    body('skills').optional().isArray(),
    body('interests').optional().isArray(),
    body('availability').optional().isObject(),
    body('volunteer_type')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 60 }),
    body('institution')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 180 }),
    body('field_of_study')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 180 }),
    body('linkedin_url').optional({ nullable: true, checkFalsy: true }).isURL(),
    body('github_url').optional({ nullable: true, checkFalsy: true }).isURL(),
    validate,
  ],
  updateMyVolunteerProfile
);
router.get('/me/history', authenticate, authorize('volunteer'), getMyParticipationHistory);
router.get('/me/hours', authenticate, authorize('volunteer'), getMyHours);
router.get('/me/heatmap', authenticate, authorize('volunteer'), getVolunteerHeatmap);
router.get('/', authenticate, authorize('organization', 'admin'), listVolunteerProfiles);
router.get(
  '/:id',
  authenticate,
  authorize('organization', 'admin'),
  [param('id').isString().notEmpty(), validate],
  getVolunteer
);

export default router;
