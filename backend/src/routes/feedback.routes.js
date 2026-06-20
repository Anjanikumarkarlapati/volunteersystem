import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  submitFeedback,
  getVolunteerFeedbackStats,
  getEventFeedbackStats,
  getPendingFeedback,
} from '../controllers/feedback.controller.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('attendance_id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('tags').optional().isArray(),
    body('comment').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
    body('feedback_type').isIn(['event', 'volunteer']),
    validate,
  ],
  submitFeedback
);

router.get('/pending', getPendingFeedback);
router.get(
  '/volunteer/:volunteerId/stats',
  [param('volunteerId').isUUID(), validate],
  getVolunteerFeedbackStats
);
router.get('/event/:eventId/stats', [param('eventId').isUUID(), validate], getEventFeedbackStats);

export default router;
