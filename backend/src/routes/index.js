import { Router } from 'express';
import authRoutes from './auth.routes.js';
import volunteerRoutes from './volunteer.routes.js';
import organizationRoutes from './organization.routes.js';
import opportunityRoutes from './opportunity.routes.js';
import applicationRoutes from './application.routes.js';
import eventRoutes from './event.routes.js';
import attendanceRoutes from './attendance.routes.js';
import certificateRoutes from './certificate.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './report.routes.js';
import uploadRoutes from './upload.routes.js';
import feedbackRoutes from './feedback.routes.js';
import squadRoutes from './squad.routes.js';
import aiRoutes from './ai.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/organizations', organizationRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/applications', applicationRoutes);
router.use('/events', eventRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/uploads', uploadRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/squads', squadRoutes);
router.use('/ai', aiRoutes);

export default router;
