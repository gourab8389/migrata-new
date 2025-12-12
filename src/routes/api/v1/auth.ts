import { Router, Request, Response } from 'express';
import { authenticate, callback, checkStatus, revokeAuth } from '../../../controllers/api/v1/authController';

const router = Router();

router.get('/', authenticate);
router.get('/callback', callback);
router.get('/check-status', checkStatus);
router.get('/revoke', revokeAuth);

export default router;
