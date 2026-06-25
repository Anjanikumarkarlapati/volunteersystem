import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getRecommendations } from '../controllers/aiController.js';

const router = Router();

router.get('/recommendations', authenticate, getRecommendations);

export default router;
