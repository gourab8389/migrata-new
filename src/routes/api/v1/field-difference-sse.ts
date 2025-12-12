import { Router } from 'express';
import { fieldDifferenceSSEProgress } from '../../../controllers/api/v1/fieldDifferenceSSEController';

const router = Router();

router.get('/progress', fieldDifferenceSSEProgress);

export default router;
