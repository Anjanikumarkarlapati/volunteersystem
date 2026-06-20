import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createEvent,
  deleteEvent,
  getAssignedEvents,
  getEvent,
  listEvents,
  updateEvent,
} from '../controllers/event.controller.js';
import { assignVolunteers, listEventAttendance } from '../controllers/attendance.controller.js';

const router = Router();

const eventValidation = [
  body('title').trim().isLength({ min: 3, max: 180 }),
  body('start_at').isISO8601(),
  body('end_at').isISO8601(),
  body('capacity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
  validate,
];

router.get('/me/assigned', authenticate, authorize('volunteer'), getAssignedEvents);
router.get('/', authenticate, listEvents);
router.post('/', authenticate, authorize('organization', 'admin'), eventValidation, createEvent);
router.get('/:id', authenticate, [param('id').isString().notEmpty(), validate], getEvent);
router.put(
  '/:id',
  authenticate,
  authorize('organization', 'admin'),
  [param('id').isString().notEmpty(), validate],
  updateEvent
);
router.delete(
  '/:id',
  authenticate,
  authorize('organization', 'admin'),
  [param('id').isString().notEmpty(), validate],
  deleteEvent
);
router.get(
  '/:eventId/attendance',
  authenticate,
  authorize('organization', 'admin'),
  [param('eventId').isString().notEmpty(), validate],
  listEventAttendance
);
router.post(
  '/:eventId/attendance',
  authenticate,
  authorize('organization', 'admin'),
  [
    param('eventId').isString().notEmpty(),
    body('volunteerIds').optional().isArray(),
    body('volunteerId').optional().isString().notEmpty(),
    validate,
  ],
  assignVolunteers
);

export default router;
