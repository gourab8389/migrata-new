import { Router } from 'express';
import { syncRecords, duplicateRecords } from '../../../controllers/api/v1/syncRecordsController';

const router = Router();

router.get('/', syncRecords);
router.get('/duplicates', duplicateRecords);

export default router;
