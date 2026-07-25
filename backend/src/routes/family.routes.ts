import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    createFamily, joinFamily, leaveFamily, getMyFamily,
    getFamilyById, listFamilies, updateFamily, promoteMember
} from '../controllers/family.controller';

const router = Router();

router.get('/mine', authenticate, getMyFamily);
router.get('/', authenticate, listFamilies);
router.post('/', authenticate, createFamily);
router.post('/:id/join', authenticate, joinFamily);
router.post('/leave', authenticate, leaveFamily);
router.post('/:id/promote', authenticate, promoteMember);
router.patch('/:id', authenticate, updateFamily);
router.get('/:id', authenticate, getFamilyById);

export default router;
