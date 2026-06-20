import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCertificate,
  downloadCertificate,
  listCertificates,
  listMyCertificates,
  issueCertificatesFromEvent,
} from '../controllers/certificate.controller.js';

const router = Router();

router.get('/me', authenticate, authorize('volunteer'), listMyCertificates);
router.get('/', authenticate, authorize('organization', 'admin'), listCertificates);
router.post(
  '/',
  authenticate,
  authorize('organization', 'admin'),
  [
    body('volunteer_id').isString(),
    body('event_id').optional({ nullable: true, checkFalsy: true }).isString(),
    body('opportunity_id').optional({ nullable: true, checkFalsy: true }).isString(),
    body('title').optional().trim().isLength({ min: 3, max: 180 }),
    body('hours').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
    validate,
  ],
  createCertificate
);
router.get('/:id/download', authenticate, [param('id').isString(), validate], downloadCertificate);
router.post(
  '/event/:eventId/issue',
  authenticate,
  authorize('organization', 'admin'),
  [
    param('eventId').isString(),
    body('volunteerIds').isArray({ min: 1 }),
    body('volunteerIds.*').isString(),
    body('hoursMap').optional().isObject(),
    body('title').optional().trim().isLength({ min: 3, max: 180 }),
    validate,
  ],
  issueCertificatesFromEvent
);

export default router;
