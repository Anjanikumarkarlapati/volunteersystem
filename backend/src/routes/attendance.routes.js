import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateAttendance,
  selfCheckIn,
  verifyAttendance,
  listEventAttendance,
} from '../controllers/attendance.controller.js';

const router = Router();

// Volunteer self check-in (marks themselves as Present)
router.post(
  '/:attendanceId/checkin',
  authenticate,
  authorize('volunteer'),
  [param('attendanceId').isString().notEmpty(), validate],
  selfCheckIn
);

// Org/Admin list attendance for event
router.get(
  '/event/:eventId',
  authenticate,
  authorize('organization', 'admin'),
  [param('eventId').isString().notEmpty(), validate],
  listEventAttendance
);

// Org/Admin update attendance record
router.patch(
  '/:id',
  authenticate,
  authorize('organization', 'admin'),
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(['assigned', 'attended', 'no_show', 'cancelled']),
    body('check_in_at').optional({ nullable: true, checkFalsy: true }).isISO8601(),
    body('check_out_at').optional({ nullable: true, checkFalsy: true }).isISO8601(),
    body('hours').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
    body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    validate,
  ],
  updateAttendance
);

// Admin/Org verify attendance (5-day review workflow)
router.patch(
  '/:id/verify',
  authenticate,
  authorize('organization', 'admin'),
  [
    param('id').isString().notEmpty(),
    body('action').isIn(['verify', 'reject']),
    body('reviewNotes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    validate,
  ],
  verifyAttendance
);

export default router;
