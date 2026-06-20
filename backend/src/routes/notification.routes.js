import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createAdminNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notification.controller.js';

const router = Router();

router.get('/', authenticate, listNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, [param('id').isUUID(), validate], markNotificationRead);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('user_id').isUUID(),
    body('title').trim().isLength({ min: 2, max: 160 }),
    body('message').trim().isLength({ min: 2 }),
    body('type').optional().trim().isLength({ min: 2, max: 40 }),
    validate,
  ],
  createAdminNotification
);

export default router;
