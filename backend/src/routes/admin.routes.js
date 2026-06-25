import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changeUserStatus,
  getDashboardOverview,
  getPlatformMonitoring,
  getUsers,
  getAllVolunteerProfiles,
  getAllAttendance,
  getVolunteerCompletedTasks,
  searchEvents,
  assignTask,
  getPendingOpportunities,
  changeOpportunityStatus,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardOverview);
router.get('/users', getUsers);
router.patch(
  '/users/:id/status',
  [
    param('id').isString().trim().isLength({ min: 36, max: 36 }),
    body('status').isIn(['active', 'pending', 'suspended']),
    validate,
  ],
  changeUserStatus
);
router.get('/monitoring', getPlatformMonitoring);

// NEW admin endpoints
router.get('/volunteer-profiles', getAllVolunteerProfiles);
router.get('/attendance', getAllAttendance);
router.get(
  '/volunteers/:id/tasks',
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  getVolunteerCompletedTasks
);

// Opportunity Approvals
router.get('/opportunities/pending', getPendingOpportunities);
router.patch(
  '/opportunities/:id/status',
  [
    param('id').isString().trim().isLength({ min: 36, max: 36 }),
    body('status').isIn(['open', 'cancelled', 'draft']),
    validate,
  ],
  changeOpportunityStatus
);

// Task Assignment endpoints
router.get('/events/search', searchEvents);
router.post(
  '/assign-task',
  [
    body('volunteer_id').isString().trim().isLength({ min: 36, max: 36 }),
    body('event_id').isString().trim().isLength({ min: 36, max: 36 }),
    validate,
  ],
  assignTask
);

export default router;
