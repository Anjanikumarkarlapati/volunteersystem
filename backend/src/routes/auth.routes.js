import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changePassword,
  completeGoogleRegistration,
  deleteAccount,
  googleAuth,
  linkGoogleAccount,
  login,
  logout,
  me,
  refresh,
  register,
  updateNotificationPreferences,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 120 }),
    body('email').isEmail({ require_tld: false }).normalizeEmail({ all_lowercase: true }),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['volunteer', 'organization']),
    body('organizationName')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 180 }),
    body('volunteer_type')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 60 }),
    body('skills').optional({ nullable: true, checkFalsy: true }).isArray(),
    body('interests').optional({ nullable: true, checkFalsy: true }).isArray(),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail({ require_tld: false }).normalizeEmail({ all_lowercase: true }),
    body('password').notEmpty(),
    validate,
  ],
  login
);

router.post('/google', [body('idToken').notEmpty(), validate], googleAuth);
router.post(
  '/google/complete',
  [body('tempToken').notEmpty(), body('role').isIn(['volunteer', 'organization']), validate],
  completeGoogleRegistration
);
router.post(
  '/google/link',
  [body('idToken').notEmpty(), body('email').isEmail(), body('password').notEmpty(), validate],
  linkGoogleAccount
);

router.post(
  '/forgot-password',
  [body('email').isEmail({ require_tld: false }).normalizeEmail({ all_lowercase: true }), validate],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate,
  ],
  resetPassword
);

router.post('/refresh', [body('refreshToken').notEmpty(), validate], refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put(
  '/me',
  authenticate,
  [
    body('name').optional({ nullable: true }).trim().isLength({ min: 2, max: 120 }),
    body('email')
      .optional({ nullable: true })
      .isEmail({ require_tld: false })
      .normalizeEmail({ all_lowercase: true }),
    validate,
  ],
  updateProfile
);
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
    validate,
  ],
  changePassword
);
router.delete('/me', authenticate, deleteAccount);
router.patch(
  '/notification-preferences',
  authenticate,
  [
    body('notification_preferences')
      .notEmpty()
      .withMessage('Notification preferences are required'),
  ],
  updateNotificationPreferences
);

export default router;
