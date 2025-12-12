import { Router } from 'express';
import { getObjectFields } from '../../../controllers/api/v1/objectFieldsController';

const router = Router();

router.get('/', getObjectFields);

export default router;
