import { Router } from 'express';
import { getExtraChildRecordsInTargetOrg } from '../../../controllers/api/v1/getExtraChildRecordsController';

const router = Router();

router.get('/', getExtraChildRecordsInTargetOrg);
router.post('/', getExtraChildRecordsInTargetOrg);
// Old server had POST /delete
router.post('/delete', getExtraChildRecordsInTargetOrg);

export default router;
