import { Router } from 'express';
import { triggerOperation } from '../../../controllers/api/v1/triggerController';

const router = Router();

router.get('/', triggerOperation);

export default router;
