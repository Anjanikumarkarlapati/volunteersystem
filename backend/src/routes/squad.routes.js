import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addSquadMember,
  createSquad,
  getSquad,
  listMySquads,
} from '../controllers/squad.controller.js';

const router = Router();

router.use(authenticate, authorize('volunteer'));

router.get('/', listMySquads);
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 140 }),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }),
    validate,
  ],
  createSquad
);
router.get(
  '/:id',
  [param('id').isString().trim().isLength({ min: 36, max: 36 }), validate],
  getSquad
);
router.post(
  '/:id/members',
  [
    param('id').isString().trim().isLength({ min: 36, max: 36 }),
    body('volunteer_id').isString().trim().isLength({ min: 36, max: 36 }),
    validate,
  ],
  addSquadMember
);

export default router;
