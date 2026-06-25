import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getRecommendations, chatWithAssistant } from '../controllers/aiController.js';

const router = Router();

router.get('/recommendations', authenticate, getRecommendations);
router.post('/chat', authenticate, chatWithAssistant);

export default router;
