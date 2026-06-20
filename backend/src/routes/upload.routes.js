import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadProfileAsset } from '../controllers/upload.controller.js';

const router = Router();

router.post('/profile', authenticate, upload.single('file'), uploadProfileAsset);

export default router;
