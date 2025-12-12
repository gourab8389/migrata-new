import { Router } from 'express';
import recordsCountController from '../../../controllers/api/v1/recordsCountController';

const router = Router();

router.get('/', recordsCountController.getRecordCount);

export default router;
